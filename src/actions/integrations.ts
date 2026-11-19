"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type ActionState, errorState, firstZodIssue, successState } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { requireRole, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices, paymentIntents, signatureRequests } from "@/lib/db/schema";
import { formatMoney } from "@/lib/format";
import { createPaymentIntent } from "@/lib/payments";
import { generateDocumentPdf } from "@/lib/pdf";
import { isQualifiedSignatureEnabled, requestQualifiedSignature } from "@/lib/signature";
import { z } from "zod";

export type PaymentIntentState = ActionState & { checkoutUrl?: string | null; reference?: string | null };

const paymentSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  method: z.enum(["card", "mbway", "multibanco"]).default("card"),
});

export async function createGatewayPayment(_prev: PaymentIntentState, formData: FormData): Promise<PaymentIntentState> {
  const user = await requireUser();
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, parsed.data.invoiceId)).limit(1);
  if (!invoice || invoice.status === "anulada") return errorState("Fatura inválida.");
  const balance = invoice.totalCents - invoice.paidCents;
  if (balance <= 0) return errorState("Esta fatura já está paga.");

  const result = await createPaymentIntent({
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    amountCents: balance,
    customerEmail: null,
    method: parsed.data.method,
  });

  if (!result.externalId) return errorState(result.message ?? "Não foi possível criar o pagamento.");

  await db.insert(paymentIntents).values({
    invoiceId: invoice.id,
    provider: result.provider,
    externalId: result.externalId,
    amountCents: balance,
    status: "pendente",
    checkoutUrl: result.checkoutUrl ?? null,
    reference: result.reference ?? null,
    method: parsed.data.method,
  });
  await logAudit(user.id, "criar_intento_pagamento", "fatura", invoice.id, { provider: result.provider });
  revalidatePath(`/faturacao/${invoice.id}`);

  return {
    ...successState(result.message ?? `Pagamento de ${formatMoney(balance)} iniciado.`),
    checkoutUrl: result.checkoutUrl,
    reference: result.reference,
  };
}

export type SignatureState = ActionState & { signingUrl?: string | null };

export async function requestDocumentSignature(_prev: SignatureState, formData: FormData): Promise<SignatureState> {
  const user = await requireRole("admin", "gestor");
  const entity = String(formData.get("entity"));
  const entityId = Number(formData.get("entityId"));
  if (!["orcamento", "fatura"].includes(entity) || !Number.isInteger(entityId)) return errorState("Documento inválido.");

  const signerEmail = String(formData.get("signerEmail") ?? "");
  const signerName = String(formData.get("signerName") ?? "");

  let pdf: Buffer;
  let filename: string;
  if (entity === "orcamento") {
    const quote = await db.query.quotes.findFirst({
      where: (q, { eq }) => eq(q.id, entityId),
      with: { customer: true, vehicle: true, lines: true },
    });
    if (!quote) return errorState("Orçamento não encontrado.");
    pdf = await generateDocumentPdf({
      title: "Orçamento", number: quote.number, date: quote.createdAt, validUntil: quote.validUntil,
      customerName: quote.customer.name, customerNif: quote.customer.nif, customerPhone: quote.customer.phone,
      plate: quote.vehicle.plate, vehicle: [quote.vehicle.brand, quote.vehicle.model].filter(Boolean).join(" "),
      notes: quote.notes, lines: quote.lines, signatureLine: true,
    });
    filename = `orcamento-${quote.number}.pdf`;
  } else {
    const invoice = await db.query.invoices.findFirst({
      where: (i, { eq }) => eq(i.id, entityId),
      with: { lines: true },
    });
    if (!invoice) return errorState("Fatura não encontrada.");
    pdf = await generateDocumentPdf({
      title: "Fatura", number: invoice.number, date: invoice.issuedAt, validUntil: invoice.dueAt,
      customerName: invoice.customerName, customerNif: invoice.customerNif,
      customerAddress: invoice.customerAddress, plate: "—",
      notes: invoice.notes, lines: invoice.lines, signatureLine: true,
    });
    filename = `fatura-${invoice.number}.pdf`;
  }

  const result = await requestQualifiedSignature({
    entity: entity as "orcamento" | "fatura",
    entityId,
    documentPdf: pdf,
    filename,
    signerName: signerName || null,
    signerEmail: signerEmail || null,
  });
  if (!result.externalId) return errorState(result.message ?? "Não foi possível pedir a assinatura.");

  await db.insert(signatureRequests).values({
    entity,
    entityId,
    provider: result.provider,
    externalId: result.externalId,
    status: "pendente",
    signerName: signerName || null,
    signerEmail: signerEmail || null,
    signingUrl: result.signingUrl ?? null,
  });
  await logAudit(user.id, "pedir_assinatura", entity, entityId, { provider: result.provider });
  revalidatePath(`/${entity === "orcamento" ? "orcamentos" : "faturacao"}/${entityId}`);

  return {
    ...successState(result.message ?? "Pedido de assinatura criado."),
    signingUrl: result.signingUrl,
  };
}

export async function completeDemoSignature(formData: FormData): Promise<void> {
  const user = await requireRole("admin", "gestor");
  if (isQualifiedSignatureEnabled()) return;

  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!Number.isInteger(id) || name.length < 2) return;

  await db
    .update(signatureRequests)
    .set({ status: "concluido", signerName: name, signedAt: new Date(), updatedAt: new Date() })
    .where(eq(signatureRequests.id, id));
  await logAudit(user.id, "concluir_assinatura_demo", "assinatura", id, { name });
  revalidatePath("/orcamentos");
}

