/** Utilitários partilhados (sem dependências de servidor) para links WhatsApp e lembretes. */

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("351") && digits.length === 12) return digits;
  if (digits.length === 9) return `351${digits}`;
  return digits;
}

/** Gera um link wa.me — não requer API paga nem envio automático. */
export function whatsappLink(phone: string | null | undefined, message: string): string | null {
  const number = normalizePhone(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function appointmentReminderMessage(data: {
  customerName: string;
  plate?: string | null;
  startsAt: Date;
  service?: string | null;
}): string {
  const when = new Intl.DateTimeFormat("pt-PT", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }).format(data.startsAt);
  return `Olá ${data.customerName}! Lembramos a sua marcação na Oficina Livre para ${when}${data.plate ? ` (${data.plate})` : ""}${data.service ? ` — ${data.service}` : ""}. Até já!`;
}
