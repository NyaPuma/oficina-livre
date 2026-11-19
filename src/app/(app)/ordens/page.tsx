import { eq } from "drizzle-orm";
import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, TableWrapper, tableClasses, inputClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { workOrders } from "@/lib/db/schema";
import { formatDate, STATUS_LABELS } from "@/lib/format";


const tones: Record<string, string> = {
  recebida: "blue",
  diagnostico: "amber",
  aguarda_peca: "red",
  em_reparacao: "blue",
  pronta: "green",
  entregue: "slate",
  cancelada: "slate",
};

const statuses = Object.keys(STATUS_LABELS).filter((key) => key in tones);

export default async function WorkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const valid = status && statuses.includes(status) ? status : null;

  const orders = await db.query.workOrders.findMany({
    where: valid ? eq(workOrders.status, valid as never) : undefined,
    with: { customer: true, vehicle: true, assignee: true },
    orderBy: (wo, { desc: descFn }) => [descFn(wo.createdAt)],
    limit: 100,
  });

  return (
    <>
      <PageHeader title="Ordens de serviço" description="Acompanhe as reparações da oficina" action={{ href: "/ordens/novo", label: "Nova ordem" }} />
      <Card className="p-4">
        <form method="get" className="flex flex-wrap gap-2">
          <select name="status" className={`${inputClasses} max-w-xs`}>
            <option value="">Todos os estados</option>
            {statuses.map((key) => <option key={key} value={key}>{STATUS_LABELS[key]}</option>)}
          </select>
          <button type="submit" className="rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700">Filtrar</button>
        </form>
      </Card>
      <Card className="mt-5">
        {orders.length === 0 ? (
          <EmptyState title="Sem ordens de serviço" description="Crie uma nova ordem para começar." />
        ) : (
          <TableWrapper>
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className={tableClasses.th}>Número</th>
                  <th className={tableClasses.th}>Cliente</th>
                  <th className={tableClasses.th}>Viatura</th>
                  <th className={tableClasses.th}>Mecânico</th>
                  <th className={tableClasses.th}>Estado</th>
                  <th className={tableClasses.th}>Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className={tableClasses.row}>
                    <td className={tableClasses.td}>
                      <Link href={`/ordens/${order.id}`} className="font-medium text-slate-900 hover:underline">{order.number}</Link>
                    </td>
                    <td className={tableClasses.td}>{order.customer.name}</td>
                    <td className={tableClasses.td}>{order.vehicle.plate}</td>
                    <td className={tableClasses.td}>{order.assignee?.name ?? "—"}</td>
                    <td className={tableClasses.td}><Badge tone={tones[order.status]}>{STATUS_LABELS[order.status]}</Badge></td>
                    <td className={tableClasses.td}>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </Card>
    </>
  );
}

export const instant = false;
