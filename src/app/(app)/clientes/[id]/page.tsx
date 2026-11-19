import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleForm } from "@/components/forms/vehicle-form";
import { Badge, Card, EmptyState, PageHeader, TableWrapper, tableClasses } from "@/components/ui";
import { recordConsent } from "@/actions/customers";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { formatDate, STATUS_LABELS } from "@/lib/format";


export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  const [{ id }, flags] = await Promise.all([params, searchParams]);
  const customerId = Number(id);
  if (!Number.isInteger(customerId)) notFound();

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
    with: {
      vehicles: true,
      consents: true,
      workOrders: { orderBy: (wo, { desc }) => [desc(wo.createdAt)], limit: 20 },
      quotes: { orderBy: (q, { desc }) => [desc(q.createdAt)], limit: 20 },
    },
  });
  if (!customer) notFound();

  const validConsent = customer.consents.some(
    (c) => c.type === "privacidade" && !c.revokedAt,
  );

  return (
    <>
      <PageHeader title={customer.name} description={`Cliente #${customer.id}`} />
      {flags.novo ? (
        <p className="mb-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Cliente criado com sucesso. Adicione agora as viaturas.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">Dados de contacto</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-slate-500">NIF</dt><dd className="text-slate-800">{customer.nif ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Telemóvel</dt><dd className="text-slate-800">{customer.phone ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Email</dt><dd className="text-slate-800">{customer.email ?? "—"}</dd></div>
            <div><dt className="text-slate-500">Morada</dt><dd className="text-slate-800">{[customer.address, customer.postalCode, customer.city].filter(Boolean).join(", ") || "—"}</dd></div>
            <div>
              <dt className="text-slate-500">RGPD</dt>
              <dd className="mt-1"><Badge tone={validConsent ? "green" : "amber"}>{validConsent ? "Consentimento registado" : "Sem consentimento"}</Badge></dd>
            </div>
          </dl>
          {!validConsent ? (
            <form action={recordConsent} className="mt-4">
              <input type="hidden" name="customerId" value={customer.id} />
              <input type="hidden" name="type" value="privacidade" />
              <button type="submit" className="text-sm font-medium text-slate-900 underline">Registar consentimento</button>
            </form>
          ) : null}
        </Card>

        <Card className="lg:col-span-2">
          <div className="px-5 py-4">
            <h2 className="font-semibold text-slate-900">Viaturas</h2>
          </div>
          {customer.vehicles.length === 0 ? (
            <EmptyState title="Sem viaturas" />
          ) : (
            <TableWrapper>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={tableClasses.th}>Matrícula</th>
                    <th className={tableClasses.th}>Veículo</th>
                    <th className={tableClasses.th}>Km</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className={tableClasses.row}>
                      <td className={`${tableClasses.td} font-medium`}>{vehicle.plate}</td>
                      <td className={tableClasses.td}>{[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ") || "—"}</td>
                      <td className={tableClasses.td}>{vehicle.mileage.toLocaleString("pt-PT")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          )}
          <div className="border-t border-slate-100 p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Adicionar viatura</h3>
            <VehicleForm customerId={customer.id} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="px-5 py-4"><h2 className="font-semibold text-slate-900">Histórico de ordens de serviço</h2></div>
          {customer.workOrders.length === 0 ? (
            <EmptyState title="Sem intervenções" />
          ) : (
            <ul className="divide-y divide-slate-100 px-5 pb-3">
              {customer.workOrders.map((wo) => (
                <li key={wo.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/ordens/${wo.id}`} className="text-sm font-medium text-slate-900 hover:underline">{wo.number}</Link>
                    <p className="text-xs text-slate-500">{formatDate(wo.createdAt)}</p>
                  </div>
                  <Badge tone={wo.status === "entregue" ? "green" : "blue"}>{STATUS_LABELS[wo.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="px-5 py-4"><h2 className="font-semibold text-slate-900">Orçamentos</h2></div>
          {customer.quotes.length === 0 ? (
            <EmptyState title="Sem orçamentos" />
          ) : (
            <ul className="divide-y divide-slate-100 px-5 pb-3">
              {customer.quotes.map((quote) => (
                <li key={quote.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/orcamentos/${quote.id}`} className="text-sm font-medium text-slate-900 hover:underline">{quote.number}</Link>
                    <p className="text-xs text-slate-500">{formatDate(quote.createdAt)}</p>
                  </div>
                  <Badge tone={quote.status === "aprovado" ? "green" : "slate"}>{STATUS_LABELS[quote.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

export const instant = false;
