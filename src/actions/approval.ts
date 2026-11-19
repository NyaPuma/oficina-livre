"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { type ActionState, errorState, firstZodIssue, successState } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { sendMail } from "@/lib/mail";
import { clientKey, checkRateLimit } from "@/lib/rate-limit";
import { approvalSchema } from "@/lib/validation";

/** Prepara o orçamento para aprovação digital e devolve o link público. */
export async function sendQuoteForApproval(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  if (!quote) return;

  const token = quote.approvalToken ?? randomBytes(24).toString("hex");
  await db
    .update(quotes)
    .set({
      status: quote.status === "aprovado" ? "aprovado" : "enviado",
      approvalToken: token,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, id));
  await logAudit(user.id, "enviar_aprovacao", "orcamento", id);
  revalidatePath(`/orcamentos/${id}`);
}

export async function approveQuotePublic(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const requestHeaders = await headers();
  if (!checkRateLimit(clientKey("aprovacao", requestHeaders), 12, 60 * 60_000)) {
    return errorState("Demasiadas tentativas. Tente mais tarde.");
  }

  const parsed = approvalSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
  });
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const [quote] = await db.select().from(quotes).where(eq(quotes.approvalToken, parsed.data.token)).limit(1);
  if (!quote) return errorState("Link inválido ou expirado.");

  await db
    .update(quotes)
    .set({
      status: "aprovado",
      approvedAt: new Date(),
      signatureName: parsed.data.name,
      signedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, quote.id));

  await logAudit(null, "aprovacao_digital", "orcamento", quote.id, { name: parsed.data.name });

  const customer = await db.query.customers.findFirst({
    where: (customers, { eq }) => eq(customers.id, quote.customerId),
    columns: { email: true },
  });
  if (customer?.email) {
    await sendMail(
      customer.email,
      `Orçamento ${quote.number} aprovado — Oficina Livre`,
      `O orçamento ${quote.number} foi aprovado digitalmente por ${parsed.data.name}. A oficina entrará em contacto.`,
    ).catch(() => false);
  }

  revalidatePath(`/orcamentos/${quote.id}`);
  return successState("Orçamento aprovado. Obrigado!");
}
