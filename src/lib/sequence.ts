import { desc, like } from "drizzle-orm";
import { db } from "./db";
import { quotes, workOrders } from "./db/schema";
import { documentNumber } from "./format";

/** Gera OC-AAAA-NNNN ou OR-AAAA-NNNN de forma sequencial por ano. */
export async function nextDocumentNumber(prefix: "OC" | "OR"): Promise<string> {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  const rows =
    prefix === "OC"
      ? await db.select({ number: quotes.number }).from(quotes).where(like(quotes.number, pattern)).orderBy(desc(quotes.number))
      : await db
          .select({ number: workOrders.number })
          .from(workOrders)
          .where(like(workOrders.number, pattern))
          .orderBy(desc(workOrders.number));

  const last = rows[0]?.number;
  const sequence = last ? Number(last.split("-").at(-1)) + 1 : 1;
  return documentNumber(prefix, year, Number.isFinite(sequence) ? sequence : 1);
}
