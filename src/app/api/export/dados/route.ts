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
    db.select().from(customers),
    db.select().from(vehicles),
    db.select().from(parts),
    db.select().from(suppliers),
    db.select().from(serviceTemplates),
    db.select().from(sites),
    db.select().from(quotes),
    db.select().from(workOrders),
    db.select().from(appointments),
    db.select().from(invoices),
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
