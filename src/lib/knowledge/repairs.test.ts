import { describe, expect, it } from "vitest";
import { getObdCode, searchRepairKnowledge } from "./repairs";

describe("biblioteca de reparação", () => {
  it("encontra artigos por sintoma com acentos diferentes", () => {
    const results = searchRepairKnowledge("barulho ao travar");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("travagem-ruido");
  });

  it("toleranta variações morfológicas (travão/travões)", () => {
    const results = searchRepairKnowledge("travão");
    expect(results.some((article) => article.id === "travagem-ruido")).toBe(true);
  });

  it("encontra artigos por código OBD", () => {
    const results = searchRepairKnowledge("P0300");
    expect(results.some((article) => (article.obdCodes ?? []).includes("P0300"))).toBe(true);
  });

  it("devolve detalhe do código OBD", () => {
    const code = getObdCode("p0420");
    expect(code?.title).toContain("catalisador");
    expect(code?.firstChecks.length).toBeGreaterThan(0);
  });
});
