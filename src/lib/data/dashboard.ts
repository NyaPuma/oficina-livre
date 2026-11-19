import "server-only";

import { and, count, eq, inArray, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appointments, customers, invoices, parts, quotes, workOrders } from "@/lib/db/schema";
import { getRecentWorkOrders } from "./work-orders";
import type { DashboardDTO } from "./types";

const OPEN_STATUSES = ["recebida", "diagnostico", "aguarda_peca", "em_reparacao", "pronta"] as const;

export async function getDashboardData(): Promise<DashboardDTO> {
  const [user, openOrders, pendingQuotes, lowStock, totalCustomers, futureAppointments, openInvoices, recentOrders] =
    await Promise.all([
      getCurrentUser(),
      db.select({ value: count() }).from(workOrders).where(inArray(workOrders.status, [...OPEN_STATUSES])),
      db.select({ value: count() }).from(quotes).where(eq(quotes.status, "enviado")),
      db
        .select({ id: parts.id, code: parts.code, description: parts.description, stockQty: parts.stockQty, minStock: parts.minStock })
        .from(parts)
        .where(and(eq(parts.active, true), sql`${parts.stockQty} <= ${parts.minStock}`))
        .orderBy(sql`${parts.stockQty} asc`)
        .limit(6),
      db.select({ value: count() }).from(customers),
      db.select({ value: count() }).from(appointments).where(eq(appointments.status, "confirmada")),
      db.select({ value: count() }).from(invoices).where(inArray(invoices.status, ["emitida", "rascunho"])),
      getRecentWorkOrders(6),
    ]);

  return {
    userName: user?.name ?? "mecânico",
    userRole: user?.role ?? "mecanico",
    openOrders: openOrders[0]?.value ?? 0,
    pendingQuotes: pendingQuotes[0]?.value ?? 0,
    lowStock,
    customers: totalCustomers[0]?.value ?? 0,
    appointments: futureAppointments[0]?.value ?? 0,
    openInvoices: openInvoices[0]?.value ?? 0,
    recentOrders,
  };
}
