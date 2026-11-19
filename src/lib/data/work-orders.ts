import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workOrders } from "@/lib/db/schema";
import type { WorkOrderDTO } from "./types";

function toDTO(row: {
  id: number;
  number: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  odometer: number | null;
  complaint: string | null;
  diagnosis: string | null;
  customer: { id: number; name: string };
  vehicle: { id: number; plate: string; brand: string | null; model: string | null };
  assignee: { id: number; name: string } | null;
  site: { id: number; name: string } | null;
  lines: WorkOrderDTO["lines"];
  photos: WorkOrderDTO["photos"];
}): WorkOrderDTO {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    odometer: row.odometer,
    complaint: row.complaint,
    diagnosis: row.diagnosis,
    customer: row.customer,
    vehicle: row.vehicle,
    assignee: row.assignee,
    site: row.site,
    lines: row.lines,
    photos: row.photos,
  };
}

export async function getWorkOrders(status?: string): Promise<WorkOrderDTO[]> {
  const rows = await db.query.workOrders.findMany({
    where: status ? eq(workOrders.status, status as never) : undefined,
    with: { customer: true, vehicle: true, assignee: true, site: true, lines: true, photos: true },
    orderBy: (table, { desc: descFn }) => [descFn(table.createdAt)],
    limit: 100,
  });
  return rows.map(toDTO);
}

export async function getWorkOrderDetail(id: number): Promise<WorkOrderDTO | null> {
  const row = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, id),
    with: {
      customer: true,
      vehicle: true,
      assignee: true,
      site: true,
      lines: true,
      photos: true,
      invoices: true,
    },
  });
  if (!row) return null;
  return toDTO(row);
}

export async function getRecentWorkOrders(limit = 6): Promise<WorkOrderDTO[]> {
  const rows = await db.query.workOrders.findMany({
    with: { customer: true, vehicle: true, assignee: true, site: true, lines: true, photos: true },
    orderBy: (table, { desc: descFn }) => [descFn(table.createdAt)],
    limit,
  });
  return rows.map(toDTO);
}
