import { eq } from "drizzle-orm";
import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { AcknowledgeForm } from "@/components/forms/inspection-forms";
import { Badge, Card } from "@/components/ui";
import { db } from "@/lib/db";
import { inspections } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";

const tone: Record<string, string> = { ok: "green", atencao: "amber", falha: "red" };
const label: Record<string, string> = { ok: "OK", atencao: "Atenção", falha: "Falha" };

export default async function PublicDiagnosticPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inspection = await db.query.inspections.findFirst({
    where: eq(inspections.token, token),
    with: {
      workOrder: { with: { customer: true, vehicle: true } },
      items: { with: { photos: true } },
    },
  });
  if (!inspection) notFound();

  const order = inspection.workOrder;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-900 text-white"><ClipboardCheck size={22} /></div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Relatório de diagnóstico</h1>
          <p className="mt-2 text-sm text-slate-500">Ordem {order.number} · {order.vehicle.plate} · {formatDateTime(inspection.sharedAt ?? inspection.createdAt)}</p>
        </div>

        <Card className="p-6">
          <div className="mb-5 rounded-lg bg-slate-50 p-4 text-sm">
            <p className="text-slate-500">Cliente</p>
            <p className="font-medium text-slate-800">{order.customer.name}</p>
          </div>

          <div className="space-y-4">
            {inspection.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-800">{item.label}</span>
                  <Badge tone={tone[item.condition]}>{label[item.condition]}</Badge>
                </div>
                {item.notes ? <p className="mt-1 text-sm text-slate-600">{item.notes}</p> : null}
                {item.photos.length > 0 ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {item.photos.map((photo) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={photo.id} src={`/api/files/${photo.filename}`} alt={item.label} className="h-24 w-full rounded object-cover" />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {inspection.notes ? (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-700">Notas da oficina</p>
              <p className="mt-1">{inspection.notes}</p>
            </div>
          ) : null}

          {inspection.acknowledgedAt ? (
            <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-center text-sm text-emerald-700">
              <CheckCircle2 className="mx-auto mb-2" size={22} />
              Receção confirmada por {inspection.acknowledgementName} em {formatDateTime(inspection.acknowledgedAt)}.
            </div>
          ) : (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <h2 className="mb-4 font-semibold text-slate-900">Confirmar receção</h2>
              <AcknowledgeForm token={inspection.token} />
            </div>
          )}
        </Card>
        <p className="mt-6 text-center text-xs text-slate-400">Oficina Livre · software livre sob licença MIT</p>
      </div>
    </main>
  );
}

export const instant = false;
