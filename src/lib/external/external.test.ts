import { describe, expect, it } from "vitest";
import { isValidPortugueseNif } from "./nif";
import { decodeVin } from "./vin";

describe("validação de NIF", () => {
  it("aceita NIF com dígito de controlo correto", () => {
    expect(isValidPortugueseNif("501460390")).toBe(true);
  });

  it("rejeita NIF inválido", () => {
    expect(isValidPortugueseNif("501460391")).toBe(false);
    expect(isValidPortugueseNif("123")).toBe(false);
  });
});

describe("VIN", () => {
  it("rejeita VIN com caracteres proibidos", () => {
    // "I" não é permitido em VIN.
    return decodeVin("3VWCA21MXYW12345I").then((result) => {
      expect(result.source).toBe("local");
      expect(result.message).toContain("inválido");
    });
  });

  it("infere o ano da 10.ª posição quando a API falha", async () => {
    const result = await decodeVin("3VWCA21MXYW123456");
    expect(result.year).not.toBeNull();
    expect(result.year).toBeGreaterThanOrEqual(1990);
  });
});
