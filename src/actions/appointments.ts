"use server";

import { and, eq, gt, lt, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, errorState, firstZodIssue, successState } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { appointments, customers, vehicles } from "@/lib/db/schema";
import { appointmentSchema, onlineBookingSchema } from "@/lib/validation";

async function hasConflict(
  startsAt: Date,
  endsAt: Date,
  technicianId?: number,
  ramp?: string | null,
  excludeId?: number,
): Promise<boolean> {
  const conditions = [
    eq(appointments.status, "confirmada"),
    lt(appointments.startsAt, endsAt),
    gt(appointments.endsAt, startsAt),
  ];
  const resourceConditions = [];
  if (technicianId) resourceConditions.push(eq(appointments.technicianId, technicianId));
  if (ramp) resourceConditions.push(eq(appointments.ramp, ramp));
  if (resourceConditions.length === 0) return false;
  conditions.push(or(...resourceConditions)!);
  if (excludeId) conditions.push(eq(appointments.id, excludeId)); // usado apenas em edição futura

  const rows = await db.select({ id: appointments.id }).from(appointments).where(and(...conditions)).limit(1);
  return rows.length > 0;
}

export async function createAppointment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = appointmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const data = parsed.data;
  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(startsAt.getTime() + data.durationMinutes * 60_000);
  if (Number.isNaN(startsAt.getTime())) return errorState("Data inválida.");

  if (await hasConflict(startsAt, endsAt, data.technicianId, data.ramp)) {
    return errorState("Já existe uma marcação nesse horário para o técnico ou rampa.");
  }

  await db.insert(appointments).values({
    customerId: data.customerId,
    vehicleId: data.vehicleId,
    siteId: data.siteId,
    workOrderId: data.workOrderId,
    technicianId: data.technicianId,
    ramp: data.ramp,
    startsAt,
    endsAt,
    notes: data.notes,
  });
  await logAudit(user.id, "criar", "marcacao", undefined, { startsAt: startsAt.toISOString() });
  revalidatePath("/agenda");
  redirect("/agenda");
}

export async function setAppointmentStatus(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status"));
  if (!Number.isInteger(id) || !["confirmada", "concluida", "cancelada"].includes(status)) return;

  await db.update(appointments).set({ status: status as "confirmada" | "concluida" | "cancelada" }).where(eq(appointments.id, id));
  await logAudit(user.id, `estado_${status}`, "marcacao", id);
  revalidatePath("/agenda");
}

/** Reserva pública: cria cliente/viatura se necessário e regista a marcação. */
export async function createOnlineBooking(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = onlineBookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const data = parsed.data;
  const startsAt = new Date(`${data.date}T${data.time}:00`);
  if (Number.isNaN(startsAt.getTime())) return errorState("Data ou hora inválida.");
  if (startsAt.getTime() < Date.now() - 60_000) return errorState("Escolha uma data futura.");
  const endsAt = new Date(startsAt.getTime() + 60 * 60_000);

  const existingCustomer = await db.query.customers.findFirst({
    where: (customers, { or, eq }) => or(eq(customers.phone, data.phone), ...(data.email ? [eq(customers.email, data.email)] : [])),
  });
  let customerId: number;
  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const [created] = await db
      .insert(customers)
      .values({ name: data.name, phone: data.phone, email: data.email || null, notes: "Cliente criado por reserva online" })
      .returning({ id: customers.id });
    customerId = created.id;
  }

  const existingVehicle = await db.query.vehicles.findFirst({
    where: (vehicles, { eq }) => eq(vehicles.plate, data.plate),
  });
  let vehicleId: number;
  if (existingVehicle) {
    vehicleId = existingVehicle.id;
  } else {
    const [created] = await db
      .insert(vehicles)
      .values({ customerId, plate: data.plate, notes: "Viatura criada por reserva online" })
      .returning({ id: vehicles.id });
    vehicleId = created.id;
  }

  const duplicate = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.vehicleId, vehicleId),
        eq(appointments.startsAt, startsAt),
        eq(appointments.status, "confirmada"),
      ),
    )
    .limit(1);
  if (duplicate.length > 0) return errorState("Já existe uma marcação para esta viatura nesse horário.");

  await db.insert(appointments).values({
    customerId,
    vehicleId,
    startsAt,
    endsAt,
    source: "online",
    notes: data.description,
    contactName: data.name,
    contactPhone: data.phone,
    contactEmail: data.email || null,
  });

  await logAudit(null, "reserva_online", "marcacao", undefined, { plate: data.plate });
  revalidatePath("/agenda");
  return successState("Marcação registada. A oficina entrará em contacto para confirmar.");
}
