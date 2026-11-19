"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, errorState, firstZodIssue, successState } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parts, serviceTemplates } from "@/lib/db/schema";
import { parseMoneyToCents } from "@/lib/format";
import { partSchema, serviceTemplateSchema } from "@/lib/validation";

export async function createPart(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = partSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const data = parsed.data;
  const supplierId = data.supplierId && Number.isInteger(data.supplierId) ? data.supplierId : null;
  try {
    const [part] = await db
      .insert(parts)
      .values({
        code: data.code,
        description: data.description,
        costCents: parseMoneyToCents(data.costPrice),
        salePriceCents: parseMoneyToCents(data.salePrice),
        vatRateBps: data.vatRate * 100,
        stockQty: data.stockQty,
        minStock: data.minStock,
        supplierId,
      })
      .returning({ id: parts.id });
    await logAudit(user.id, "criar", "peca", part.id, { code: data.code });
  } catch {
    return errorState("Já existe uma peça com esse código.");
  }

  revalidatePath("/stock");
  redirect("/stock");
}

export async function createServiceTemplate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = serviceTemplateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const data = parsed.data;
  const [template] = await db
    .insert(serviceTemplates)
    .values({
      name: data.name,
      description: data.description,
      standardHours: data.standardHours,
      salePriceCents: parseMoneyToCents(data.salePrice),
      vatRateBps: data.vatRate * 100,
    })
    .returning({ id: serviceTemplates.id });
  await logAudit(user.id, "criar", "servico", template.id, { name: data.name });

  revalidatePath("/stock");
  return successState("Serviço padrão adicionado.");
}

export async function adjustStock(formData: FormData): Promise<void> {
  const user = await requireUser();
  const partId = Number(formData.get("partId"));
  const delta = Number(formData.get("delta"));
  if (!Number.isInteger(partId) || !Number.isFinite(delta) || delta === 0) return;

  await db
    .update(parts)
    .set({ stockQty: sql`greatest(0, ${parts.stockQty} + ${Math.round(delta)})`, updatedAt: new Date() })
    .where(eq(parts.id, partId));
  await logAudit(user.id, "ajustar_stock", "peca", partId, { delta });
  revalidatePath("/stock");
}
