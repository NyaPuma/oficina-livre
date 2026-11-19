"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, errorState, firstZodIssue, successState } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { requireRole, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountsPayable, invoiceLines, invoices, payments } from "@/lib/db/schema";
import { documentTotals, parseMoneyToCents } from "@/lib/format";
import { nextDocumentNumber } from "@/lib/sequence";
import { payableSchema, paymentSchema } from "@/lib/validation";

type SourceType = "ordem" | "orcamento";

async function issueInvoice(sourceType: SourceType, sourceId: number, userId: number): Promise<number> {
  const isOrder = sourceType === "ordem";

  const source = isOrder
    ? await db.query.workOrders.findFirst({
        where: (wo, { eq }) => eq(wo.id, sourceId),
        with: { customer: true, lines: true },
      })
    : await db.query.quotes.findFirst({
        where: (q, { eq }) => eq(q.id, sourceId),
        with: { customer: true, lines: true },
      });
  if (!source) throw new Error("Documento de origem não encontrado.");

  const lines = source.lines as Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    vatRateBps: number;
    discountCents: number;
  }>;
  const totals = documentTotals(lines);
  const number = await nextDocumentNumber("FT");

  return db.transaction(async (tx) => {
    const [invoice] = await tx
      .insert(invoices)
      .values({
        number,
        workOrderId: isOrder ? sourceId : null,
        quoteId: isOrder ? null : sourceId,
        siteId: "siteId" in source ? source.siteId : null,
        customerId: source.customerId,
        customerName: source.customer.name,
        customerNif: source.customer.nif,
        customerAddress: [source.customer.address, source.customer.postalCode, source.customer.city]
          .filter(Boolean)
          .join(", ") || null,
        issuedAt: new Date(),
        dueAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        status: "emitida",
        subtotalCents: totals.subtotalCents,
        vatCents: totals.vatCents,
        totalCents: totals.totalCents,
        createdBy: userId,
      })
      .returning({ id: invoices.id });

    for (const line of lines) {
      await tx.insert(invoiceLines).values({
        invoiceId: invoice.id,
        description: line.description,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        vatRateBps: line.vatRateBps,
        discountCents: line.discountCents,
      });
    }
    return invoice.id;
  });
}

async function invoiceFromForm(formData: FormData, sourceType: SourceType): Promise<ActionState> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return errorState("Documento inválido.");

  let invoiceId: number;
  try {
    invoiceId = await issueInvoice(sourceType, id, user.id);
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Não foi possível emitir a fatura.");
  }

  await logAudit(user.id, "emitir_fatura", "fatura", invoiceId, { sourceType, sourceId: id });
  revalidatePath("/faturacao");
  redirect(`/faturacao/${invoiceId}`);
}

export async function invoiceWorkOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return invoiceFromForm(formData, "ordem");
}

export async function invoiceQuote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return invoiceFromForm(formData, "orcamento");
}

export async function recordPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const data = parsed.data;
  const amountCents = parseMoneyToCents(data.amount);
  if (amountCents <= 0) return errorState("O valor deve ser superior a zero.");

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, data.invoiceId)).limit(1);
  if (!invoice || invoice.status === "anulada") return errorState("Fatura inválida.");

  const existing = await db.select({ amountCents: payments.amountCents }).from(payments).where(eq(payments.invoiceId, invoice.id));
  const alreadyPaid = existing.reduce((sum, payment) => sum + payment.amountCents, 0);
  if (amountCents > invoice.totalCents - alreadyPaid) {
    return errorState("O valor excede o saldo em aberto da fatura.");
  }

  await db.insert(payments).values({
    invoiceId: invoice.id,
    amountCents,
    method: data.method,
    reference: data.reference,
    paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
    createdBy: user.id,
  });

  const paidCents = alreadyPaid + amountCents;
  await db
    .update(invoices)
    .set({
      paidCents,
      status: paidCents >= invoice.totalCents ? "paga" : "emitida",
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoice.id));

  await logAudit(user.id, "registar_pagamento", "fatura", invoice.id, { amountCents, method: data.method });
  revalidatePath(`/faturacao/${invoice.id}`);
  revalidatePath("/faturacao");
  revalidatePath("/relatorios");
  return successState("Pagamento registado.");
}

export async function cancelInvoice(formData: FormData): Promise<void> {
  const user = await requireRole("admin", "gestor");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await db.update(invoices).set({ status: "anulada", updatedAt: new Date() }).where(eq(invoices.id, id));
  await logAudit(user.id, "anular_fatura", "fatura", id);
  revalidatePath(`/faturacao/${id}`);
  revalidatePath("/faturacao");
}

export async function createPayable(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = payableSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const data = parsed.data;
  const amountCents = parseMoneyToCents(data.amount);
  if (amountCents <= 0) return errorState("O valor deve ser superior a zero.");
  await db.insert(accountsPayable).values({
    description: data.description,
    supplierId: data.supplierId,
    amountCents,
    category: data.category,
    reference: data.reference,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
  });
  await logAudit(user.id, "criar", "conta_pagar", undefined, { description: data.description });
  revalidatePath("/financeiro");
  return successState("Conta a pagar adicionada.");
}

export async function payPayable(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await db.update(accountsPayable).set({ paidAt: new Date() }).where(eq(accountsPayable.id, id));
  await logAudit(user.id, "pagar", "conta_pagar", id);
  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
}
