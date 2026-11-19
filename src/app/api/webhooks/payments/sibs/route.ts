import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { paymentIntents } from "@/lib/db/schema";
import { markInvoicePaidFromGateway, verifyWebhookSignature } from "@/lib/payments";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-sibs-signature");
  if (!verifyWebhookSignature("sibs", raw, signature)) {
    return Response.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    id?: string;
    status?: string;
    amount?: number;
    method?: string;
    invoiceId?: number;
  };
  const externalId = String(event.id ?? "");
  if (!externalId || !["paid", "succeeded", "pago", "completed"].includes(String(event.status ?? "").toLowerCase())) {
    return Response.json({ received: true });
  }

  const [intent] = await db.select().from(paymentIntents).where(eq(paymentIntents.externalId, externalId)).limit(1);
  if (!intent) return Response.json({ error: "Intent desconhecido" }, { status: 400 });

  await markInvoicePaidFromGateway(intent.invoiceId, Number(event.amount ?? intent.amountCents), event.method ?? "mbway", externalId);
  return Response.json({ received: true });
}
