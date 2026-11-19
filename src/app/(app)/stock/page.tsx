import { desc } from "drizzle-orm";
import { adjustStock } from "@/actions/stock";
import { PartForm, ServiceTemplateForm } from "@/components/forms/part-form";
import { Badge, Card, EmptyState, PageHeader, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { parts, serviceTemplates } from "@/lib/db/schema";
import { formatMoney, formatVat } from "@/lib/format";


export default async function StockPage() {
  const [allParts, allServices] = await Promise.all([
    db.select().from(parts).orderBy(desc(parts.createdAt)).limit(200),
    db.select().from(serviceTemplates).orderBy(desc(serviceTemplates.createdAt)).limit(100),
  ]);

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
