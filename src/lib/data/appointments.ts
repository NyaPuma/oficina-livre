import "server-only";

import { db } from "@/lib/db";
import type { AppointmentDTO } from "./types";

export async function getAppointments(): Promise<AppointmentDTO[]> {
  const rows = await db.query.appointments.findMany({
    with: { customer: true, vehicle: true, technician: true, site: true },
    orderBy: (table, { asc }) => [asc(table.startsAt)],
    limit: 200,
  });

  return rows.map((row) => ({
    id: row.id,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status,
    source: row.source,
    ramp: row.ramp,
    notes: row.notes,
    customer: {
      id: row.customer.id,
      name: row.customer.name,
      phone: row.customer.phone,
      email: row.customer.email,
    },
    vehicle: row.vehicle ? { plate: row.vehicle.plate } : null,
    technician: row.technician ? { name: row.technician.name } : null,
    site: row.site ? { name: row.site.name } : null,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    createdAt: row.createdAt.toISOString(),
  }));
}
