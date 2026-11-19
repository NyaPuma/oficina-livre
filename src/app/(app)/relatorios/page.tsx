import { Badge, Card, PageHeader, StatCard, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { formatMoney, STATUS_LABELS } from "@/lib/format";

const monthFormatter = new Intl.DateTimeFormat("pt-PT", { month: "short", year: "2-digit" });

export default async function RelatoriosPage() {
  const [invoices, orders, quotes, payableRows, paymentRows] = await Promise.all([
    db.query.invoices.findMany({ with: { lines: true, customer: true } }),
    db.query.workOrders.findMany({ with: { lines: true } }),
    db.query.quotes.findMany(),
    db.query.accountsPayable.findMany(),
    db.query.payments.findMany(),
  ]);

  const validInvoices = invoices.filter((i) => i.status !== "anulada");
  const totalFaturado = validInvoices.reduce((sum, i) => sum + i.totalCents, 0);
  const totalRecebido = paymentRows.reduce((sum, p) => sum + p.amountCents, 0);
  const now = new Date();
  const thisMonth = validInvoices
    .filter((i) => i.issuedAt.getMonth() === now.getMonth() && i.issuedAt.getFullYear() === now.getFullYear())
    .reduce((sum, i) => sum + i.totalCents, 0);
  const ticketMedio = validInvoices.length ? Math.round(totalFaturado / validInvoices.length) : 0;
  const aprovados = quotes.filter((q) => q.status === "aprovado").length;
  const taxaConversao = quotes.length ? Math.round((aprovados / quotes.length) * 100) : 0;

  const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});

  const lineCounts = new Map<string, number>();
  for (const order of orders) {
    for (const line of order.lines) {
      lineCounts.set(line.description, (lineCounts.get(line.description) ?? 0) + line.quantity);
    }
  }
  const topServicos = [...lineCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const customers = new Map<string, number>();
  for (const invoice of validInvoices) {
    customers.set(invoice.customer.name, (customers.get(invoice.customer.name) ?? 0) + invoice.totalCents);
  }
  const topClientes = [...customers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const cash = new Map<string, { in: number; out: number }>();
  const keyFor = (date: Date) => monthFormatter.format(date);
  for (const payment of paymentRows) {
    const key = keyFor(payment.paidAt);
    const entry = cash.get(key) ?? { in: 0, out: 0 };
    entry.in += payment.amountCents;
    cash.set(key, entry);
  }
  for (const payable of payableRows.filter((p) => p.paidAt)) {
    const key = keyFor(payable.paidAt!);
    const entry = cash.get(key) ?? { in: 0, out: 0 };
    entry.out += payable.amountCents;
    cash.set(key, entry);
  }
  const cashRows = [...cash.entries()].slice(-6);

  return (
    <>
      <PageHeader title="Relatórios" description="Indicadores de gestão da oficina" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total faturado" value={formatMoney(totalFaturado)} />
        <StatCard label="Faturado este mês" value={formatMoney(thisMonth)} />
        <StatCard label="Recebido" value={formatMoney(totalRecebido)} />
        <StatCard label="Ticket médio" value={formatMoney(ticketMedio)} />
        <StatCard label="Conversão de orçamentos" value={`${taxaConversao}%`} hint={`${aprovados} aprovados de ${quotes.length}`} />
        <StatCard label="OS concluídas" value={String(statusCounts.entregue ?? 0)} />
        <StatCard label="OS em curso" value={String((statusCounts.recebida ?? 0) + (statusCounts.diagnostico ?? 0) + (statusCounts.em_reparacao ?? 0))} />
        <StatCard label="Margem bruta (recebido - pago)" value={formatMoney(totalRecebido - payableRows.filter((p) => p.paidAt).reduce((s, p) => s + p.amountCents, 0))} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="px-5 py-4"><h2 className="font-semibold text-slate-900">Serviços mais executados</h2></div>
          {topServicos.length === 0 ? <p className="px-5 pb-5 text-sm text-slate-500">Sem dados.</p> : (
            <ul className="divide-y divide-slate-100 px-5 pb-3">
              {topServicos.map(([name, qty]) => (
                <li key={name} className="flex justify-between py-2 text-sm"><span>{name}</span><Badge>{qty}x</Badge></li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="px-5 py-4"><h2 className="font-semibold text-slate-900">Melhores clientes</h2></div>
          {topClientes.length === 0 ? <p className="px-5 pb-5 text-sm text-slate-500">Sem dados.</p> : (
            <ul className="divide-y divide-slate-100 px-5 pb-3">
              {topClientes.map(([name, total]) => (
                <li key={name} className="flex justify-between py-2 text-sm"><span>{name}</span><span className="font-medium text-slate-800">{formatMoney(total)}</span></li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="px-5 py-4"><h2 className="font-semibold text-slate-900">Ordens por estado</h2></div>
          <TableWrapper>
            <table className="w-full">
              <thead className="bg-slate-50"><tr><th className={tableClasses.th}>Estado</th><th className={tableClasses.th}>Quantidade</th></tr></thead>
              <tbody>
                {Object.entries(statusCounts).map(([status, qty]) => (
                  <tr key={status} className={tableClasses.row}>
                    <td className={tableClasses.td}>{STATUS_LABELS[status] ?? status}</td>
                    <td className={tableClasses.td}>{qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        </Card>

        <Card>
          <div className="px-5 py-4"><h2 className="font-semibold text-slate-900">Fluxo de caixa mensal</h2></div>
          {cashRows.length === 0 ? <p className="px-5 pb-5 text-sm text-slate-500">Sem movimentos.</p> : (
            <TableWrapper>
              <table className="w-full">
                <thead className="bg-slate-50"><tr>
                  <th className={tableClasses.th}>Mês</th><th className={tableClasses.th}>Entradas</th>
                  <th className={tableClasses.th}>Saídas</th><th className={tableClasses.th}>Saldo</th>
                </tr></thead>
                <tbody>
                  {cashRows.map(([month, values]) => (
                    <tr key={month} className={tableClasses.row}>
                      <td className={tableClasses.td}>{month}</td>
                      <td className={tableClasses.td}>{formatMoney(values.in)}</td>
                      <td className={tableClasses.td}>{formatMoney(values.out)}</td>
                      <td className={tableClasses.td}>{formatMoney(values.in - values.out)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          )}
        </Card>
      </div>
    </>
  );
}

export const instant = false;
