import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { documentTotals, formatDate, formatMoney, STATUS_LABELS } from "@/lib/format";


export default async function QuotesPage() {
  const quotes = await db.query.quotes.findMany({
    with: { customer: true, vehicle: true, lines: true },
    orderBy: (quotes, { desc: descFn }) => [descFn(quotes.createdAt)],
    limit: 100,
  });

  return (
    <>
      <PageHeader title="Orçamentos" description="Propostas enviadas aos clientes" action={{ href: "/orcamentos/novo", label: "Novo orçamento" }} />
      <Card>
        {quotes.length === 0 ? (
          <EmptyState title="Sem orçamentos" description="Crie um orçamento a partir de uma viatura." />
        ) : (
          <TableWrapper>
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className={tableClasses.th}>Número</th>
                  <th className={tableClasses.th}>Cliente</th>
                  <th className={tableClasses.th}>Viatura</th>
                  <th className={tableClasses.th}>Data</th>
                  <th className={tableClasses.th}>Estado</th>
                  <th className={tableClasses.th}>Total</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} className={tableClasses.row}>
                    <td className={tableClasses.td}>
                      <Link href={`/orcamentos/${quote.id}`} className="font-medium text-slate-900 hover:underline">{quote.number}</Link>
                    </td>
                    <td className={tableClasses.td}>{quote.customer.name}</td>
                    <td className={tableClasses.td}>{quote.vehicle.plate}</td>
                    <td className={tableClasses.td}>{formatDate(quote.createdAt)}</td>
                    <td className={tableClasses.td}>
                      <Badge tone={quote.status === "aprovado" ? "green" : quote.status === "enviado" ? "blue" : "slate"}>
                        {STATUS_LABELS[quote.status]}
                      </Badge>
                    </td>
                    <td className={tableClasses.td}>{formatMoney(documentTotals(quote.lines).totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </Card>
    </>
  );
}

export const instant = false;
