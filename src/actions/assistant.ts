"use server";

import { type ActionState, errorState, successState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { predictNextServiceKm, suggestWork, summarizeDiagnosis, type Suggestion } from "@/lib/assistant";
import { db } from "@/lib/db";
import { parts, serviceTemplates } from "@/lib/db/schema";

export type AssistantState = ActionState & {
  suggestions?: Suggestion[];
  source?: "local" | "ia";
  summary?: string;
  nextServiceKm?: number | null;
};

export async function getAssistantSuggestions(_prev: AssistantState, formData: FormData): Promise<AssistantState> {
  await requireUser();
  const workOrderId = Number(formData.get("workOrderId"));
  if (!Number.isInteger(workOrderId)) return errorState("Ordem inválida.");

  const [order, allServices, allParts] = await Promise.all([
    db.query.workOrders.findFirst({
      where: (table, { eq }) => eq(table.id, workOrderId),
      with: { vehicle: true, lines: true },
    }),
    db.select({ id: serviceTemplates.id, name: serviceTemplates.name, salePriceCents: serviceTemplates.salePriceCents, vatRateBps: serviceTemplates.vatRateBps }).from(serviceTemplates),
    db.select({ id: parts.id, description: parts.description, salePriceCents: parts.salePriceCents, vatRateBps: parts.vatRateBps }).from(parts),
  ]);
  if (!order) return errorState("Ordem não encontrada.");

  const previous = await db.query.workOrders.findMany({
    where: (table, { eq, and, ne }) => and(eq(table.vehicleId, order.vehicleId), ne(table.id, order.id)),
    columns: { complaint: true, diagnosis: true, odometer: true },
    limit: 10,
  });

  const catalog = [
    ...allServices.map((s) => ({ id: s.id, kind: "service" as const, description: s.name, priceCents: s.salePriceCents, vatRateBps: s.vatRateBps })),
    ...allParts.map((p) => ({ id: p.id, kind: "part" as const, description: p.description, priceCents: p.salePriceCents, vatRateBps: p.vatRateBps })),
  ];

  const history = previous.map((p) => [p.complaint, p.diagnosis].filter(Boolean).join(" ")).filter(Boolean);
  const result = await suggestWork(order.complaint ?? "", history, order.odometer, catalog);
  const historyKm = previous.map((p) => p.odometer).filter((km): km is number => km !== null);

  return {
    ...successState(
      result.source === "ia"
        ? "Sugestões geradas com o assistente inteligente."
        : "Sugestões baseadas em regras locais e histórico da viatura.",
    ),
    suggestions: result.suggestions,
    source: result.source,
    summary: summarizeDiagnosis(order.diagnosis, order.lines),
    nextServiceKm: predictNextServiceKm(order.odometer, historyKm),
  };
}
