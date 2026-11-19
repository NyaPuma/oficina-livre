"use server";

import { eq } from "drizzle-orm";
import { type ActionState, errorState, successState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { quotes, workOrders } from "@/lib/db/schema";
import { sendMail } from "@/lib/mail";

async function buildPdf(kind: "orcamento" | "ordem", id: number): Promise<{ buffer: Buffer; filename: string; email: string | null; number: string } | null> {
  if (kind === "orcamento") {
    const quote = await db.query.quotes.findFirst({
      where: eq(quotes.id, id),
      with: { customer: true, vehicle: true, lines: true },
    });
    if (!quote) return null;
    const { generateQuotePdf } = await import("@/lib/pdf");
    return {
      buffer: await generateQuotePdf({
        title: "Orçamento", number: quote.number, date: quote.createdAt, validUntil: quote.validUntil,
        customerName: quote.customer.name, customerNif: quote.customer.nif, customerPhone: quote.customer.phone,
        plate: quote.vehicle.plate, vehicle: [quote.vehicle.brand, quote.vehicle.model].filter(Boolean).join(" "),
        notes: quote.notes, lines: quote.lines, signatureLine: true,
      }),
      filename: `orcamento-${quote.number}.pdf`,
      email: quote.customer.email,
      number: quote.number,
    };
  }

  const order = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, id),
    with: { customer: true, vehicle: true, lines: true },
  });
  if (!order) return null;
  const { generateWorkOrderPdf } = await import("@/lib/pdf");
  return {
    buffer: await generateWorkOrderPdf({
      title: "Ordem de Serviço", number: order.number, date: order.createdAt,
      customerName: order.customer.name, customerNif: order.customer.nif, customerPhone: order.customer.phone,
      plate: order.vehicle.plate, vehicle: [order.vehicle.brand, order.vehicle.model].filter(Boolean).join(" "),
      odometer: order.odometer, complaint: order.complaint, diagnosis: order.diagnosis, lines: order.lines,
    }),
    filename: `ordem-servico-${order.number}.pdf`,
    email: order.customer.email,
    number: order.number,
  };
}

export async function sendDocumentByEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const kind = String(formData.get("kind")) as "orcamento" | "ordem";
  const id = Number(formData.get("id"));
  const emailOverride = String(formData.get("email") ?? "");
  if (!["orcamento", "ordem"].includes(kind) || !Number.isInteger(id)) return errorState("Documento inválido.");

  const document = await buildPdf(kind, id);
  if (!document) return errorState("Documento não encontrado.");

  const to = emailOverride || document.email;
  if (!to) return errorState("O cliente não tem email registado.");

  const sent = await sendMail(
    to,
    `${kind === "orcamento" ? "Orçamento" : "Ordem de serviço"} ${document.number} — Oficina Livre`,
    `Segue em anexo o documento ${document.number}.`,
    [{ filename: document.filename, content: document.buffer }],
  );

  return sent
    ? successState(`Documento enviado para ${to}.`)
    : errorState("Envio de email não configurado. Configure o SMTP no .env ou use o PDF.");
}
