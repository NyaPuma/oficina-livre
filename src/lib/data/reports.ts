import "server-only";

import { count, desc, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { accountsPayable, invoices, payments, quotes, workOrderLines, workOrders } from "@/lib/db/schema";

export type ReportDTO = {
  totalFaturado: number;
  faturadoEsteMes: number;
  totalRecebido: number;
  totalPagoFornecedores: number;
  ticketMedio: number;
  quotesTotal: number;
  quotesAprovados: number;
  statusCounts: Record<string, number>;
  topServicos: Array<{ description: string; quantity: number }>;
  topClientes: Array<{ name: string; total: number }>;
  cashRows: Array<{ month: string; in: number; out: number }>;
};

const num = (value: unknown): number => Number(value ?? 0);

export async function getReports(): Promise<ReportDTO> {
  const [invoiceStats, received, paidOut, quoteStats, statusRows, topServices, topCustomers, cash] =
    await Promise.all([
      db
        .select({
          total: sql<number>`coalesce(sum(${invoices.totalCents}), 0)`,
          count: sql<number>`count(*)`,
          thisMonth: sql<number>`coalesce(sum(case when ${invoices.issuedAt} >= date_trunc('month', now()) then ${invoices.totalCents} else 0 end), 0)`,
        })
        .from(invoices)
        .where(ne(invoices.status, "anulada")),
      db.select({ value: sql<number>`coalesce(sum(${payments.amountCents}), 0)` }).from(payments),
      db
        .select({ value: sql<number>`coalesce(sum(${accountsPayable.amountCents}), 0)` })
        .from(accountsPayable)
        .where(sql`${accountsPayable.paidAt} is not null`),
      db
        .select({ status: quotes.status, value: count() })
        .from(quotes)
        .groupBy(quotes.status),
      db
        .select({ status: workOrders.status, value: count() })
        .from(workOrders)
        .groupBy(workOrders.status),
      db
        .select({ description: workOrderLines.description, quantity: sql<number>`sum(${workOrderLines.quantity})` })
        .from(workOrderLines)
        .groupBy(workOrderLines.description)
        .orderBy(desc(sql`sum(${workOrderLines.quantity})`))
        .limit(5),
      db
        .select({ name: invoices.customerName, total: sql<number>`sum(${invoices.totalCents})` })
        .from(invoices)
        .where(ne(invoices.status, "anulada"))
        .groupBy(invoices.customerName)
        .orderBy(desc(sql`sum(${invoices.totalCents})`))
        .limit(5),
      db.execute(sql`
        select to_char(month, 'YYYY-MM') as month,
               sum(in_cents) as in_cents,
               sum(out_cents) as out_cents
        from (
          select date_trunc('month', ${payments.paidAt}) as month,
                 ${payments.amountCents} as in_cents,
                 0 as out_cents
          from ${payments}
          union all
          select date_trunc('month', ${accountsPayable.paidAt}) as month,
                 0,
                 ${accountsPayable.amountCents}
          from ${accountsPayable}
          where ${accountsPayable.paidAt} is not null
        ) fluxo
        group by month
        order by month desc
        limit 6
      `),
    ]);

  const totals = invoiceStats[0];
  const quoteTotal = quoteStats.reduce((acc, row) => acc + row.value, 0);
  const quoteApproved = quoteStats.find((row) => row.status === "aprovado")?.value ?? 0;
  const statusCounts: Record<string, number> = {};
  for (const row of statusRows) statusCounts[row.status] = row.value;

  const cashRows = (cash.rows ?? []).map((row) => ({
    month: String(row.month),
    in: num(row.in_cents),
    out: num(row.out_cents),
  }));

  return {
    totalFaturado: num(totals?.total),
    faturadoEsteMes: num(totals?.thisMonth),
    totalRecebido: num(received[0]?.value),
    totalPagoFornecedores: num(paidOut[0]?.value),
    ticketMedio: num(totals?.count) ? Math.round(num(totals?.total) / num(totals?.count)) : 0,
    quotesTotal: quoteTotal,
    quotesAprovados: quoteApproved,
    statusCounts,
    topServicos: topServices.map((row) => ({ description: row.description, quantity: num(row.quantity) })),
    topClientes: topCustomers.map((row) => ({ name: row.name, total: num(row.total) })),
    cashRows,
  };
}
