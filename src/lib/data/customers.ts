import "server-only";

import { eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import type { CustomerDTO } from "./types";

function toDTO(customer: {
  id: number;
  name: string;
  nif: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  notes: string | null;
  vehicles: CustomerDTO["vehicles"];
  consents: Array<{ revokedAt: Date | null }>;
}): CustomerDTO {
  return {
    id: customer.id,
    name: customer.name,
    nif: customer.nif,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    postalCode: customer.postalCode,
    city: customer.city,
    notes: customer.notes,
    hasConsent: customer.consents.some((consent) => !consent.revokedAt),
    vehicles: customer.vehicles,
  };
}

export async function getCustomers(query?: string): Promise<CustomerDTO[]> {
  const term = query?.trim();
  const rows = await db.query.customers.findMany({
    where: term
      ? or(ilike(customers.name, `%${term}%`), ilike(customers.nif, `%${term}%`))
      : undefined,
    with: {
      vehicles: { columns: { id: true, plate: true, brand: true, model: true, year: true, mileage: true } },
      consents: { columns: { revokedAt: true } },
    },
    orderBy: (table, { asc }) => [asc(table.name)],
    limit: 100,
  });
  return rows.map(toDTO);
}

export async function getCustomerDetail(id: number): Promise<CustomerDTO | null> {
  const row = await db.query.customers.findFirst({
    where: eq(customers.id, id),
    with: {
      vehicles: true,
      consents: true,
      workOrders: { orderBy: (wo, { desc }) => [desc(wo.createdAt)], limit: 20 },
      quotes: { orderBy: (q, { desc }) => [desc(q.createdAt)], limit: 20 },
    },
  });
  if (!row) return null;

  return {
    ...toDTO(row),
    workOrders: row.workOrders.map((order) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    })),
    quotes: row.quotes.map((quote) => ({
      id: quote.id,
      number: quote.number,
      status: quote.status,
      createdAt: quote.createdAt.toISOString(),
    })),
  };
}
