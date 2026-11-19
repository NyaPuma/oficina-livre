import { asc } from "drizzle-orm";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { customers, users, vehicles } from "@/lib/db/schema";

export default async function NewAppointmentPage() {
  const [allCustomers, allVehicles, allUsers] = await Promise.all([
    db.select({ id: customers.id, name: customers.name }).from(customers).orderBy(asc(customers.name)),
    db.select({ id: vehicles.id, customerId: vehicles.customerId, plate: vehicles.plate, brand: vehicles.brand, model: vehicles.model }).from(vehicles).orderBy(asc(vehicles.plate)),
    db.select({ id: users.id, name: users.name }).from(users).orderBy(asc(users.name)),
  ]);

  return (
    <>
      <PageHeader title="Nova marcação" description="O sistema avisa sobre sobreposições de técnico e rampa" />
      <Card className="max-w-4xl p-6">
        <AppointmentForm
          customers={allCustomers}
          vehicles={allVehicles.map((v) => ({ ...v, label: [v.brand, v.model].filter(Boolean).join(" ") }))}
          users={allUsers}
        />
      </Card>
    </>
  );
}

export const instant = false;
