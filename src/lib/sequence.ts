import { desc, like } from "drizzle-orm";
import { db } from "./db";
import { invoices, quotes, workOrders } from "./db/schema";
import { documentNumber } from "./format";

export type DocumentPrefix = "OC" | "OR" | "FT" | "RC";

/** Gera OC/OR/FT/RC-AAAA-NNNN de forma sequencial por ano. */
export async function nextDocumentNumber(prefix: DocumentPrefix): Promise<string> {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  let rows: Array<{ number: string }>;
  if (prefix === "OC") {
    rows = await db.select({ number: quotes.number }).from(quotes).where(like(quotes.number, pattern)).orderBy(desc(quotes.number));
  } else if (prefix === "OR") {
    rows = await db.select({ number: workOrders.number }).from(workOrders).where(like(workOrders.number, pattern)).orderBy(desc(workOrders.number));
  } else {
    // Faturas e recibos partilham a tabela de faturas, mas têm séries distintas.
    rows = await db.select({ number: invoices.number }).from(invoices).where(like(invoices.number, pattern)).orderBy(desc(invoices.number));
  }

  const last = rows[0]?.number;
  const sequence = last ? Number(last.split("-").at(-1)) + 1 : 1;
  return documentNumber(prefix, year, Number.isFinite(sequence) ? sequence : 1);
}
