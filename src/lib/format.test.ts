import { describe, expect, it } from "vitest";
import { documentNumber, documentTotals, formatVat, lineTotalCents, parseMoneyToCents } from "./format";

describe("parseMoneyToCents", () => {
  it("converte vírgula decimal portuguesa", () => {
    expect(parseMoneyToCents("12,50")).toBe(1250);
  });

  it("converte ponto decimal e valores inteiros", () => {
    expect(parseMoneyToCents("12.50")).toBe(1250);
    expect(parseMoneyToCents("12")).toBe(1200);
  });

  it("aceita números e valores vazios", () => {
    expect(parseMoneyToCents(9.99)).toBe(999);
    expect(parseMoneyToCents("")).toBe(0);
  });
});

describe("documentTotals", () => {
  const lines = [
    { quantity: 2, unitPriceCents: 1000, vatRateBps: 2300, discountCents: 0 },
    { quantity: 1, unitPriceCents: 5000, vatRateBps: 1300, discountCents: 200 },
  ];

  it("calcula o total de cada linha", () => {
    expect(lineTotalCents(lines[0])).toBe(2000);
    expect(lineTotalCents(lines[1])).toBe(4800);
  });

  it("soma subtotal, IVA e total com taxas diferentes", () => {
    const totals = documentTotals(lines);
    expect(totals.subtotalCents).toBe(6800);
    expect(totals.vatCents).toBe(460 + 624);
    expect(totals.totalCents).toBe(7884);
  });
});

describe("formatação", () => {
  it("mostra IVA em percentagem", () => {
    expect(formatVat(2300)).toBe("23%");
    expect(formatVat(1300)).toBe("13%");
  });

  it("gera números de documento sequenciais", () => {
    expect(documentNumber("OR", 2026, 7)).toBe("OR-2026-0007");
  });
});
