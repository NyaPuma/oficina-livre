"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, errorState, firstZodIssue, successState } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { consents, customers, vehicles } from "@/lib/db/schema";
import { customerSchema, vehicleSchema } from "@/lib/validation";

export async function createCustomer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    nif: formData.get("nif") ?? "",
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const data = parsed.data;
  const [customer] = await db
    .insert(customers)
    .values({
      name: data.name,
      nif: data.nif || null,
      phone: data.phone,
      email: data.email || null,
      address: data.address,
      postalCode: data.postalCode,
      city: data.city,
      notes: data.notes,
    })
    .returning({ id: customers.id });

  if (formData.get("consent") === "on") {
    await db.insert(consents).values({ customerId: customer.id, type: "privacidade", documentVersion: "1.0" });
  }

  await logAudit(user.id, "criar", "cliente", customer.id, { name: data.name });
  revalidatePath("/clientes");
  redirect(`/clientes/${customer.id}?novo=1`);
}

export async function createVehicle(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = vehicleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const data = parsed.data;
  try {
    const [vehicle] = await db
      .insert(vehicles)
      .values({
        customerId: data.customerId,
        plate: data.plate,
        vin: data.vin,
        brand: data.brand,
        model: data.model,
        year: data.year,
        fuel: data.fuel,
        mileage: data.mileage,
        notes: data.notes,
      })
      .returning({ id: vehicles.id });
    await logAudit(user.id, "criar", "viatura", vehicle.id, { plate: data.plate });
  } catch {
    return errorState("Não foi possível guardar. Verifique se a matrícula já existe.");
  }

  revalidatePath(`/clientes/${data.customerId}`);
  return successState("Viatura adicionada.");
}

export async function recordConsent(formData: FormData): Promise<void> {
  const user = await requireUser();
  const customerId = Number(formData.get("customerId"));
  const type = String(formData.get("type")) as "privacidade" | "comercial";
  if (!Number.isInteger(customerId) || !["privacidade", "comercial"].includes(type)) return;

  const revoked = formData.get("revoke") === "1";
  await db.insert(consents).values({
    customerId,
    type,
    grantedAt: new Date(),
    ...(revoked ? { revokedAt: new Date() } : {}),
  });
  await logAudit(user.id, revoked ? "revogar_consentimento" : "registar_consentimento", "cliente", customerId, { type });
  revalidatePath(`/clientes/${customerId}`);
}
