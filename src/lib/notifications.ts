import { sendMail } from "./mail";

/** Envio de lembretes por email (servidor). Para WhatsApp, usar src/lib/whatsapp.ts. */
export async function sendReminderEmail(to: string, subject: string, text: string): Promise<boolean> {
  return sendMail(to, subject, text);
}
