import bcrypt from "bcryptjs";
import { eq, isNull } from "drizzle-orm";
import "dotenv/config";
import { db, pool } from "../src/lib/db";
import {
  appointments,
  customers,
  invoices,
  parts,
  serviceTemplates,
  sites,
  suppliers,
  users,
  vehicles,
  workOrders,
} from "../src/lib/db/schema";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@oficinalivre.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const name = process.env.SEED_ADMIN_NAME ?? "Administrador";

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length === 0) {
    await db.insert(users).values({ name, email, passwordHash: await bcrypt.hash(password, 12), role: "admin" });
    console.log(`Utilizador criado: ${email} / ${password}`);
  } else {
    console.log(`Utilizador já existe: ${email}`);
  }

  // Localização principal e associação de registos antigos.
  const existingSite = await db.query.sites.findFirst({ where: eq(sites.code, "SEDE") });
  let siteId = existingSite?.id;
  if (!siteId) {
    const [created] = await db.insert(sites).values({ name: "Sede", code: "SEDE" }).returning({ id: sites.id });
    siteId = created.id;
  }
  await db.update(workOrders).set({ siteId }).where(isNull(workOrders.siteId));
  await db.update(appointments).set({ siteId }).where(isNull(appointments.siteId));
  await db.update(invoices).set({ siteId }).where(isNull(invoices.siteId));

  // Serviços padrão (mão-de-obra a 13% — validar com contabilista).
  const templates = [
    { name: "Revisão completa", salePriceCents: 18500, vatRateBps: 1300, standardHours: 2 },
    { name: "Troca de óleo e filtro", salePriceCents: 6500, vatRateBps: 1300, standardHours: 1 },
    { name: "Pastilhas de travão", salePriceCents: 12000, vatRateBps: 1300, standardHours: 2 },
    { name: "Alinhamento de direção", salePriceCents: 4500, vatRateBps: 1300, standardHours: 1 },
    { name: "Diagnóstico eletrónico", salePriceCents: 8000, vatRateBps: 1300, standardHours: 1 },
  ];
  for (const template of templates) {
    const found = await db.select({ id: serviceTemplates.id }).from(serviceTemplates).where(eq(serviceTemplates.name, template.name)).limit(1);
    if (found.length === 0) await db.insert(serviceTemplates).values(template);
  }

  // Fornecedor e peças de exemplo.
  let supplierId: number | undefined;
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.name, "Fornecedor Exemplo")).limit(1);
  if (supplier) {
    supplierId = supplier.id;
  } else {
    const [created] = await db.insert(suppliers).values({ name: "Fornecedor Exemplo" }).returning({ id: suppliers.id });
    supplierId = created.id;
  }

  const sampleParts = [
    { code: "FILTRO-OLEO", description: "Filtro de óleo", costCents: 550, salePriceCents: 1200, stockQty: 12, minStock: 3 },
    { code: "OLEO-5W30", description: "Óleo 5W30 (4L)", costCents: 2200, salePriceCents: 3900, stockQty: 20, minStock: 5 },
    { code: "PASTILhas-FR", description: "Pastilhas travão dianteiras", costCents: 3200, salePriceCents: 5500, stockQty: 6, minStock: 2 },
  ];
  for (const part of sampleParts) {
    const found = await db.select({ id: parts.id }).from(parts).where(eq(parts.code, part.code)).limit(1);
    if (found.length === 0) await db.insert(parts).values({ ...part, vatRateBps: 2300, supplierId });
  }

  // Cliente e viatura de demonstração.
  const plate = "00-00-DD";
  const foundVehicle = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.plate, plate)).limit(1);
  if (foundVehicle.length === 0) {
    const [customer] = await db.insert(customers).values({
      name: "Cliente Exemplo",
      nif: "123456789",
      phone: "912 345 678",
      email: "cliente@exemplo.pt",
    }).returning({ id: customers.id });
    await db.insert(vehicles).values({
      customerId: customer.id,
      plate,
      brand: "Seat",
      model: "Ibiza",
      year: 2018,
      fuel: "Diesel",
      mileage: 84500,
    });
  }

  console.log("Seed concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
