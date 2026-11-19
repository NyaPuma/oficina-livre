import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { logAudit } from "./audit";
import { db } from "./db";
import { invoices, paymentIntents, payments } from "./db/schema";

export type PaymentProvider = "demo" | "stripe" | "sibs";

export function configuredPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER;
  if (provider === "stripe" && process.env.STRIPE_SECRET_KEY) return "stripe";
  if (provider === "sibs" && process.env.SIBS_API_URL && process.env.SIBS_API_KEY) return "sibs";
  return "demo";
}

export function isLivePaymentEnabled(): boolean {
  return configuredPaymentProvider() !== "demo";
}

export type CreateIntentInput = {
  invoiceId: number;
  invoiceNumber: string;
  amountCents: number;
  customerEmail?: string | null;
  method?: string;
};

export type CreateIntentResult = {
  provider: PaymentProvider;
  externalId: string;
  checkoutUrl?: string | null;
  reference?: string | null;
  status: "pendente" | "pago";
  message?: string;
};

function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

async function stripeSession(input: CreateIntentInput): Promise<CreateIntentResult> {
  const body = new URLSearchParams({
    mode: "payment",
    "payment_method_types[]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(input.amountCents),
    "line_items[0][price_data][product_data][name]": `Fatura ${input.invoiceNumber}`,
    success_url: `${appUrl()}/faturacao/${input.invoiceId}?pagamento=sucesso`,
    cancel_url: `${appUrl()}/faturacao/${input.invoiceId}?pagamento=cancelado`,
    "metadata[invoiceId]": String(input.invoiceId),
  });
  if (input.customerEmail) body.set("customer_email", input.customerEmail);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Stripe HTTP ${response.status}`);
  const data = (await response.json()) as { id: string; url: string };
  return { provider: "stripe", externalId: data.id, checkoutUrl: data.url, status: "pendente" };
}

async function sibsPayment(input: CreateIntentInput): Promise<CreateIntentResult> {
  const response = await fetch(`${process.env.SIBS_API_URL!.replace(/\/$/, "")}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SIBS_API_KEY}`,
    },
    body: JSON.stringify({
      amount: input.amountCents,
      currency: "EUR",
      reference: input.invoiceNumber,
      method: input.method ?? "mbway",
      customerEmail: input.customerEmail ?? undefined,
      callbackUrl: `${appUrl()}/api/webhooks/payments/sibs`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`SIBS HTTP ${response.status}`);
  const data = (await response.json()) as { id: string; checkoutUrl?: string; reference?: string };
  return {
    provider: "sibs",
    externalId: data.id,
    checkoutUrl: data.checkoutUrl ?? null,
    reference: data.reference ?? input.invoiceNumber,
    status: "pendente",
  };
}

export async function createPaymentIntent(input: CreateIntentInput): Promise<CreateIntentResult> {
  const provider = configuredPaymentProvider();
  try {
    if (provider === "stripe") return await stripeSession(input);
    if (provider === "sibs") return await sibsPayment(input);
  } catch {
    return {
      provider,
      externalId: "",
      status: "pendente",
      message: "O gateway não respondeu. Verifique as credenciais ou use o registo manual.",
    };
  }

  // Modo demonstração: referência local, sem movimento financeiro.
  return {
    provider: "demo",
    externalId: `DEMO-${Date.now()}`,
    reference: `DEMO-${input.invoiceNumber}`,
    status: "pendente",
    message: "Modo demonstração — nenhum pagamento real foi processado.",
  };
}

function safeEqual(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyWebhookSignature(provider: PaymentProvider, rawBody: string, signatureHeader: string | null): boolean {
  const secret = provider === "stripe" ? process.env.STRIPE_WEBHOOK_SECRET : process.env.SIBS_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  if (provider === "stripe") {
    const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    }, {});
    const timestamp = parts.t;
    const v1 = parts.v1;
    if (!timestamp || !v1) return false;
    const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    return safeEqual(expected, v1);
  }

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signatureHeader);
}

export async function markInvoicePaidFromGateway(
  invoiceId: number,
  amountCents: number,
  method: string,
  externalId: string,
): Promise<boolean> {
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!invoice || invoice.status === "anulada") return false;

  const existing = await db.select({ amountCents: payments.amountCents }).from(payments).where(eq(payments.invoiceId, invoiceId));
  const alreadyPaid = existing.reduce((sum, payment) => sum + payment.amountCents, 0);

  // Idempotência: se já existe um intent deste externalId pago, não repetir.
  const intents = await db.select().from(paymentIntents).where(eq(paymentIntents.externalId, externalId)).limit(1);
  if (intents[0]?.status === "pago") return true;

  await db.insert(payments).values({
    invoiceId,
    amountCents,
    method: method === "card" ? "cartao" : method === "mbway" ? "mbway" : "multibanco",
    reference: externalId,
    paidAt: new Date(),
  });

  const paidCents = alreadyPaid + amountCents;
  await db
    .update(invoices)
    .set({ paidCents, status: paidCents >= invoice.totalCents ? "paga" : "emitida", updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));

  await db
    .update(paymentIntents)
    .set({ status: "pago", updatedAt: new Date() })
    .where(eq(paymentIntents.externalId, externalId));

  await logAudit(null, "pagamento_gateway", "fatura", invoiceId, { externalId, amountCents });
  return true;
}
