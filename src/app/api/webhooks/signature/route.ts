import { completeSignatureFromWebhook, verifySignatureWebhook } from "@/lib/signature";

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-qsign-signature");
  if (!verifySignatureWebhook(raw, signature)) {
    return Response.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  const event = JSON.parse(raw) as {
    id?: string;
    status?: string;
    signerName?: string;
    signedAt?: string;
    certificateSerial?: string;
  };
  if (!event.id || !["signed", "concluido", "completed"].includes(String(event.status ?? "").toLowerCase())) {
    return Response.json({ received: true });
  }

  await completeSignatureFromWebhook(event.id, {
    signerName: event.signerName,
    signedAt: event.signedAt,
    certificateSerial: event.certificateSerial,
  });
  return Response.json({ received: true });
}
