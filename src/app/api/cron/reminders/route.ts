import { and, eq, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { appointments, quotes } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import { sendMail } from "@/lib/mail";
import { whatsappLink } from "@/lib/whatsapp";

function authorize(requestHeaders: Headers): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return requestHeaders.get("authorization") === `Bearer ${secret}`;
}

export async function GET() {
  const requestHeaders = await headers();
  if (!authorize(requestHeaders)) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const now = new Date();
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const [appointmentRows, staleQuotes] = await Promise.all([
    db.query.appointments.findMany({
      where: and(eq(appointments.status, "confirmada"), lt(appointments.startsAt, tomorrowEnd)),
      with: { customer: true, vehicle: true },
      limit: 200,
    }),
    db.query.quotes.findMany({
      where: and(eq(quotes.status, "enviado"), lt(quotes.createdAt, threeDaysAgo)),
      with: { customer: true },
      limit: 200,
    }),
  ]);

  const tomorrowAppointments = appointmentRows.filter(
    (a) => a.startsAt >= tomorrowStart && a.startsAt < tomorrowEnd,
  );

  let emailsSent = 0;
  const reminders: Array<{ type: string; target: string; whatsapp: string | null }> = [];

  for (const appointment of tomorrowAppointments) {
    const phone = appointment.contactPhone ?? appointment.customer.phone;
    const email = appointment.contactEmail ?? appointment.customer.email;
    const message = `Olá ${appointment.customer.name}! Lembramos a sua marcação na Oficina Livre amanhã, ${formatDate(appointment.startsAt)} (${appointment.vehicle?.plate ?? "viatura"}). Até já!`;
    reminders.push({ type: "marcacao", target: phone ?? email ?? "—", whatsapp: whatsappLink(phone, message) });
    if (email) {
      const sent = await sendMail(email, "Lembrete de marcação — Oficina Livre", message).catch(() => false);
      if (sent) emailsSent += 1;
    }
  }

  for (const quote of staleQuotes) {
    const email = quote.customer.email;
    const message = `Olá ${quote.customer.name}! O orçamento ${quote.number} ainda aguarda a sua aprovação. Estamos disponíveis para dúvidas.`;
    reminders.push({ type: "orcamento", target: email ?? "—", whatsapp: whatsappLink(quote.customer.phone, message) });
    if (email) {
      const sent = await sendMail(email, `Orçamento ${quote.number} aguarda aprovação`, message).catch(() => false);
      if (sent) emailsSent += 1;
    }
  }

  return Response.json({
    geradoEm: new Date().toISOString(),
    marcacoesAmanha: tomorrowAppointments.length,
    orcamentosPendentes: staleQuotes.length,
    emailsEnviados: emailsSent,
    lembretes: reminders,
  });
}
