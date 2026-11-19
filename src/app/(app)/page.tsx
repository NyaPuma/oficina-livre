import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileClock,
  Package,
  Receipt,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  PanelTitle,
  StatCard,
  TableWrapper,
  tableClasses,
} from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appointments, customers, invoices, parts, quotes, vehicles, workOrders } from "@/lib/db/schema";
import { formatDate, STATUS_LABELS } from "@/lib/format";

const openStatuses = ["recebida", "diagnostico", "aguarda_peca", "em_reparacao", "pronta"] as const;

const statusTone: Record<string, string> = {
  recebida: "blue",
  diagnostico: "amber",
  aguarda_peca: "red",
  em_reparacao: "blue",
  pronta: "green",
  entregue: "slate",
  cancelada: "slate",
};

export default async function DashboardPage() {
  const [user, openOrders, pendingQuotes, lowStock, totalCustomers, recentOrders, futureAppointments, openInvoices] =
    await Promise.all([
      getCurrentUser(),
      db.select({ value: count() }).from(workOrders).where(inArray(workOrders.status, [...openStatuses])),
      db.select({ value: count() }).from(quotes).where(eq(quotes.status, "enviado")),
      db
        .select({ id: parts.id, code: parts.code, description: parts.description, stockQty: parts.stockQty, minStock: parts.minStock })
        .from(parts)
        .where(and(eq(parts.active, true), sql`${parts.stockQty} <= ${parts.minStock}`))
        .orderBy(desc(parts.stockQty))
        .limit(6),
      db.select({ value: count() }).from(customers),
      db
        .select({
          id: workOrders.id,
          number: workOrders.number,
          status: workOrders.status,
          createdAt: workOrders.createdAt,
          plate: vehicles.plate,
          customerName: customers.name,
        })
        .from(workOrders)
        .innerJoin(customers, eq(workOrders.customerId, customers.id))
        .innerJoin(vehicles, eq(workOrders.vehicleId, vehicles.id))
        .orderBy(desc(workOrders.createdAt))
        .limit(6),
      db.select({ value: count() }).from(appointments).where(eq(appointments.status, "confirmada")),
      db.select({ value: count() }).from(invoices).where(inArray(invoices.status, ["emitida", "rascunho"])),
    ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 19 ? "Boa tarde" : "Boa noite";
  const firstName = user?.name?.split(" ")[0] ?? "mecânico";

  return (
    <>
      {/* Hero */}
      <section className="ink-gradient grid-texture rise-in relative mb-7 overflow-hidden rounded-2xl p-7 text-white shadow-xl shadow-ink/10 sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-6 -top-10 size-52 rounded-full bg-brand/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <p className="eyebrow flex items-center gap-2 text-brand">
            <span className="live-dot" /> Painel de operações
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {greeting}, <span className="text-brand">{firstName}</span>.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            A oficina em tempo real: reparações, agenda, stock e faturação num só lugar.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/ordens/novo" className="btn-primary btn-accent">
              <Wrench size={15} /> Nova ordem de serviço
            </Link>
            <Link href="/agenda" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
              <CalendarDays size={15} /> Ver agenda
            </Link>
          </div>
        </div>
      </section>

      {/* Indicadores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="OS abertas" value={String(openOrders[0]?.value ?? 0)} hint="Por concluir" icon={<Wrench size={17} />} tone="brand" />
        <StatCard label="Orçamentos pendentes" value={String(pendingQuotes[0]?.value ?? 0)} hint="Aguardam aprovação" icon={<FileClock size={17} />} tone="blue" />
        <StatCard label="Stock mínimo" value={String(lowStock.length)} hint="Reposição recomendada" icon={<Package size={17} />} tone="amber" />
        <StatCard label="Clientes" value={String(totalCustomers[0]?.value ?? 0)} icon={<Users size={17} />} />
        <StatCard label="Marcações" value={String(futureAppointments[0]?.value ?? 0)} hint="Ativas" icon={<CalendarDays size={17} />} tone="green" />
        <StatCard label="Faturas em aberto" value={String(openInvoices[0]?.value ?? 0)} icon={<Receipt size={17} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <PanelTitle
            title="Últimas ordens de serviço"
            subtitle="Acompanhe o estado das reparações"
            action={<Link href="/ordens" className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brandstrong">Ver todas <ArrowRight size={13} /></Link>}
          />
          {recentOrders.length === 0 ? (
            <EmptyState icon={<ClipboardList size={20} />} title="Ainda não há ordens de serviço" description="Crie a primeira para começar." />
          ) : (
            <TableWrapper>
              <table className="w-full">
                <thead><tr>
                  <th className={tableClasses.th}>Número</th>
                  <th className={tableClasses.th}>Cliente / viatura</th>
                  <th className={tableClasses.th}>Estado</th>
                  <th className={tableClasses.th}>Data</th>
                </tr></thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className={tableClasses.row}>
                      <td className={tableClasses.td}>
                        <Link href={`/ordens/${order.id}`} className="font-semibold text-ink transition hover:text-brandstrong">
                          {order.number}
                        </Link>
                      </td>
                      <td className={tableClasses.td}>
                        <span className="block font-medium text-slate-800">{order.customerName}</span>
                        <span className="font-mono text-xs text-slate-400">{order.plate}</span>
                      </td>
                      <td className={tableClasses.td}><Badge dot tone={statusTone[order.status]}>{STATUS_LABELS[order.status]}</Badge></td>
                      <td className={`${tableClasses.td} text-slate-500`}>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          )}
        </Card>

        <Card>
          <PanelTitle
            title="Stock a repor"
            subtitle="Peças abaixo do mínimo"
            action={<Link href="/stock" className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brandstrong">Ver stock <ArrowRight size={13} /></Link>}
          />
          {lowStock.length === 0 ? (
            <EmptyState icon={<Package size={20} />} title="Stock saudável" description="Todas as peças estão acima do mínimo." />
          ) : (
            <ul className="divide-y divide-line px-5 pb-2">
              {lowStock.map((part) => (
                <li key={part.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{part.description}</p>
                    <p className="font-mono text-xs text-slate-400">{part.code}</p>
                  </div>
                  <Badge tone="amber" dot>{part.stockQty} / {part.minStock}</Badge>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-line px-5 py-4">
            <p className="eyebrow mb-3">Atalhos rápidos</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/orcamentos/novo" className="rounded-lg border border-line px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:border-brand/50 hover:text-ink">Orçamento</Link>
              <Link href="/clientes/novo" className="rounded-lg border border-line px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:border-brand/50 hover:text-ink">Cliente</Link>
              <Link href="/movel" className="rounded-lg border border-line px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:border-brand/50 hover:text-ink">Modo mecânico</Link>
              <Link href="/relatorios" className="rounded-lg border border-line px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:border-brand/50 hover:text-ink">Relatórios</Link>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export const instant = false;
