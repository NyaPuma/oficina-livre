import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { configuredFiscalProvider, issueCertifiedInvoice } from "./fiscal";
import { verifyWebhookSignature } from "./payments";
import { atDocumentHash, generateSaftXml } from "./saft";
import { verifySignatureWebhook } from "./signature";

describe("webhooks", () => {
  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.QSIGN_WEBHOOK_SECRET;
  });

  it("valida a assinatura HMAC do Stripe", () => {
    process.env.STRIPE_WEBHOOK_SECRET = "segredo";
    const body = '{"type":"checkout.session.completed"}';
    const digest = createHmac("sha256", "segredo").update(`123.${body}`).digest("hex");
    expect(verifyWebhookSignature("stripe", body, `t=123,v1=${digest}`)).toBe(true);
    expect(verifyWebhookSignature("stripe", body, "t=123,v1=errada")).toBe(false);
  });

  it("valida a assinatura HMAC do serviço de assinatura", () => {
    process.env.QSIGN_WEBHOOK_SECRET = "segredo";
    const body = '{"id":"abc","status":"signed"}';
    const digest = createHmac("sha256", "segredo").update(body).digest("hex");
    expect(verifySignatureWebhook(body, digest)).toBe(true);
  });
});

describe("faturação certificada", () => {
  it("não emite nada sem credenciais", async () => {
    delete process.env.FISCAL_PROVIDER;
    expect(configuredFiscalProvider()).toBe("none");
    const result = await issueCertifiedInvoice({
      invoiceId: 1,
      number: "FT-1",
      issuedAt: new Date(),
      customerName: "Cliente",
      customerNif: null,
      subtotalCents: 1000,
      vatCents: 230,
      totalCents: 1230,
      lines: [],
    });
    expect(result.certifiedNumber).toBeNull();
    expect(result.message).toContain("não fiscal");
  });
});

describe("SAF-T", () => {
  it("gera hash determinístico Base64/SHA-1", () => {
    expect(atDocumentHash(["FT-1", "2026-01-01"])).toBe(atDocumentHash(["FT-1", "2026-01-01"]));
  });

  it("inclui o número de certificado quando configurado", () => {
    const xml = generateSaftXml([], {
      companyNif: "123456789",
      certificateNumber: "1234",
    });
    expect(xml).toContain("<SoftwareCertificateNumber>1234</SoftwareCertificateNumber>");
    expect(xml).toContain("<CompanyID>123456789</CompanyID>");
  });
});
