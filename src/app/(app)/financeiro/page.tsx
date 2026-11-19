import { payPayable } from "@/actions/invoicing";
import { PayableForm } from "@/components/forms/payable-form";
import { Badge, Card, EmptyState, PageHeader, StatCard, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDate, formatMoney } from "@/lib/format";

export default async function FinanceiroPage() {
  const [payables, paidInvoices, allPayments] = await Promise.all([
    db.query.accountsPayable.findMany({
      with: { supplier: true },
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit: 200,
    }),
    db.query.invoices.findMany({ where: (i, { eq }) => eq(i.status, "paga"), with: { payments: true } }),
    db.query.payments.findMany({ orderBy: (p, { desc }) => [desc(p.paidAt)], limit: 20 }),
  ]);

  const openPayables = payables.filter((p) => !p.paidAt);
  const totalOpen = openPayables.reduce((sum, p) => sum + p.amountCents, 0);
  const totalPaidOut = payables.filter((p) => p.paidAt).reduce((sum, p) => sum + p.amountCents, 0);
  const totalReceived = paidInvoices.reduce((sum, i) => sum + i.paidCents, 0);

  return (
    <>
      <PageHeader title="Financeiro" description="Contas a pagar, recebimentos e fluxo de caixa" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Recebido (faturas pagas)" value={formatMoney(totalReceived)} hint="Entradas" />
        <StatCard label="Contas a pagar em aberto" value={formatMoney(totalOpen)} hint={`${openPayables.length} pendentes`} />
        <StatCard label="Pago a fornecedores" value={formatMoney(totalPaidOut)} hint="Saídas" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="px-5 py-4"><h2 className="font-semibold text-slate-900">Contas a pagar</h2></div>
          {payables.length === 0 ? (
            <EmptyState title="Sem contas a pagar" />
          ) : (
            <TableWrapper>
              <table className="w-full">
                <thead className="bg-slate-50"><tr>
                  <th className={tableClasses.th}>Descrição</th>
                  <th className={tableClasses.th}>Categoria</th>
                  <th className={tableClasses.th}>Vencimento</th>
                  <th className={tableClasses.th}>Valor</th>
                  <th className={tableClasses.th}>Ação</th>
                </tr></thead>
                <tbody>
                  {payables.map((payable) => (
                    <tr key={payable.id} className={tableClasses.row}>
                      <td className={tableClasses.td}>{payable.description}</td>
                      <td className={tableClasses.td}>{payable.category ?? "—"}</td>
                      <td className={tableClasses.td}>{formatDate(payable.dueAt)}</td>
                      <td className={tableClasses.td}>{formatMoney(payable.amountCents)}</td>
                      <td className={tableClasses.td}>
                        {payable.paidAt ? (
                          <Badge tone="green">Pago</Badge>
                        ) : (
                          <form action={payPayable}>
                            <input type="hidden" name="id" value={payable.id} />
                            <button type="submit" className="text-xs text-slate-900 underline">Marcar pago</button>
                          </form>
                        )}
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
            <h2 className="mb-4 font-semibold text-slate-900">Nova conta a pagar</h2>
            <PayableForm />
          </Card>
          <Card>
            <div className="px-5 py-4"><h2 className="font-semibold text-slate-900">Últimos recebimentos</h2></div>
            {allPayments.length === 0 ? (
              <EmptyState title="Sem recebimentos" />
            ) : (
              <ul className="divide-y divide-slate-100 px-5 pb-3">
                {allPayments.map((payment) => (
                  <li key={payment.id} className="flex justify-between py-2 text-sm">
                    <span className="text-slate-600">{payment.method}</span>
                    <span className="font-medium text-emerald-600">{formatMoney(payment.amountCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

export const instant = false;
