import { setAppointmentStatus } from "@/actions/appointments";
import { ReminderButtons } from "@/components/reminder-buttons";
import { Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { appointmentReminderMessage } from "@/lib/whatsapp";

const timeFormatter = new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" });
const dateFormatter = new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long" });

export default async function AgendaPage() {
  const rows = await db.query.appointments.findMany({
    with: { customer: true, vehicle: true, technician: true },
    orderBy: (a, { asc }) => [asc(a.startsAt)],
    limit: 200,
  });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const upcoming = rows.filter((a) => a.startsAt >= now && a.status === "confirmada");
  const todayCount = upcoming.filter((a) => a.startsAt < new Date(today.getTime() + 24 * 60 * 60 * 1000)).length;
  const onlineCount = upcoming.filter((a) => a.source === "online").length;

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Marcações, rampas e lembretes de clientes"
        action={{ href: "/agenda/novo", label: "Nova marcação" }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Marcações futuras" value={String(upcoming.length)} />
        <StatCard label="Para hoje" value={String(todayCount)} />
        <StatCard label="Reservas online" value={String(onlineCount)} hint="A confirmar" />
      </div>

      <div className="mt-6 space-y-6">
        {rows.length === 0 ? (
          <Card><EmptyState title="Sem marcações" description="Crie uma marcação ou partilhe o link de reservas online." /></Card>
        ) : rows.map((appointment) => {
          const message = appointmentReminderMessage({
            customerName: appointment.customer.name,
            plate: appointment.vehicle?.plate,
            startsAt: appointment.startsAt,
            service: appointment.notes,
          });
          return (
            <Card key={appointment.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 shrink-0 text-center">
                    <p className="text-xs font-medium uppercase text-slate-500">{dateFormatter.format(appointment.startsAt)}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{timeFormatter.format(appointment.startsAt)}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{appointment.customer.name}</p>
                    <p className="text-sm text-slate-500">
                      {appointment.vehicle?.plate ?? "Sem viatura"}
                      {appointment.ramp ? ` · ${appointment.ramp}` : ""}
                      {appointment.technician ? ` · ${appointment.technician.name}` : ""}
                    </p>
                    {appointment.notes ? <p className="mt-2 max-w-xl text-sm text-slate-600">{appointment.notes}</p> : null}
                    <div className="mt-2 flex gap-2">
                      <Badge tone={appointment.status === "confirmada" ? "green" : appointment.status === "cancelada" ? "red" : "slate"}>
                        {appointment.status}
                      </Badge>
                      {appointment.source === "online" ? <Badge tone="blue">Online</Badge> : null}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <form action={setAppointmentStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={appointment.id} />
                    <select name="status" defaultValue={appointment.status} className="rounded-lg border border-slate-300 px-2 py-1 text-sm">
                      <option value="confirmada">Confirmada</option>
                      <option value="concluida">Concluída</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                    <button type="submit" className="rounded-lg border border-slate-300 px-3 text-sm hover:bg-slate-50">Atualizar</button>
                  </form>
                  <ReminderButtons
                    phone={appointment.contactPhone ?? appointment.customer.phone}
                    email={appointment.contactEmail ?? appointment.customer.email}
                    message={message}
                    subject="Lembrete de marcação — Oficina Livre"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-400">Criada em {formatDateTime(appointment.createdAt)}</p>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export const instant = false;
