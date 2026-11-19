import Link from "next/link";
import { Camera, ClipboardList, Package, Wrench } from "lucide-react";
import { eq } from "drizzle-orm";
import { Badge, Card } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { workOrders } from "@/lib/db/schema";
import { STATUS_LABELS } from "@/lib/format";

export default async function MobileHomePage() {
  const user = await requireUser();
  const orders = await db.query.workOrders.findMany({
    where: eq(workOrders.assigneeId, user.id),
    with: { customer: true, vehicle: true },
    orderBy: (wo, { asc }) => [asc(wo.status)],
    limit: 20,
  });
  const open = orders.filter((o) => !["entregue", "cancelada"].includes(o.status));

  return (
    <>
      <h1 className="text-xl font-semibold text-slate-900">Olá, {user.name.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-slate-500">O trabalho de hoje, sem distrações.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="/movel/ordens" className="rounded-xl bg-slate-900 p-4 text-white">
          <ClipboardList size={20} />
          <p className="mt-3 text-2xl font-semibold">{open.length}</p>
          <p className="text-xs text-slate-300">Minhas OS abertas</p>
        </Link>
        <Link href="/stock" className="rounded-xl bg-white p-4 shadow-sm">
          <Package size={20} className="text-slate-700" />
          <p className="mt-3 text-lg font-semibold text-slate-900">Stock</p>
          <p className="text-xs text-slate-500">Consultar peças</p>
        </Link>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Para continuar</h2>
          <Link href="/movel/ordens" className="text-sm text-slate-500">Ver todas →</Link>
        </div>
        {open.length === 0 ? (
          <Card className="p-5 text-center text-sm text-slate-500">Sem ordens atribuídas.</Card>
        ) : (
          <div className="space-y-3">
            {open.slice(0, 5).map((order) => (
              <Link key={order.id} href={`/movel/ordens/${order.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{order.number}</span>
                  <Badge tone="blue">{STATUS_LABELS[order.status]}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{order.vehicle.plate} · {order.customer.name}</p>
                <p className="mt-3 flex items-center gap-1 text-xs text-slate-400"><Wrench size={13} /> Abrir ordem</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link href="/agendar" className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
        <Camera size={18} /> Partilhar link de reservas com clientes
      </Link>
    </>
  );
}


export const instant = false;
