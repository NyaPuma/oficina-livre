import { describe, expect, it } from "vitest";
import { normalizePhone, whatsappLink } from "./whatsapp";

describe("normalizePhone", () => {
  it("aceita números portugueses de 9 dígitos", () => {
    expect(normalizePhone("912 345 678")).toBe("351912345678");
  });

  it("mantém números já com indicativo", () => {
    expect(normalizePhone("+351 912 345 678")).toBe("351912345678");
  });

  it("rejeita valores vazios", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });
});

describe("whatsappLink", () => {
  it("gera um link wa.me com a mensagem codificada", () => {
    const link = whatsappLink("912345678", "Olá! Marcação confirmada.");
    expect(link).toMatch(/^https:\/\/wa\.me\/351912345678\?text=/);
    expect(link).toContain("Marca%C3%A7%C3%A3o");
  });

  it("devolve null sem telefone", () => {
    expect(whatsappLink(null, "olá")).toBeNull();
  });
});
