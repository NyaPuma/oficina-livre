import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  appointments,
  customers,
  invoices,
  parts,
  quotes,
  serviceTemplates,
  sites,
  suppliers,
  vehicles,
  workOrders,
} from "@/lib/db/schema";

export async function GET() {
  if (!(await getCurrentUser())) return new Response("Não autorizado", { status: 401 });

  const [
    allCustomers, allVehicles, allParts, allSuppliers, allServices,
    allSites, allQuotes, allWorkOrders, allAppointments, allInvoices,
  ] = await Promise.all([
    db.select().from(customers).limit(10000),
    db.select().from(vehicles).limit(10000),
    db.select().from(parts).limit(10000),
    db.select().from(suppliers).limit(10000),
    db.select().from(serviceTemplates).limit(10000),
    db.select().from(sites).limit(10000),
    db.select().from(quotes).limit(10000),
    db.select().from(workOrders).limit(10000),
    db.select().from(appointments).limit(10000),
    db.select().from(invoices).limit(10000),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    version: 1,
    customers: allCustomers,
    vehicles: allVehicles,
    parts: allParts,
    suppliers: allSuppliers,
    serviceTemplates: allServices,
    sites: allSites,
    quotes: allQuotes,
    workOrders: allWorkOrders,
    appointments: allAppointments,
    invoices: allInvoices,
  };

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="oficina-livre-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
