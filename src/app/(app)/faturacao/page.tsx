import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";
import { atCertificateConfigured } from "@/lib/saft";

const statusTone: Record<string, string> = {
  rascunho: "slate",
  emitida: "blue",
  paga: "green",
  anulada: "red",
};

export default async function InvoicesPage() {
  const certified = atCertificateConfigured();
  const invoices = await db.query.invoices.findMany({
    with: { customer: true },
    orderBy: (i, { desc }) => [desc(i.issuedAt)],
    limit: 200,
  });

  const totalEmitido = invoices.filter((i) => i.status !== "anulada").reduce((sum, i) => sum + i.totalCents, 0);
  const totalPago = invoices.filter((i) => i.status !== "anulada").reduce((sum, i) => sum + i.paidCents, 0);

  return (
    <>
      <PageHeader
        title="Faturação"
        description="Faturas emitidas a partir de ordens de serviço ou orçamentos"
        action={{ href: "/api/export/saft", label: "Exportar SAF-T (XML)" }}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs uppercase text-slate-500">Total faturado</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(totalEmitido)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase text-slate-500">Recebido</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatMoney(totalPago)}</p>
          <p className="mt-1 text-xs text-slate-400">Em aberto: {formatMoney(totalEmitido - totalPago)}</p>
        </Card>
      </div>

      <Card>
        {invoices.length === 0 ? (
          <EmptyState title="Sem faturas" description="Emita uma fatura a partir de uma ordem de serviço ou orçamento." />
        ) : (
          <TableWrapper>
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className={tableClasses.th}>Número</th>
                  <th className={tableClasses.th}>Cliente</th>
                  <th className={tableClasses.th}>Data</th>
                  <th className={tableClasses.th}>Vencimento</th>
                  <th className={tableClasses.th}>Estado</th>
                  <th className={tableClasses.th}>Total</th>
                  <th className={tableClasses.th}>Pago</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className={tableClasses.row}>
                    <td className={tableClasses.td}>
                      <Link href={`/faturacao/${invoice.id}`} className="font-medium text-slate-900 hover:underline">{invoice.number}</Link>
                    </td>
                    <td className={tableClasses.td}>{invoice.customer.name}</td>
                    <td className={tableClasses.td}>{formatDate(invoice.issuedAt)}</td>
                    <td className={tableClasses.td}>{formatDate(invoice.dueAt)}</td>
                    <td className={tableClasses.td}><Badge tone={statusTone[invoice.status]}>{invoice.status}</Badge></td>
                    <td className={tableClasses.td}>{formatMoney(invoice.totalCents)}</td>
                    <td className={tableClasses.td}>{formatMoney(invoice.paidCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </Card>
      <p className={`mt-4 rounded-lg px-3 py-2 text-xs ${certified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
        {certified
          ? "Número de certificado de software AT configurado. Ainda assim, valide a estrutura e a ordem dos hashes com o contabilista antes de submeter à AT."
          : "Sem número de certificado de software AT (AT_SOFTWARE_CERTIFICATE_NUMBER). A exportação é para apoio à contabilidade, não um SAF-T certificado."}
      </p>
    </>
  );
}

export const instant = false;
