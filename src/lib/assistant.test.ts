import { describe, expect, it } from "vitest";
import { predictNextServiceKm, suggestWork, summarizeDiagnosis, type CatalogItem } from "./assistant";

const catalog: CatalogItem[] = [
  { id: 1, kind: "service", description: "Pastilhas de travão", priceCents: 12000, vatRateBps: 1300 },
  { id: 2, kind: "service", description: "Troca de óleo e filtro", priceCents: 6500, vatRateBps: 1300 },
  { id: 3, kind: "part", description: "Kit correia de distribuição", priceCents: 13500, vatRateBps: 2300 },
];

describe("assistente de oficina", () => {
  it("sugere serviços a partir da queixa", async () => {
    const result = await suggestWork("Barulho nos travões", [], 60000, catalog);
    expect(result.source).toBe("local");
    expect(result.suggestions.some((s) => s.description.includes("travão"))).toBe(true);
  });

  it("sugere distribuição com quilometragem elevada", async () => {
    const result = await suggestWork("Revisão", [], 140000, catalog);
    expect(result.suggestions.some((s) => s.description.includes("distribuição"))).toBe(true);
  });

  it("prevê próxima revisão a partir do histórico", () => {
    expect(predictNextServiceKm(60000, [30000, 45000, 60000])).toBe(75000);
  });

  it("resume diagnóstico e intervenções", () => {
    const summary = summarizeDiagnosis("Fuga de óleo", [{ description: "Filtro", quantity: 2 }]);
    expect(summary).toContain("Fuga de óleo");
    expect(summary).toContain("2x Filtro");
  });
});
