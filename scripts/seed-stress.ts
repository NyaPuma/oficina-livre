#!/usr/bin/env tsx
/**
 * Seeder de carga (stress test). Cria grande volume de dados identificados com
 * prefixos STRESS-/ST- para poderem ser removidos depois.
 *
 *   STRESS_SCALE=3 npm run db:seed:stress   (3x o volume base)
 *   npm run db:clean:stress                 (remove tudo o que foi criado aqui)
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { like, sql } from "drizzle-orm";
import { Pool } from "pg";
import "dotenv/config";
import * as schema from "../src/lib/db/schema";

const SCALE = Math.max(1, Number(process.env.STRESS_SCALE ?? 1));
const N = {
  customers: 2000 * SCALE,
  vehicles: 3200 * SCALE,
  parts: 300 * SCALE,
  workOrders: 6000 * SCALE,
  quotes: 2500 * SCALE,
  invoices: 4000 * SCALE,
  appointments: 2500 * SCALE,
  audits: 2000 * SCALE,
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://oficina:oficina@localhost:5432/oficina_livre",
  max: 10,
});
const db = drizzle(pool, { schema });
const CHUNK = 500;

function chunks<T>(items: T[], size = CHUNK): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size));
  return result;
}

function pick<T>(list: T[], index: number): T {
  return list[index % list.length];
}

const STATUSES: string[] = ["recebida", "diagnostico", "aguarda_peca", "em_reparacao", "pronta", "entregue", "cancelada"] as const;
const QUOTE_STATUSES: string[] = ["rascunho", "enviado", "aprovado", "rejeitado"] as const;
const INVOICE_STATUSES: string[] = ["emitida", "paga", "anulada"] as const;
const BRANDS = ["Seat", "Volkswagen", "Renault", "Peugeot", "BMW", "Mercedes", "Toyota", "Ford", "Audi", "Fiat"];
const MODELS = ["Ibiza", "Golf", "Clio", "208", "Série 3", "Classe A", "Yaris", "Focus", "A3", "Punto"];
const SERVICES = ["Revisão completa", "Troca de óleo e filtro", "Pastilhas de travão", "Diagnóstico eletrónico", "Alinhamento de direção"];

function dateDaysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function insertAndReturnIds<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
): Promise<number[]> {
  const ids: number[] = [];
  for (const chunk of chunks(rows)) {
    const inserted = await db.insert(table).values(chunk).returning({ id: sql<number>`id` });
    ids.push(...inserted.map((row) => row.id));
  }
  return ids;
}

async function main() {
  console.log(`📊 Stress test — escala ${SCALE}x`);
  const started = Date.now();

  console.log("→ clientes");
  const customerRows = Array.from({ length: N.customers }, (_, i) => ({
    name: `STRESS-Cliente-${String(i + 1).padStart(6, "0")}`,
    nif: String(900000000 + i).slice(0, 9),
    phone: `9${String(10000000 + i).slice(-8)}`,
    email: `stress${i}@exemplo.pt`,
    city: pick(["Porto", "Lisboa", "Braga", "Coimbra", "Faro"], i),
  }));
  const customerIds = await insertAndReturnIds(schema.customers, customerRows);

  console.log("→ viaturas");
  const vehicleRows = Array.from({ length: N.vehicles }, (_, i) => ({
    customerId: pick(customerIds, i),
    plate: `ST-${String(i % 100).padStart(2, "0")}-${String(Math.floor(i / 100) % 100).padStart(2, "0")}${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + (Math.floor(i / 26) % 26))}`,
    brand: pick(BRANDS, i),
    model: pick(MODELS, i),
    year: 1998 + (i % 27),
    mileage: 1000 + (i % 280000),
  }));
  const vehicleIds = await insertAndReturnIds(schema.vehicles, vehicleRows);

  console.log("→ peças");
  const partRows = Array.from({ length: N.parts }, (_, i) => ({
    code: `ST-PART-${String(i + 1).padStart(5, "0")}`,
    description: `Peça stress ${i + 1}`,
    costCents: 100 + (i % 9000),
    salePriceCents: 200 + (i % 15000),
    stockQty: i % 40,
    minStock: 5,
    vatRateBps: 2300,
  }));
  const partIds = await insertAndReturnIds(schema.parts, partRows);

  console.log("→ ordens de serviço");
  const orderRows = Array.from({ length: N.workOrders }, (_, i) => ({
    number: `OR-ST-${String(i + 1).padStart(7, "0")}`,
    customerId: pick(customerIds, i),
    vehicleId: pick(vehicleIds, i),
    status: pick(STATUSES, i),
    odometer: 1000 + (i % 280000),
    complaint: `Queixa stress ${i + 1}: barulho e perda de potência`,
    diagnosis: i % 3 === 0 ? `Diagnóstico stress ${i + 1}` : null,
    createdAt: dateDaysAgo(i % 400),
  }));
  const orderIds = await insertAndReturnIds(schema.workOrders, orderRows);

  console.log("→ linhas de ordens");
  const lineRows = orderIds.map((workOrderId, i) => ({
    workOrderId,
    partId: i % 3 === 0 ? pick(partIds, i) : null,
    description: i % 3 === 0 ? `Peça stress ${i}` : pick(SERVICES, i),
    quantity: 1 + (i % 4),
    unitPriceCents: 1500 + (i % 20000),
    vatRateBps: i % 3 === 0 ? 2300 : 1300,
    discountCents: 0,
    stockDeducted: false,
  }));
  for (const chunk of chunks(lineRows)) {
    await db.insert(schema.workOrderLines).values(chunk);
  }

  console.log("→ orçamentos e linhas");
  const quoteRows = Array.from({ length: N.quotes }, (_, i) => ({
    number: `OC-ST-${String(i + 1).padStart(7, "0")}`,
    customerId: pick(customerIds, i),
    vehicleId: pick(vehicleIds, i),
    status: pick(QUOTE_STATUSES, i),
    createdAt: dateDaysAgo(i % 300),
  }));
  const quoteIds = await insertAndReturnIds(schema.quotes, quoteRows);
  const quoteLines = quoteIds.map((id, i) => ({
    quoteId: id,
    description: pick(SERVICES, i),
    quantity: 1 + (i % 3),
    unitPriceCents: 2000 + (i % 18000),
    vatRateBps: 1300,
    discountCents: 0,
  }));
  for (const chunk of chunks(quoteLines)) {
    await db.insert(schema.quoteLines).values(chunk);
  }

  console.log("→ faturas, linhas e pagamentos");
  const invoiceRows = Array.from({ length: N.invoices }, (_, i) => {
    const total = 5000 + (i % 90000);
    return {
      number: `FT-ST-${String(i + 1).padStart(7, "0")}`,
      customerId: pick(customerIds, i),
      customerName: `STRESS-Cliente-${String((i % N.customers) + 1).padStart(6, "0")}`,
      customerNif: String(900000000 + (i % N.customers)).slice(0, 9),
      status: pick(INVOICE_STATUSES, i),
      subtotalCents: total,
      vatCents: Math.round(total * 0.23),
      totalCents: Math.round(total * 1.23),
      paidCents: i % 3 === 1 ? Math.round(total * 1.23) : 0,
      issuedAt: dateDaysAgo(i % 400),
    };
  });
  const invoiceIds = await insertAndReturnIds(schema.invoices, invoiceRows);
  const invoiceLines = invoiceIds.map((id, i) => ({
    invoiceId: id,
    description: pick(SERVICES, i),
    quantity: 1,
    unitPriceCents: 5000 + (i % 90000),
    vatRateBps: 2300,
    discountCents: 0,
  }));
  for (const chunk of chunks(invoiceLines)) {
    await db.insert(schema.invoiceLines).values(chunk);
  }
  const payments = invoiceIds
    .filter((_, i) => i % 3 === 1)
    .map((id, i) => ({
      invoiceId: id,
      amountCents: 10000 + (i % 80000),
      method: "multibanco" as const,
      paidAt: dateDaysAgo(i % 390),
    }));
  for (const chunk of chunks(payments)) {
    await db.insert(schema.payments).values(chunk);
  }

  console.log("→ marcações");
  const appointments = Array.from({ length: N.appointments }, (_, i) => {
    const start = new Date(Date.now() + ((i % 60) - 10) * 24 * 60 * 60 * 1000);
    start.setHours(8 + (i % 9), (i % 2) * 30, 0, 0);
    return {
      customerId: pick(customerIds, i),
      vehicleId: pick(vehicleIds, i),
      startsAt: start,
      endsAt: new Date(start.getTime() + 60 * 60 * 1000),
      status: "confirmada" as const,
      source: "interna" as const,
      ramp: `Rampa ST-${i % 8}`,
      notes: `Marcação stress ${i + 1}`,
    };
  });
  for (const chunk of chunks(appointments)) {
    await db.insert(schema.appointments).values(chunk);
  }

  console.log("→ auditoria");
  const audits = Array.from({ length: N.audits }, (_, i) => ({
    action: "stress",
    entity: "ordem_servico",
    entityId: String(pick(orderIds, i)),
    details: { indice: i },
    createdAt: dateDaysAgo(i % 200),
  }));
  for (const chunk of chunks(audits)) {
    await db.insert(schema.auditLogs).values(chunk);
  }

  console.log(`✅ Stress seed concluído em ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(`   ${N.customers} clientes, ${N.workOrders} OS, ${N.invoices} faturas, ${N.appointments} marcações`);
}

async function clean() {
  console.log("🧹 A remover dados de stress...");
  await db.execute(sql`delete from ${schema.paymentIntents} where id >= 0 and invoice_id in (select id from ${schema.invoices} where number like 'FT-ST-%')`);
  await db.execute(sql`delete from ${schema.payments} where invoice_id in (select id from ${schema.invoices} where number like 'FT-ST-%')`);
  await db.execute(sql`delete from ${schema.invoiceLines} where invoice_id in (select id from ${schema.invoices} where number like 'FT-ST-%')`);
  await db.execute(sql`delete from ${schema.invoices} where number like 'FT-ST-%'`);
  await db.execute(sql`delete from ${schema.quoteLines} where quote_id in (select id from ${schema.quotes} where number like 'OC-ST-%')`);
  await db.execute(sql`delete from ${schema.quotes} where number like 'OC-ST-%'`);
  await db.execute(sql`delete from ${schema.workOrderPhotos} where work_order_id in (select id from ${schema.workOrders} where number like 'OR-ST-%')`);
  await db.execute(sql`delete from ${schema.workOrderLines} where work_order_id in (select id from ${schema.workOrders} where number like 'OR-ST-%')`);
  await db.execute(sql`delete from ${schema.appointments} where notes like 'Marcação stress%'`);
  await db.execute(sql`delete from ${schema.auditLogs} where action = 'stress'`);
  await db.execute(sql`delete from ${schema.workOrders} where number like 'OR-ST-%'`);
  await db.execute(sql`delete from ${schema.vehicles} where plate like 'ST-%'`);
  await db.execute(sql`delete from ${schema.parts} where code like 'ST-PART-%'`);
  const removed = await db.delete(schema.customers).where(like(schema.customers.name, "STRESS-%")).returning({ id: schema.customers.id });
  console.log(`✅ Removidos ${removed.length} clientes de stress e registos associados.`);
}

const action = process.argv.includes("--clean") ? clean() : main();
action
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
