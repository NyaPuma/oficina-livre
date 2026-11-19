"use server";

import { type ActionState, errorState, successState } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { parts } from "@/lib/db/schema";
import { searchTecDocParts, type TecDocPart } from "@/lib/tecdoc";

export type TecDocState = ActionState & {
  parts?: TecDocPart[];
  source?: "tecdoc" | "local";
};

export async function searchTecDocPartsAction(_prev: TecDocState, formData: FormData): Promise<TecDocState> {
  await requireRole("admin", "gestor");
  const query = String(formData.get("query") ?? "").trim();
  if (query.length < 2) return errorState("Escreva pelo menos 2 caracteres.");

  const result = await searchTecDocParts(query, 20);
  return {
    ...successState(result.message ?? `${result.data.length} resultado(s).`),
    parts: result.data,
    source: result.source,
  };
}

export async function importTecDocPartAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin", "gestor");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const priceCents = Number(formData.get("priceCents") ?? 0);
  const vatRateBps = Number(formData.get("vatRateBps") ?? 2300);

  if (!code || !description) return errorState("Código e descrição obrigatórios.");

  try {
    const [created] = await db
      .insert(parts)
      .values({
        code,
        description: brand ? `${description} · ${brand}` : description,
        salePriceCents: Number.isFinite(priceCents) && priceCents > 0 ? Math.round(priceCents) : 0,
        costCents: 0,
        vatRateBps: Number.isFinite(vatRateBps) ? vatRateBps : 2300,
        stockQty: 0,
        minStock: 0,
      })
      .returning({ id: parts.id });
    await logAudit(user.id, "importar_tecdoc", "peca", created.id, { code });
  } catch {
    return errorState("Já existe uma peça com esse código no stock.");
  }

  return successState(`Peça ${code} importada para o stock.`);
}
