import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, StatCard, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { customers, parts, quotes, vehicles, workOrders } from "@/lib/db/schema";
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
  const [openOrders, pendingQuotes, lowStock, totalCustomers, recentOrders] = await Promise.all([
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
  ]);

  return (
    <>
      <PageHeader
        title="Painel"
        description="Visão geral da atividade da oficina"
        action={{ href: "/ordens/novo", label: "Nova ordem de serviço" }}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="OS abertas" value={String(openOrders[0]?.value ?? 0)} hint="Por concluir ou entregar" />
        <StatCard label="Orçamentos pendentes" value={String(pendingQuotes[0]?.value ?? 0)} hint="À espera de aprovação" />
        <StatCard label="Peças em stock mínimo" value={String(lowStock.length)} hint="Reposição recomendada" />
        <StatCard label="Clientes" value={String(totalCustomers[0]?.value ?? 0)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold text-slate-900">Últimas ordens de serviço</h2>
            <Link href="/ordens" className="text-sm text-slate-500 hover:text-slate-900">Ver todas →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState title="Ainda não há ordens de serviço" description="Crie a primeira para começar." />
          ) : (
            <TableWrapper>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={tableClasses.th}>Número</th>
                    <th className={tableClasses.th}>Cliente / viatura</th>
                    <th className={tableClasses.th}>Estado</th>
                    <th className={tableClasses.th}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className={tableClasses.row}>
                      <td className={tableClasses.td}>
                        <Link href={`/ordens/${order.id}`} className="font-medium text-slate-900 hover:underline">
                          {order.number}
                        </Link>
                      </td>
                      <td className={tableClasses.td}>
                        <span className="block">{order.customerName}</span>
                        <span className="text-xs text-slate-500">{order.plate}</span>
                      </td>
                      <td className={tableClasses.td}>
                        <Badge tone={statusTone[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                      </td>
                      <td className={tableClasses.td}>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-semibold text-slate-900">Stock a repor</h2>
            <Link href="/stock" className="text-sm text-slate-500 hover:text-slate-900">Ver stock →</Link>
          </div>
          {lowStock.length === 0 ? (
            <EmptyState title="Stock saudável" />
          ) : (
            <ul className="divide-y divide-slate-100 px-5 pb-3">
              {lowStock.map((part) => (
                <li key={part.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{part.description}</p>
                    <p className="text-xs text-slate-500">{part.code}</p>
                  </div>
                  <Badge tone="amber">{part.stockQty} / {part.minStock}</Badge>
                </li>
              ))}
            </ul>
          )}
          <p className="px-5 pb-4 text-xs text-slate-400">
            Valores em centimos convertidos para euros nas listagens.
          </p>
        </Card>
      </div>
    </>
  );
}

export const instant = false;
