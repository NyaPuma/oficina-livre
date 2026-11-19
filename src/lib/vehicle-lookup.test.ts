import { describe, expect, it } from "vitest";
import { isValidPtPlate } from "./vehicle-lookup";

describe("isValidPtPlate", () => {
  it("aceita os formatos portugueses usuais", () => {
    expect(isValidPtPlate("00-00-AA")).toBe(true);
    expect(isValidPtPlate("AA-12-34")).toBe(true);
    expect(isValidPtPlate("0012AB")).toBe(true);
    expect(isValidPtPlate("AB1234")).toBe(true);
  });

  it("rejeita formatos inválidos", () => {
    expect(isValidPtPlate("AB-12-CD")).toBe(false);
    expect(isValidPtPlate("123")).toBe(false);
  });
});
