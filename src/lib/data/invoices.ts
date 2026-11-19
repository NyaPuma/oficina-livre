import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import type { InvoiceDTO } from "./types";

function toDTO(row: {
  id: number;
  number: string;
  status: string;
  issuedAt: Date;
  dueAt: Date | null;
  customerName: string;
  customerNif: string | null;
  customerAddress: string | null;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  paidCents: number;
  atcud: string | null;
  documentHash: string | null;
  certifiedNumber: string | null;
  lines: InvoiceDTO["lines"];
  payments: Array<{ id: number; amountCents: number; method: string; reference: string | null; paidAt: Date }>;
}): InvoiceDTO {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    issuedAt: row.issuedAt.toISOString(),
    dueAt: row.dueAt?.toISOString() ?? null,
    customerName: row.customerName,
    customerNif: row.customerNif,
    customerAddress: row.customerAddress,
    subtotalCents: row.subtotalCents,
    vatCents: row.vatCents,
    totalCents: row.totalCents,
    paidCents: row.paidCents,
    atcud: row.atcud,
    documentHash: row.documentHash,
    certifiedNumber: row.certifiedNumber,
    lines: row.lines,
    payments: row.payments.map((payment) => ({
      id: payment.id,
      amountCents: payment.amountCents,
      method: payment.method,
      reference: payment.reference,
      paidAt: payment.paidAt.toISOString(),
    })),
  };
}

export async function getInvoices(): Promise<InvoiceDTO[]> {
  const rows = await db.query.invoices.findMany({
    with: { lines: true, payments: true },
    orderBy: (table, { desc }) => [desc(table.issuedAt)],
    limit: 200,
  });
  return rows.map(toDTO);
}

export async function getInvoiceDetail(id: number): Promise<InvoiceDTO | null> {
  const row = await db.query.invoices.findFirst({
    where: eq(invoices.id, id),
    with: {
      lines: true,
      payments: true,
      workOrder: true,
      quote: true,
      paymentIntents: true,
    },
  });
  if (!row) return null;
  return toDTO(row);
}
