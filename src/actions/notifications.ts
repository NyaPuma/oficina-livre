"use server";

import { type ActionState, errorState, successState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { sendReminderEmail } from "@/lib/notifications";

export async function sendReminderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const to = String(formData.get("to") ?? "");
  const subject = String(formData.get("subject") ?? "Lembrete de marcação");
  const text = String(formData.get("text") ?? "");
  if (!to || !text) return errorState("Email e mensagem obrigatórios.");

  const sent = await sendReminderEmail(to, subject, text).catch(() => false);
  return sent
    ? successState("Lembrete enviado por email.")
    : errorState("Email não configurado. Use o link do WhatsApp.");
}
