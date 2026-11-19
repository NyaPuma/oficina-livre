import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { shareInspection } from "@/actions/inspections";
import { AcknowledgeForm, InspectionEditor, InspectionPhotoForm } from "@/components/forms/inspection-forms";
import { Badge, Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { workOrders } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";

const conditionTone: Record<string, string> = { ok: "green", atencao: "amber", falha: "red" };
const conditionLabel: Record<string, string> = { ok: "OK", atencao: "Atenção", falha: "Falha" };

export default async function WorkOrderDiagnosticPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workOrderId = Number(id);
  if (!Number.isInteger(workOrderId)) notFound();

  const [workOrder, inspection] = await Promise.all([
    db.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId),
      with: { customer: true, vehicle: true },
    }),
    db.query.inspections.findFirst({
      where: (i, { eq }) => eq(i.workOrderId, workOrderId),
      with: { items: { with: { photos: true } } },
      orderBy: (i, { desc }) => [desc(i.createdAt)],
    }),
  ]);
  if (!workOrder) notFound();

  return (
    <>
      <PageHeader
        title={`Diagnóstico digital · ${workOrder.number}`}
        description={`${workOrder.customer.name} · ${workOrder.vehicle.plate}`}
        action={{ href: `/ordens/${workOrder.id}`, label: "Voltar à ordem" }}
      />

      {!inspection ? (
        <Card className="max-w-4xl p-6">
          <h2 className="mb-1 font-semibold text-slate-900">Criar relatório de inspeção</h2>
          <p className="mb-5 text-sm text-slate-500">Os itens podem ser ajustados e o relatório partilhado com o cliente por link público.</p>
          <InspectionEditor workOrderId={workOrder.id} />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Itens inspecionados</h2>
                <Badge tone={inspection.status === "confirmado" ? "green" : inspection.status === "partilhado" ? "blue" : "slate"}>
                  {inspection.status}
                </Badge>
              </div>
              <div className="mt-4 space-y-4">
                {inspection.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-800">{item.label}</span>
                      <Badge tone={conditionTone[item.condition]}>{conditionLabel[item.condition]}</Badge>
                    </div>
                    {item.notes ? <p className="mt-1 text-sm text-slate-600">{item.notes}</p> : null}
                    {item.photos.length > 0 ? (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {item.photos.map((photo) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={photo.id} src={`/api/files/${photo.filename}`} alt={item.label} className="h-20 w-full rounded object-cover" />
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-3"><InspectionPhotoForm inspectionId={inspection.id} itemId={item.id} itemLabel={item.label} /></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="font-semibold text-slate-900">Partilhar com cliente</h2>
              <p className="mt-2 text-xs text-slate-500">Criado em {formatDateTime(inspection.createdAt)}</p>
              {inspection.sharedAt ? <p className="mt-1 text-xs text-slate-500">Partilhado em {formatDateTime(inspection.sharedAt)}</p> : null}
              {inspection.acknowledgedAt ? (
                <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  Confirmado por {inspection.acknowledgementName} em {formatDateTime(inspection.acknowledgedAt)}.
                </p>
              ) : null}
              <form action={shareInspection} className="mt-4">
                <input type="hidden" name="id" value={inspection.id} />
                <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                  {inspection.sharedAt ? "Reenviar relatório" : "Partilhar relatório"}
                </button>
              </form>
              <a href={`/diagnostico/${inspection.token}`} target="_blank" rel="noopener noreferrer" className="mt-2 block text-center text-sm text-slate-500 underline">
                Abrir link público ↗
              </a>
            </Card>

            {!inspection.acknowledgedAt ? (
              <Card className="p-5">
                <h2 className="mb-3 font-semibold text-slate-900">Simular confirmação do cliente</h2>
                <AcknowledgeForm token={inspection.token} />
              </Card>
            ) : null}

            <Link href={`/movel/ordens/${workOrder.id}`} className="block text-center text-sm text-slate-500 hover:text-slate-900">
              Abrir no modo mecânico →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export const instant = false;
