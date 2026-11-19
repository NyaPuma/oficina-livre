import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { db } from "@/lib/db";
import { STATUS_LABELS } from "@/lib/format";

export default async function MobileOrdersPage() {
  const orders = await db.query.workOrders.findMany({
    with: { customer: true, vehicle: true, assignee: true },
    orderBy: (wo, { desc }) => [desc(wo.createdAt)],
    limit: 50,
  });

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Ordens de serviço</h1>
      <p className="mt-1 text-sm text-slate-500">Toque numa ordem para atualizar</p>
      <div className="mt-5 space-y-3">
        {orders.length === 0 ? (
          <Card className="p-5 text-center text-sm text-slate-500">Sem ordens registadas.</Card>
        ) : orders.map((order) => (
          <Link key={order.id} href={`/movel/ordens/${order.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900">{order.number}</span>
              <Badge tone={order.status === "entregue" ? "green" : "blue"}>{STATUS_LABELS[order.status]}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-700">{order.vehicle.plate}</p>
            <p className="text-xs text-slate-500">{order.customer.name} · {order.assignee?.name ?? "sem mecânico"}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

export const instant = false;
