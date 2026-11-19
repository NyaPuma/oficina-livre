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
import { Badge, Card, EmptyState, PanelTitle, StatCard, TableWrapper, tableClasses } from "@/components/ui";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatDate, STATUS_LABELS } from "@/lib/format";

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
  const data = await getDashboardData();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 19 ? "Boa tarde" : "Boa noite";
  const firstName = data.userName.split(" ")[0];
  const isMechanic = data.userRole === "mecanico";
  const isManager = data.userRole === "gestor";
  const heroTitle = isMechanic ? "As tuas reparações" : isManager ? "A operação da oficina" : "A visão geral da oficina";
  const heroSubtitle = isMechanic
    ? "Foca-te no trabalho da bancada — o resto fica para o escritório."
    : isManager
      ? "Agenda, orçamentos e equipa num só sítio."
      : "Reparações, agenda, stock e faturação num só lugar.";

  return (
    <>
      <section className="ink-gradient grid-texture rise-in relative mb-7 overflow-hidden rounded-2xl p-7 text-white shadow-xl shadow-ink/10 sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-6 -top-10 size-52 rounded-full bg-brand/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <p className="eyebrow flex items-center gap-2 text-brand"><span className="live-dot" /> {heroTitle}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{greeting}, <span className="text-brand">{firstName}</span>.</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{heroSubtitle}</p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {isMechanic ? (
              <>
                <Link href="/movel" className="btn-primary btn-accent"><Wrench size={15} /> Abrir modo mecânico</Link>
                <Link href="/ordens" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  Ver ordens
                </Link>
              </>
            ) : (
              <>
                <Link href="/ordens/novo" className="btn-primary btn-accent"><Wrench size={15} /> Nova ordem de serviço</Link>
                <Link href="/agenda" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
                  <CalendarDays size={15} /> Ver agenda
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="OS abertas" value={String(data.openOrders)} hint="Por concluir" icon={<Wrench size={17} />} tone="brand" />
        <StatCard label="Orçamentos pendentes" value={String(data.pendingQuotes)} hint="Aguardam aprovação" icon={<FileClock size={17} />} tone="blue" />
        <StatCard label="Stock mínimo" value={String(data.lowStock.length)} hint="Reposição recomendada" icon={<Package size={17} />} tone="amber" />
        <StatCard label="Clientes" value={String(data.customers)} icon={<Users size={17} />} />
        <StatCard label="Marcações" value={String(data.appointments)} hint="Ativas" icon={<CalendarDays size={17} />} tone="green" />
        <StatCard label="Faturas em aberto" value={String(data.openInvoices)} icon={<Receipt size={17} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <PanelTitle
            title="Últimas ordens de serviço"
            subtitle="Acompanhe o estado das reparações"
            action={<Link href="/ordens" className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-brandstrong">Ver todas <ArrowRight size={13} /></Link>}
          />
          {data.recentOrders.length === 0 ? (
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
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className={tableClasses.row}>
                      <td className={tableClasses.td}>
                        <Link href={`/ordens/${order.id}`} className="font-semibold text-ink transition hover:text-brandstrong">{order.number}</Link>
                      </td>
                      <td className={tableClasses.td}>
                        <span className="block font-medium text-slate-800">{order.customer.name}</span>
                        <span className="font-mono text-xs text-slate-400">{order.vehicle.plate}</span>
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
          {data.lowStock.length === 0 ? (
            <EmptyState icon={<Package size={20} />} title="Stock saudável" description="Todas as peças estão acima do mínimo." />
          ) : (
            <ul className="divide-y divide-line px-5 pb-2">
              {data.lowStock.map((part) => (
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
              <Link href="/movel" className="rounded-lg border border-line px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:border-brand/50 hover:text-ink">Modo mecânico</Link>
              {isMechanic ? (
                <Link href="/ordens" className="rounded-lg border border-line px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:border-brand/50 hover:text-ink">As minhas OS</Link>
              ) : (
                <>
                  <Link href="/orcamentos/novo" className="rounded-lg border border-line px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:border-brand/50 hover:text-ink">Orçamento</Link>
                  <Link href="/clientes/novo" className="rounded-lg border border-line px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:border-brand/50 hover:text-ink">Cliente</Link>
                  <Link href={isManager ? "/faturacao" : "/relatorios"} className="rounded-lg border border-line px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:border-brand/50 hover:text-ink">
                    {isManager ? "Faturação" : "Relatórios"}
                  </Link>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export const instant = false;
