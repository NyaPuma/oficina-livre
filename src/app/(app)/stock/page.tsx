import { desc, eq, sql } from "drizzle-orm";
import { adjustStock } from "@/actions/stock";
import { BarcodeScanner } from "@/components/forms/barcode-scanner";
import { PartForm, ServiceTemplateForm } from "@/components/forms/part-form";
import { Badge, Card, EmptyState, PageHeader, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { parts, serviceTemplates, workOrderLines, workOrders } from "@/lib/db/schema";
import { formatMoney, formatVat } from "@/lib/format";


export default async function StockPage() {
  const [allParts, allServices, consumption] = await Promise.all([
    db.select().from(parts).orderBy(desc(parts.createdAt)).limit(200),
    db.select().from(serviceTemplates).orderBy(desc(serviceTemplates.createdAt)).limit(100),
    db
      .select({ partId: workOrderLines.partId, used: sql<number>`coalesce(sum(${workOrderLines.quantity}), 0)` })
      .from(workOrderLines)
      .innerJoin(workOrders, eq(workOrderLines.workOrderId, workOrders.id))
      .where(sql`${workOrders.createdAt} >= now() - interval '90 days'`)
      .groupBy(workOrderLines.partId),
  ]);

  const reorder = consumption
    .filter((row) => row.partId !== null)
    .map((row) => {
      const part = allParts.find((p) => p.id === row.partId);
      if (!part) return null;
      const suggested = Math.max(0, Math.ceil(Number(row.used) / 3) - part.stockQty);
      return suggested > 0 ? { part, used: Number(row.used), suggested } : null;
    })
    .filter((row): row is { part: (typeof allParts)[number]; used: number; suggested: number } => row !== null)
    .slice(0, 6);

  return (
    <>
      <PageHeader title="Stock e peças" description="Peças, serviços padrão e níveis de stock" />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="px-5 py-4"><h2 className="font-semibold text-slate-900">Peças ({allParts.length})</h2></div>
          {allParts.length === 0 ? (
            <EmptyState title="Sem peças" description="Adicione peças para descontar stock nas ordens." />
          ) : (
            <TableWrapper>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={tableClasses.th}>Código</th>
                    <th className={tableClasses.th}>Descrição</th>
                    <th className={tableClasses.th}>Stock</th>
                    <th className={tableClasses.th}>Preço</th>
                    <th className={tableClasses.th}>Ajustar</th>
                  </tr>
                </thead>
                <tbody>
                  {allParts.map((part) => (
                    <tr key={part.id} className={tableClasses.row}>
                      <td className={tableClasses.td}>{part.code}</td>
                      <td className={tableClasses.td}>
                        <span className="block">{part.description}</span>
                        <span className="text-xs text-slate-500">IVA {formatVat(part.vatRateBps)}</span>
                      </td>
                      <td className={tableClasses.td}>
                        <Badge tone={part.stockQty <= part.minStock ? "amber" : "green"}>
                          {part.stockQty} {part.stockQty <= part.minStock ? "(mínimo)" : ""}
                        </Badge>
                      </td>
                      <td className={tableClasses.td}>{formatMoney(part.salePriceCents)}</td>
                      <td className={tableClasses.td}>
                        <form action={adjustStock} className="flex items-center gap-1">
                          <input type="hidden" name="partId" value={part.id} />
                          <input name="delta" type="number" defaultValue={1} className="w-16 rounded border border-slate-300 px-2 py-1 text-sm" />
                          <button type="submit" className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">+</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-1 font-semibold text-slate-900">Leitura de código</h2>
            <p className="mb-4 text-xs text-slate-500">Pesquise ou leia o código de barras de uma peça</p>
            <BarcodeScanner parts={allParts.map((p) => ({ code: p.code, description: p.description, stockQty: p.stockQty }))} />
          </Card>

          {reorder.length > 0 ? (
            <Card className="p-5">
              <h2 className="mb-1 font-semibold text-slate-900">Reposição sugerida</h2>
              <p className="mb-4 text-xs text-slate-500">Consumo médio dos últimos 90 dias</p>
              <ul className="divide-y divide-line">
                {reorder.map(({ part, used, suggested }) => (
                  <li key={part.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{part.description}</p>
                      <p className="text-xs text-slate-400">{used} usadas · {part.stockQty} em stock</p>
                    </div>
                    <Badge tone="amber">+{suggested}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Nova peça</h2>
            <PartForm />
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Serviços padrão</h2>
            {allServices.length > 0 ? (
              <ul className="mb-4 divide-y divide-slate-100 text-sm">
                {allServices.map((service) => (
                  <li key={service.id} className="flex justify-between py-2">
                    <span>{service.name}</span>
                    <span className="text-slate-500">{formatMoney(service.salePriceCents)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <ServiceTemplateForm />
          </Card>
        </div>
      </div>
    </>
  );
}

export const instant = false;
