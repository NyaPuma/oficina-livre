import { asc } from "drizzle-orm";
import { DocumentForm } from "@/components/forms/document-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { customers, parts, serviceTemplates, vehicles } from "@/lib/db/schema";


export default async function NewQuotePage() {
  const [allCustomers, allVehicles, allParts, allServices] = await Promise.all([
    db.select({ id: customers.id, name: customers.name }).from(customers).orderBy(asc(customers.name)),
    db.select({
      id: vehicles.id,
      customerId: vehicles.customerId,
      plate: vehicles.plate,
      brand: vehicles.brand,
      model: vehicles.model,
    }).from(vehicles).orderBy(asc(vehicles.plate)),
    db.select({
      id: parts.id,
      description: parts.description,
      salePriceCents: parts.salePriceCents,
      vatRateBps: parts.vatRateBps,
    }).from(parts).orderBy(asc(parts.description)),
    db.select({
      id: serviceTemplates.id,
      name: serviceTemplates.name,
      salePriceCents: serviceTemplates.salePriceCents,
      vatRateBps: serviceTemplates.vatRateBps,
    }).from(serviceTemplates).orderBy(asc(serviceTemplates.name)),
  ]);

  return (
    <>
      <PageHeader title="Novo orçamento" description="Selecione o cliente, a viatura e os serviços/peças" />
      <Card className="max-w-5xl p-6">
        <DocumentForm
          mode="quote"
          customers={allCustomers}
          vehicles={allVehicles.map((v) => ({ ...v, label: [v.brand, v.model].filter(Boolean).join(" ") }))}
          options={[
            ...allServices.map((s) => ({
              id: s.id,
              kind: "service" as const,
              description: s.name,
              priceCents: s.salePriceCents,
              vatRateBps: s.vatRateBps,
            })),
            ...allParts.map((p) => ({
              id: p.id,
              kind: "part" as const,
              description: p.description,
              priceCents: p.salePriceCents,
              vatRateBps: p.vatRateBps,
            })),
          ]}
        />
      </Card>
    </>
  );
}

export const instant = false;
