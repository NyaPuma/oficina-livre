import QRCode from "qrcode";

/**
 * Integração com software de faturação certificado pela AT (Moloni).
 *
 * A aplicação não emite faturas fiscalmente válidas por si própria: envia os
 * dados da fatura ao programa certificado, que devolve número, ATCUD e hash.
 * Sem credenciais, o modo é demonstração e nada é submetido.
 */

export type FiscalProvider = "none" | "moloni";

export function configuredFiscalProvider(): FiscalProvider {
  if (
    process.env.FISCAL_PROVIDER === "moloni" &&
    process.env.MOLONI_CLIENT_ID &&
    process.env.MOLONI_CLIENT_SECRET &&
    process.env.MOLONI_USERNAME &&
    process.env.MOLONI_PASSWORD &&
    process.env.MOLONI_COMPANY_ID
  ) {
    return "moloni";
  }
  return "none";
}

export function isCertifiedInvoicingEnabled(): boolean {
  return configuredFiscalProvider() !== "none";
}

export type CertifiedInvoiceInput = {
  invoiceId: number;
  number: string;
  issuedAt: Date;
  customerName: string;
  customerNif: string | null;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  lines: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    vatRateBps: number;
    discountCents: number;
  }>;
};

export type CertifiedInvoiceResult = {
  provider: FiscalProvider;
  certifiedNumber: string | null;
  atcud: string | null;
  documentHash: string | null;
  qrCodeUrl: string | null;
  message: string;
};

async function moloniToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: process.env.MOLONI_CLIENT_ID!,
    client_secret: process.env.MOLONI_CLIENT_SECRET!,
    username: process.env.MOLONI_USERNAME!,
    password: process.env.MOLONI_PASSWORD!,
    scope: "",
  });
  const response = await fetch("https://api.moloni.pt/v1/grant/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Moloni auth HTTP ${response.status}`);
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function moloniInsert(input: CertifiedInvoiceInput, token: string): Promise<{ id: number; number?: string; atcud?: string; hash?: string }> {
  const body = new URLSearchParams({
    access_token: token,
    company_id: process.env.MOLONI_COMPANY_ID!,
    customer_id: process.env.MOLONI_CUSTOMER_ID ?? "0",
    document_type_id: process.env.MOLONI_DOCUMENT_TYPE_ID ?? "1",
    date: input.issuedAt.toISOString().slice(0, 10),
    customer_name: input.customerName,
    customer_nif: input.customerNif ?? "",
    net_value: (input.subtotalCents / 100).toFixed(2),
    vat_value: (input.vatCents / 100).toFixed(2),
    total_value: (input.totalCents / 100).toFixed(2),
    notes: `Oficina Livre · fatura ${input.number}`,
  });
  const response = await fetch("https://api.moloni.pt/v1/invoices/insert/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Moloni HTTP ${response.status}`);
  return (await response.json()) as { id: number; number?: string; atcud?: string; hash?: string };
}

export async function issueCertifiedInvoice(input: CertifiedInvoiceInput): Promise<CertifiedInvoiceResult> {
  const provider = configuredFiscalProvider();
  if (provider === "none") {
    return {
      provider,
      certifiedNumber: null,
      atcud: null,
      documentHash: null,
      qrCodeUrl: null,
      message: "Sem programa certificado configurado. A fatura permanece como documento interno não fiscal.",
    };
  }

  try {
    const token = await moloniToken();
    const created = await moloniInsert(input, token);
    const certifiedNumber = created.number ?? input.number;
    const atcud = created.atcud ?? null;
    const qrPayload = [
      input.customerNif ?? "",
      certifiedNumber,
      input.issuedAt.toISOString().slice(0, 10),
      (input.totalCents / 100).toFixed(2),
      atcud ?? "",
    ].join("*");
    const qrCodeUrl = await QRCode.toDataURL(qrPayload, { width: 220, margin: 1 });

    return {
      provider,
      certifiedNumber,
      atcud,
      documentHash: created.hash ?? null,
      qrCodeUrl,
      message: "Fatura emitida pelo programa certificado.",
    };
  } catch (error) {
    return {
      provider,
      certifiedNumber: null,
      atcud: null,
      documentHash: null,
      qrCodeUrl: null,
      message: error instanceof Error ? `Falha na integração certificada: ${error.message}` : "Falha na integração certificada.",
    };
  }
}
