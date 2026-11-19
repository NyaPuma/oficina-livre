import { asc, eq } from "drizzle-orm";
import { DocumentForm } from "@/components/forms/document-form";
import { Card, PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { customers, parts, quotes, serviceTemplates, sites, users, vehicles } from "@/lib/db/schema";


export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ quote?: string }>;
}) {
  const { quote: quoteParam } = await searchParams;
  const quoteId = Number(quoteParam);
  const initialQuote = Number.isInteger(quoteId) && quoteId > 0
    ? await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
        columns: { id: true, number: true, customerId: true },
      })
    : undefined;

  const [allCustomers, allVehicles, allParts, allServices, allUsers, allQuotes, allSites] = await Promise.all([
    db.select({ id: customers.id, name: customers.name }).from(customers).orderBy(asc(customers.name)),
    db.select({ id: vehicles.id, customerId: vehicles.customerId, plate: vehicles.plate, brand: vehicles.brand, model: vehicles.model }).from(vehicles).orderBy(asc(vehicles.plate)),
    db.select({ id: parts.id, description: parts.description, salePriceCents: parts.salePriceCents, vatRateBps: parts.vatRateBps }).from(parts).orderBy(asc(parts.description)),
    db.select({ id: serviceTemplates.id, name: serviceTemplates.name, salePriceCents: serviceTemplates.salePriceCents, vatRateBps: serviceTemplates.vatRateBps }).from(serviceTemplates).orderBy(asc(serviceTemplates.name)),
    db.select({ id: users.id, name: users.name }).from(users).orderBy(asc(users.name)),
    db.select({ id: quotes.id, number: quotes.number, customerId: quotes.customerId }).from(quotes).orderBy(asc(quotes.id)),
    db.select({ id: sites.id, name: sites.name }).from(sites).orderBy(asc(sites.name)),
  ]);

  return (
    <>
      <PageHeader title="Nova ordem de serviço" description="Registe a entrada da viatura, o diagnóstico e as intervenções" />
      <Card className="max-w-5xl p-6">
        <DocumentForm
          mode="order"
          customers={allCustomers}
          vehicles={allVehicles.map((v) => ({ ...v, label: [v.brand, v.model].filter(Boolean).join(" ") }))}
          options={[
            ...allServices.map((s) => ({ id: s.id, kind: "service" as const, description: s.name, priceCents: s.salePriceCents, vatRateBps: s.vatRateBps })),
            ...allParts.map((p) => ({ id: p.id, kind: "part" as const, description: p.description, priceCents: p.salePriceCents, vatRateBps: p.vatRateBps })),
          ]}
          users={allUsers}
          quotes={allQuotes}
          sites={allSites}
          initialQuoteId={initialQuote?.id}
          initialQuoteCustomerId={initialQuote?.customerId}
        />
      </Card>
    </>
  );
}

export const instant = false;
