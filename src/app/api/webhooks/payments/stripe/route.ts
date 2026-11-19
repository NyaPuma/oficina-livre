import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentIntents } from "@/lib/db/schema";
import { markInvoicePaidFromGateway, verifyWebhookSignature } from "@/lib/payments";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!verifyWebhookSignature("stripe", raw, signature)) {
    return Response.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    type: string;
    data?: { object?: Record<string, unknown> };
  };
  if (event.type !== "checkout.session.completed") return Response.json({ received: true });

  const session = event.data?.object ?? {};
  const externalId = String(session.id ?? "");
  const invoiceId = Number((session.metadata as Record<string, string> | undefined)?.invoiceId);
  const amountCents = Number(session.amount_total ?? 0);
  if (!Number.isInteger(invoiceId) || amountCents <= 0) return Response.json({ error: "Dados incompletos" }, { status: 400 });

  const [intent] = await db.select().from(paymentIntents).where(eq(paymentIntents.externalId, externalId)).limit(1);
  if (!intent || intent.invoiceId !== invoiceId) return Response.json({ error: "Intent desconhecido" }, { status: 400 });

  await markInvoicePaidFromGateway(invoiceId, amountCents, "card", externalId);
  return Response.json({ received: true });
}
