import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setWorkOrderStatus, updateWorkOrder } from "@/actions/work-orders";
import { PhotoForm } from "@/components/forms/work-order-extras";
import { Badge, Card, Field, inputClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { workOrders } from "@/lib/db/schema";
import { STATUS_LABELS } from "@/lib/format";

const statuses = ["recebida", "diagnostico", "aguarda_peca", "em_reparacao", "pronta", "entregue"];

export default async function MobileOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();
  const order = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, orderId),
    with: { customer: true, vehicle: true, lines: true, photos: true },
  });
  if (!order) notFound();

  return (
    <>
      <Link href="/movel/ordens" className="text-sm text-slate-500">← Ordens</Link>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">{order.number}</h1>
        <Badge tone="blue">{STATUS_LABELS[order.status]}</Badge>
      </div>
      <p className="mt-1 text-sm text-slate-600">{order.vehicle.plate} · {order.customer.name}</p>

      <Card className="mt-5 p-4">
        <h2 className="font-semibold text-slate-900">Estado da reparação</h2>
        <form action={setWorkOrderStatus} className="mt-3">
          <input type="hidden" name="id" value={order.id} />
          <select name="status" defaultValue={order.status} className={`${inputClasses} mb-3`}>
            {statuses.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
          </select>
          <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            Atualizar estado
          </button>
        </form>
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="font-semibold text-slate-900">Diagnóstico</h2>
        <form action={updateWorkOrder} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={order.id} />
          <Field label="Quilómetros">
            <input name="odometer" type="number" defaultValue={order.odometer ?? ""} className={inputClasses} />
          </Field>
          <Field label="Observações">
            <textarea name="diagnosis" rows={4} defaultValue={order.diagnosis ?? ""} className={inputClasses} />
          </Field>
          <button type="submit" className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
            Guardar diagnóstico
          </button>
        </form>
      </Card>

      <Card className="mt-4 p-4">
        <h2 className="font-semibold text-slate-900">Adicionar foto</h2>
        <div className="mt-3"><PhotoForm workOrderId={order.id} /></div>
        {order.photos.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {order.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={photo.id} src={`/api/files/${photo.filename}`} alt={photo.caption ?? "Foto"} className="h-20 w-full rounded object-cover" />
            ))}
          </div>
        ) : null}
      </Card>

      <Link href={`/ordens/${order.id}`} className="mt-4 block rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700">
        Abrir vista completa →
      </Link>
      <Link href={`/ordens/${order.id}/diagnostico`} className="mt-2 block rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700">
        Diagnóstico digital para o cliente →
      </Link>
    </>
  );
}

export const instant = false;
