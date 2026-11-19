import { asc } from "drizzle-orm";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { customers, sites, users, vehicles } from "@/lib/db/schema";

export default async function NewAppointmentPage() {
  const [allCustomers, allVehicles, allUsers, allSites] = await Promise.all([
    db.select({ id: customers.id, name: customers.name }).from(customers).orderBy(asc(customers.name)),
    db.select({ id: vehicles.id, customerId: vehicles.customerId, plate: vehicles.plate, brand: vehicles.brand, model: vehicles.model }).from(vehicles).orderBy(asc(vehicles.plate)),
    db.select({ id: users.id, name: users.name }).from(users).orderBy(asc(users.name)),
    db.select({ id: sites.id, name: sites.name }).from(sites).orderBy(asc(sites.name)),
  ]);

  return (
    <>
      <PageHeader title="Nova marcação" description="O sistema avisa sobre sobreposições de técnico e rampa" />
      <Card className="max-w-4xl p-6">
        <AppointmentForm
          customers={allCustomers}
          vehicles={allVehicles.map((v) => ({ ...v, label: [v.brand, v.model].filter(Boolean).join(" ") }))}
          users={allUsers}
          sites={allSites}
        />
      </Card>
    </>
  );
}

export const instant = false;
