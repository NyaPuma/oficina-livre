"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, errorState, firstZodIssue } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { requireRole, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parts, quoteLines, quotes, serviceTemplates } from "@/lib/db/schema";
import { parseMoneyToCents } from "@/lib/format";
import { nextDocumentNumber } from "@/lib/sequence";
import { quoteSchema } from "@/lib/validation";

function parseLines(raw: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(String(raw ?? "[]"));
  } catch {
    return null;
  }
}

export async function createQuote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = quoteSchema.safeParse({
    customerId: formData.get("customerId"),
    vehicleId: formData.get("vehicleId"),
    validUntil: formData.get("validUntil") ?? "",
    notes: formData.get("notes"),
    lines: parseLines(formData.get("lines")),
  });
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const data = parsed.data;
  const number = await nextDocumentNumber("OC");

  const quoteId = await db.transaction(async (tx) => {
    const [quote] = await tx
      .insert(quotes)
      .values({
        number,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        notes: data.notes,
        createdBy: user.id,
      })
      .returning({ id: quotes.id });

    for (const line of data.lines) {
      let partId: number | null = null;
      let serviceTemplateId: number | null = null;

      if (line.kind === "part" && line.itemId) {
        const id = Number(line.itemId);
        const [part] = await tx.select({ id: parts.id }).from(parts).where(eq(parts.id, id)).limit(1);
        if (part) partId = part.id;
      } else if (line.kind === "service" && line.itemId) {
        const id = Number(line.itemId);
        const [service] = await tx.select({ id: serviceTemplates.id }).from(serviceTemplates).where(eq(serviceTemplates.id, id)).limit(1);
        if (service) serviceTemplateId = service.id;
      }

      await tx.insert(quoteLines).values({
        quoteId: quote.id,
        partId,
        serviceTemplateId,
        description: line.description,
        quantity: line.quantity,
        unitPriceCents: parseMoneyToCents(line.unitPrice),
        vatRateBps: line.vatRate * 100,
        discountCents: parseMoneyToCents(line.discount),
      });
    }
    return quote.id;
  });

  await logAudit(user.id, "criar", "orcamento", quoteId, { number });
  revalidatePath("/orcamentos");
  redirect(`/orcamentos/${quoteId}`);
}

export async function setQuoteStatus(formData: FormData): Promise<void> {
  const user = await requireRole("admin", "gestor");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!Number.isInteger(id) || !["rascunho", "enviado", "aprovado", "rejeitado"].includes(status)) return;

  await db
    .update(quotes)
    .set({
      status: status as "rascunho" | "enviado" | "aprovado" | "rejeitado",
      approvedAt: status === "aprovado" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, id));
  await logAudit(user.id, `estado_${status}`, "orcamento", id);
  revalidatePath(`/orcamentos/${id}`);
  revalidatePath("/orcamentos");
}
