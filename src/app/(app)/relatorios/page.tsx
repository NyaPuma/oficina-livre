import { Badge, Card, PageHeader, StatCard, TableWrapper, tableClasses } from "@/components/ui";
import { getReports } from "@/lib/data/reports";
import { formatMoney, STATUS_LABELS } from "@/lib/format";

export default async function RelatoriosPage() {
  const data = await getReports();
  const taxaConversao = data.quotesTotal ? Math.round((data.quotesAprovados / data.quotesTotal) * 100) : 0;
  const emCurso =
    (data.statusCounts.recebida ?? 0) +
    (data.statusCounts.diagnostico ?? 0) +
    (data.statusCounts.em_reparacao ?? 0);

  return (
    <>
      <PageHeader title="Relatórios" description="Indicadores de gestão da oficina" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total faturado" value={formatMoney(data.totalFaturado)} />
        <StatCard label="Faturado este mês" value={formatMoney(data.faturadoEsteMes)} />
        <StatCard label="Recebido" value={formatMoney(data.totalRecebido)} />
        <StatCard label="Ticket médio" value={formatMoney(data.ticketMedio)} />
        <StatCard label="Conversão de orçamentos" value={`${taxaConversao}%`} hint={`${data.quotesAprovados} aprovados de ${data.quotesTotal}`} />
        <StatCard label="OS concluídas" value={String(data.statusCounts.entregue ?? 0)} />
        <StatCard label="OS em curso" value={String(emCurso)} />
        <StatCard label="Pago a fornecedores" value={formatMoney(data.totalPagoFornecedores)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="px-5 py-4"><h2 className="font-semibold text-ink">Serviços mais executados</h2></div>
          {data.topServicos.length === 0 ? <p className="px-5 pb-5 text-sm text-slate-500">Sem dados.</p> : (
            <ul className="divide-y divide-line px-5 pb-3">
              {data.topServicos.map((item) => (
                <li key={item.description} className="flex justify-between py-2 text-sm">
                  <span>{item.description}</span><Badge>{item.quantity}x</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="px-5 py-4"><h2 className="font-semibold text-ink">Melhores clientes</h2></div>
          {data.topClientes.length === 0 ? <p className="px-5 pb-5 text-sm text-slate-500">Sem dados.</p> : (
            <ul className="divide-y divide-line px-5 pb-3">
              {data.topClientes.map((item) => (
                <li key={item.name} className="flex justify-between py-2 text-sm">
                  <span className="truncate pr-3">{item.name}</span>
                  <span className="font-medium text-ink">{formatMoney(item.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="px-5 py-4"><h2 className="font-semibold text-ink">Ordens por estado</h2></div>
          <TableWrapper>
            <table className="w-full">
              <thead className="bg-slate-50"><tr><th className={tableClasses.th}>Estado</th><th className={tableClasses.th}>Quantidade</th></tr></thead>
              <tbody>
                {Object.entries(data.statusCounts).map(([status, qty]) => (
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
          <div className="px-5 py-4"><h2 className="font-semibold text-ink">Fluxo de caixa mensal</h2></div>
          {data.cashRows.length === 0 ? <p className="px-5 pb-5 text-sm text-slate-500">Sem movimentos.</p> : (
            <TableWrapper>
              <table className="w-full">
                <thead className="bg-slate-50"><tr>
                  <th className={tableClasses.th}>Mês</th><th className={tableClasses.th}>Entradas</th>
                  <th className={tableClasses.th}>Saídas</th><th className={tableClasses.th}>Saldo</th>
                </tr></thead>
                <tbody>
                  {data.cashRows.map((row) => (
                    <tr key={row.month} className={tableClasses.row}>
                      <td className={tableClasses.td}>{row.month}</td>
                      <td className={tableClasses.td}>{formatMoney(row.in)}</td>
                      <td className={tableClasses.td}>{formatMoney(row.out)}</td>
                      <td className={tableClasses.td}>{formatMoney(row.in - row.out)}</td>
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
