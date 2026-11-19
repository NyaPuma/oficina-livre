import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { invoiceWorkOrder } from "@/actions/invoicing";
import { deleteWorkOrderLine, setWorkOrderStatus, updateWorkOrder } from "@/actions/work-orders";
import { InvoiceButton } from "@/components/forms/invoice-button";
import { KnowledgeSearch } from "@/components/forms/knowledge-search";
import { SafetyCheck } from "@/components/forms/safety-check";
import { AssistantPanel } from "@/components/forms/assistant-panel";
import { EmailButton } from "@/components/forms/email-button";
import { AddLineForm, PhotoForm } from "@/components/forms/work-order-extras";
import { Badge, Card, Field, PageHeader, TableWrapper, inputClasses, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { parts, serviceTemplates, users, workOrders } from "@/lib/db/schema";
import { documentTotals, formatDateTime, formatMoney, formatVat, lineTotalCents, STATUS_LABELS } from "@/lib/format";


const statusOrder = ["recebida", "diagnostico", "aguarda_peca", "em_reparacao", "pronta", "entregue", "cancelada"];

const checklistLabels: Record<string, string> = {
  niveis: "Níveis",
  pneus: "Pneus",
  luzes: "Luzes",
  objetos: "Objetos pessoais",
  dados: "Dados registados",
};

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const [order, allUsers, allParts, allServices] = await Promise.all([
    db.query.workOrders.findFirst({
      where: eq(workOrders.id, orderId),
      with: { customer: true, vehicle: true, assignee: true, lines: true, photos: true, invoices: true },
    }),
    db.select({ id: users.id, name: users.name }).from(users).orderBy(asc(users.name)),
    db.select({ id: parts.id, description: parts.description, salePriceCents: parts.salePriceCents, vatRateBps: parts.vatRateBps }).from(parts).orderBy(asc(parts.description)),
    db.select({ id: serviceTemplates.id, name: serviceTemplates.name, salePriceCents: serviceTemplates.salePriceCents, vatRateBps: serviceTemplates.vatRateBps }).from(serviceTemplates).orderBy(asc(serviceTemplates.name)),
  ]);
  if (!order) notFound();

  const totals = documentTotals(order.lines);
  const options = [
    ...allServices.map((s) => ({ id: s.id, kind: "service" as const, description: s.name, priceCents: s.salePriceCents, vatRateBps: s.vatRateBps })),
    ...allParts.map((p) => ({ id: p.id, kind: "part" as const, description: p.description, priceCents: p.salePriceCents, vatRateBps: p.vatRateBps })),
  ];
  const checked = Object.entries(order.checklist ?? {}).filter(([, value]) => value).map(([key]) => checklistLabels[key] ?? key);

  return (
    <>
      <PageHeader
        title={`Ordem de serviço ${order.number}`}
        description={`${order.customer.name} · ${order.vehicle.plate} · ${formatDateTime(order.createdAt)}`}
        action={{ href: `/api/documents/ordem/${order.id}`, label: "Abrir PDF" }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Intervenções</h2>
              <Badge tone={order.status === "entregue" ? "green" : "blue"}>{STATUS_LABELS[order.status]}</Badge>
            </div>
            <TableWrapper>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={tableClasses.th}>Descrição</th>
                    <th className={tableClasses.th}>Qtd.</th>
                    <th className={tableClasses.th}>P. unitário</th>
                    <th className={tableClasses.th}>IVA</th>
                    <th className={tableClasses.th}>Total</th>
                    <th className={tableClasses.th} />
                  </tr>
                </thead>
                <tbody>
                  {order.lines.length === 0 ? (
                    <tr><td colSpan={6} className={`${tableClasses.td} text-slate-500`}>Sem linhas adicionadas.</td></tr>
                  ) : order.lines.map((line) => (
                    <tr key={line.id} className={tableClasses.row}>
                      <td className={tableClasses.td}>
                        {line.description}
                        {line.stockDeducted ? <span className="ml-2 text-xs text-emerald-600">stock descontado</span> : null}
                      </td>
                      <td className={tableClasses.td}>{line.quantity}</td>
                      <td className={tableClasses.td}>{formatMoney(line.unitPriceCents)}</td>
                      <td className={tableClasses.td}>{formatVat(line.vatRateBps)}</td>
                      <td className={tableClasses.td}>{formatMoney(lineTotalCents(line))}</td>
                      <td className={tableClasses.td}>
                        <form action={deleteWorkOrderLine}>
                          <input type="hidden" name="id" value={order.id} />
                          <input type="hidden" name="lineId" value={line.id} />
                          <button type="submit" className="text-xs text-red-600 hover:underline">Remover</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
            <div className="ml-auto w-72 space-y-2 p-5 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatMoney(totals.subtotalCents)}</span></div>
              <div className="flex justify-between text-slate-600"><span>IVA</span><span>{formatMoney(totals.vatCents)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900"><span>Total</span><span>{formatMoney(totals.totalCents)}</span></div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Adicionar intervenção</h2>
            <AddLineForm workOrderId={order.id} options={options} />
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Fotos</h2>
            <PhotoForm workOrderId={order.id} />
            {order.photos.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {order.photos.map((photo) => (
                  <figure key={photo.id} className="overflow-hidden rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/files/${photo.filename}`} alt={photo.caption ?? "Foto da viatura"} className="h-32 w-full object-cover" />
                    <figcaption className="p-2 text-xs text-slate-500">{photo.phase} · {photo.caption ?? "—"}</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900">Estado</h2>
            <form action={setWorkOrderStatus} className="mt-4 flex gap-2">
              <input type="hidden" name="id" value={order.id} />
              <select name="status" defaultValue={order.status} className={inputClasses}>
                {statusOrder.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
              </select>
              <button type="submit" className="btn-primary shrink-0">Atualizar</button>
            </form>
            {order.completedAt ? <p className="mt-2 text-xs text-slate-500">Entregue em {formatDateTime(order.completedAt)}</p> : null}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Detalhes</h2>
            <form action={updateWorkOrder} className="space-y-4">
              <input type="hidden" name="id" value={order.id} />
              <Field label="Quilómetros">
                <input name="odometer" type="number" min={0} defaultValue={order.odometer ?? ""} className={inputClasses} />
              </Field>
              <Field label="Mecânico">
                <select name="assigneeId" defaultValue={order.assigneeId ?? ""} className={inputClasses}>
                  <option value="">Não atribuído</option>
                  {allUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
              </Field>
              <Field label="Diagnóstico">
                <textarea name="diagnosis" rows={4} defaultValue={order.diagnosis ?? ""} className={inputClasses} />
              </Field>
              <button type="submit" className="btn-secondary">Guardar alterações</button>
            </form>
            {order.complaint ? (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-700">Queixa do cliente</p>
                <p className="mt-1 text-slate-600">{order.complaint}</p>
              </div>
            ) : null}
            {checked.length > 0 ? (
              <div className="mt-3">
                <p className="text-sm font-medium text-slate-700">Checklist de entrada</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {checked.map((label) => <Badge key={label} tone="green">{label}</Badge>)}
                </div>
              </div>
            ) : null}
          </Card>

          <AssistantPanel workOrderId={order.id} />

          <Card className="p-5">
            <h2 className="mb-1 font-semibold text-slate-900">Ajuda ao diagnóstico</h2>
            <p className="mb-4 text-xs text-slate-500">Sintomas, causas e passos de verificação</p>
            <KnowledgeSearch initialQuery={order.complaint ?? ""} />
          </Card>

          <SafetyCheck vehicleId={order.vehicleId} />

          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Enviar ao cliente</h2>
            <EmailButton kind="ordem" id={order.id} email={order.customer.email} />
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Faturação</h2>
            <InvoiceButton id={order.id} action={invoiceWorkOrder} label="Emitir fatura" />
            {order.invoices?.length ? (
              <Link href={`/faturacao/${order.invoices[0].id}`} className="mt-2 block text-center text-sm text-slate-500 underline">
                Ver fatura {order.invoices[0].number}
              </Link>
            ) : null}
          </Card>

          {order.quoteId ? (
            <Link href={`/orcamentos/${order.quoteId}`} className="block text-center text-sm text-slate-500 hover:text-slate-900">
              Ver orçamento de origem →
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}

export const instant = false;
