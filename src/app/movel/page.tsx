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
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <p className="eyebrow">Hoje na oficina</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Olá, {firstName}</h1>
      <p className="mt-1 text-sm text-slate-500">O trabalho de hoje, sem distrações.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href="/movel/ordens" className="ink-gradient panel-hover relative overflow-hidden rounded-2xl p-5 text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-brand/20 blur-xl" />
          <ClipboardList size={20} className="text-brand" />
          <p className="mt-4 text-3xl font-semibold leading-none tabular-nums">{open.length}</p>
          <p className="mt-2 text-xs text-slate-300">Minhas OS abertas</p>
        </Link>
        <Link href="/stock" className="panel panel-hover p-5">
          <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-brandstrong"><Package size={18} /></span>
          <p className="mt-4 text-xl font-semibold text-ink">Stock</p>
          <p className="mt-1 text-xs text-slate-500">Consultar peças</p>
        </Link>
      </div>

      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Para continuar</h2>
          <Link href="/movel/ordens" className="text-xs font-medium text-slate-500 hover:text-brandstrong">Ver todas →</Link>
        </div>
        {open.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">Sem ordens atribuídas.</Card>
        ) : (
          <div className="space-y-3">
            {open.slice(0, 5).map((order) => (
              <Link key={order.id} href={`/movel/ordens/${order.id}`} className="panel panel-hover flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{order.number}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">{order.vehicle.plate}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{order.customer.name}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge dot tone="blue">{STATUS_LABELS[order.status]}</Badge>
                  <Wrench size={14} className="text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link href="/agendar" className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-brand/40 bg-amber-50/50 p-4 text-sm text-amber-800">
        <Camera size={18} /> Partilhar link de reservas com clientes
      </Link>
    </>
  );
}

export const instant = false;
