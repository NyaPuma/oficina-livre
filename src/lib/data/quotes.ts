import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import type { QuoteDTO } from "./types";

function toDTO(row: {
  id: number;
  number: string;
  status: string;
  createdAt: Date;
  validUntil: Date | null;
  notes: string | null;
  approvedAt: Date | null;
  approvalToken: string | null;
  signatureName: string | null;
  signedAt: Date | null;
  customer: QuoteDTO["customer"];
  vehicle: QuoteDTO["vehicle"];
  lines: QuoteDTO["lines"];
}): QuoteDTO {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    validUntil: row.validUntil?.toISOString() ?? null,
    notes: row.notes,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    approvalToken: row.approvalToken,
    signatureName: row.signatureName,
    signedAt: row.signedAt?.toISOString() ?? null,
    customer: row.customer,
    vehicle: row.vehicle,
    lines: row.lines,
  };
}

export async function getQuotes(): Promise<QuoteDTO[]> {
  const rows = await db.query.quotes.findMany({
    with: { customer: true, vehicle: true, lines: true },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: 100,
  });
  return rows.map(toDTO);
}

export async function getQuoteDetail(id: number): Promise<QuoteDTO | null> {
  const row = await db.query.quotes.findFirst({
    where: eq(quotes.id, id),
    with: { customer: true, vehicle: true, lines: true, workOrders: true },
  });
  if (!row) return null;
  return toDTO(row);
}

export async function getQuoteByToken(token: string): Promise<QuoteDTO | null> {
  const row = await db.query.quotes.findFirst({
    where: (table, { eq }) => eq(table.approvalToken, token),
    with: { customer: true, vehicle: true, lines: true },
  });
  if (!row) return null;
  return toDTO(row);
}
