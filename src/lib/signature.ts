import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { logAudit } from "./audit";
import { db } from "./db";
import { signatureRequests } from "./db/schema";

export type SignatureProvider = "demo" | "qsign";

export function configuredSignatureProvider(): SignatureProvider {
  if (process.env.QSIGN_API_URL && process.env.QSIGN_API_KEY) return "qsign";
  return "demo";
}

export function isQualifiedSignatureEnabled(): boolean {
  return configuredSignatureProvider() === "qsign";
}

export type RequestSignatureInput = {
  entity: "orcamento" | "fatura";
  entityId: number;
  documentPdf: Buffer;
  filename: string;
  signerName?: string | null;
  signerEmail?: string | null;
};

export type RequestSignatureResult = {
  provider: SignatureProvider;
  externalId: string;
  signingUrl?: string | null;
  status: "pendente";
  message?: string;
};

export async function requestQualifiedSignature(input: RequestSignatureInput): Promise<RequestSignatureResult> {
  const provider = configuredSignatureProvider();
  if (provider === "qsign") {
    try {
      const form = new FormData();
      form.set("file", new Blob([new Uint8Array(input.documentPdf)], { type: "application/pdf" }), input.filename);
      form.set("entity", input.entity);
      form.set("entityId", String(input.entityId));
      if (input.signerEmail) form.set("signerEmail", input.signerEmail);
      if (input.signerName) form.set("signerName", input.signerName);
      form.set("callbackUrl", `${(process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/webhooks/signature`);

      const response = await fetch(`${process.env.QSIGN_API_URL!.replace(/\/$/, "")}/requests`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.QSIGN_API_KEY}` },
        body: form,
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`QSign HTTP ${response.status}`);
      const data = (await response.json()) as { id: string; signingUrl?: string };
      return {
        provider: "qsign",
        externalId: data.id,
        signingUrl: data.signingUrl ?? null,
        status: "pendente",
        message: "Pedido de assinatura qualificada enviado.",
      };
    } catch {
      return {
        provider,
        externalId: "",
        status: "pendente",
        message: "O serviço de assinatura não respondeu. Verifique as credenciais.",
      };
    }
  }

  return {
    provider: "demo",
    externalId: `ASS-DEMO-${Date.now()}`,
    status: "pendente",
    message: "Modo demonstração — não é uma assinatura eletrónica qualificada.",
  };
}

export function verifySignatureWebhook(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.QSIGN_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function completeSignatureFromWebhook(
  externalId: string,
  data: { signerName?: string; signedAt?: string; certificateSerial?: string },
): Promise<boolean> {
  const [request] = await db.select().from(signatureRequests).where(eq(signatureRequests.externalId, externalId)).limit(1);
  if (!request) return false;

  await db
    .update(signatureRequests)
    .set({
      status: "concluido",
      signerName: data.signerName ?? request.signerName,
      signedAt: data.signedAt ? new Date(data.signedAt) : new Date(),
      certificateSerial: data.certificateSerial ?? null,
      updatedAt: new Date(),
    })
    .where(eq(signatureRequests.externalId, externalId));

  await logAudit(null, "assinatura_concluida", request.entity, request.entityId, { externalId });
  return true;
}
