import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Convenções:
 * - Valores monetários são guardados em centimos (integer) para evitar erros de virgula flutuante.
 * - Taxas de IVA são guardadas em pontos base (2300 = 23%, 1300 = 13%).
 * - `created_at` / `updated_at` existem em todas as entidades principais.
 */

export const userRoleEnum = pgEnum("user_role", ["admin", "gestor", "mecanico"]);
export const quoteStatusEnum = pgEnum("quote_status", [
  "rascunho",
  "enviado",
  "aprovado",
  "rejeitado",
]);
export const workOrderStatusEnum = pgEnum("work_order_status", [
  "recebida",
  "diagnostico",
  "aguarda_peca",
  "em_reparacao",
  "pronta",
  "entregue",
  "cancelada",
]);
export const consentTypeEnum = pgEnum("consent_type", ["privacidade", "comercial"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 180 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("mecanico"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    nif: varchar("nif", { length: 20 }),
    phone: varchar("phone", { length: 40 }),
    email: varchar("email", { length: 180 }),
    address: text("address"),
    postalCode: varchar("postal_code", { length: 20 }),
    city: varchar("city", { length: 100 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("customers_name_idx").on(table.name)],
);

export const vehicles = pgTable(
  "vehicles",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    plate: varchar("plate", { length: 20 }).notNull(),
    vin: varchar("vin", { length: 30 }),
    brand: varchar("brand", { length: 80 }),
    model: varchar("model", { length: 100 }),
    year: integer("year"),
    fuel: varchar("fuel", { length: 40 }),
    mileage: integer("mileage").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("vehicles_plate_unique").on(table.plate),
    index("vehicles_customer_idx").on(table.customerId),
  ],
);

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  nif: varchar("nif", { length: 20 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 180 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const parts = pgTable(
  "parts",
  {
    id: serial("id").primaryKey(),
    supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    code: varchar("code", { length: 60 }).notNull(),
    description: varchar("description", { length: 200 }).notNull(),
    costCents: integer("cost_cents").notNull().default(0),
    salePriceCents: integer("sale_price_cents").notNull().default(0),
    vatRateBps: integer("vat_rate_bps").notNull().default(2300),
    stockQty: integer("stock_qty").notNull().default(0),
    minStock: integer("min_stock").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("parts_code_unique").on(table.code)],
);

export const serviceTemplates = pgTable("service_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  standardHours: integer("standard_hours").notNull().default(1),
  salePriceCents: integer("sale_price_cents").notNull().default(0),
  vatRateBps: integer("vat_rate_bps").notNull().default(1300),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quotes = pgTable(
  "quotes",
  {
    id: serial("id").primaryKey(),
    number: varchar("number", { length: 40 }).notNull(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    vehicleId: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    status: quoteStatusEnum("status").notNull().default("rascunho"),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    notes: text("notes"),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvalToken: varchar("approval_token", { length: 64 }),
    signatureName: varchar("signature_name", { length: 160 }),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("quotes_number_unique").on(table.number),
    uniqueIndex("quotes_approval_token_unique").on(table.approvalToken),
    index("quotes_customer_idx").on(table.customerId),
  ],
);

export const quoteLines = pgTable(
  "quote_lines",
  {
    id: serial("id").primaryKey(),
    quoteId: integer("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    partId: integer("part_id").references(() => parts.id, { onDelete: "set null" }),
    serviceTemplateId: integer("service_template_id").references(() => serviceTemplates.id, {
      onDelete: "set null",
    }),
    description: varchar("description", { length: 240 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull().default(0),
    vatRateBps: integer("vat_rate_bps").notNull().default(2300),
    discountCents: integer("discount_cents").notNull().default(0),
  },
  (table) => [index("quote_lines_quote_idx").on(table.quoteId)],
);

export const workOrders = pgTable(
  "work_orders",
  {
    id: serial("id").primaryKey(),
    number: varchar("number", { length: 40 }).notNull(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    vehicleId: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    quoteId: integer("quote_id").references(() => quotes.id, { onDelete: "set null" }),
    siteId: integer("site_id").references(() => sites.id, { onDelete: "set null" }),
    assigneeId: integer("assignee_id").references(() => users.id, { onDelete: "set null" }),
    status: workOrderStatusEnum("status").notNull().default("recebida"),
    odometer: integer("odometer"),
    complaint: text("complaint"),
    diagnosis: text("diagnosis"),
    checklist: jsonb("checklist").$type<Record<string, boolean>>().notNull().default({}),
    warrantyUntil: timestamp("warranty_until", { withTimezone: true }),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("work_orders_number_unique").on(table.number),
    index("work_orders_customer_idx").on(table.customerId),
    index("work_orders_status_idx").on(table.status),
    index("work_orders_site_idx").on(table.siteId),
  ],
);

export const workOrderLines = pgTable(
  "work_order_lines",
  {
    id: serial("id").primaryKey(),
    workOrderId: integer("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "cascade" }),
    partId: integer("part_id").references(() => parts.id, { onDelete: "set null" }),
    serviceTemplateId: integer("service_template_id").references(() => serviceTemplates.id, {
      onDelete: "set null",
    }),
    description: varchar("description", { length: 240 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull().default(0),
    vatRateBps: integer("vat_rate_bps").notNull().default(2300),
    discountCents: integer("discount_cents").notNull().default(0),
    stockDeducted: boolean("stock_deducted").notNull().default(false),
  },
  (table) => [index("work_order_lines_wo_idx").on(table.workOrderId)],
);

export const workOrderPhotos = pgTable(
  "work_order_photos",
  {
    id: serial("id").primaryKey(),
    workOrderId: integer("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "cascade" }),
    filename: varchar("filename", { length: 200 }).notNull(),
    caption: varchar("caption", { length: 200 }),
    phase: varchar("phase", { length: 30 }).notNull().default("entrada"),
    inspectionItemId: integer("inspection_item_id").references(() => inspectionItems.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("work_order_photos_wo_idx").on(table.workOrderId)],
);

export const consents = pgTable(
  "consents",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    type: consentTypeEnum("type").notNull(),
    documentVersion: varchar("document_version", { length: 40 }).notNull().default("1.0"),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [index("consents_customer_idx").on(table.customerId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 80 }).notNull(),
    entity: varchar("entity", { length: 80 }).notNull(),
    entityId: varchar("entity_id", { length: 40 }),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_logs_created_idx").on(table.createdAt)],
);

// --- Fase 3: multi-loja, diagnóstico digital ---------------------------------

export const sites = pgTable(
  "sites",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    code: varchar("code", { length: 30 }).notNull(),
    address: text("address"),
    phone: varchar("phone", { length: 40 }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sites_code_unique").on(table.code)],
);

export const inspectionConditionEnum = pgEnum("inspection_condition", ["ok", "atencao", "falha"]);

export const inspections = pgTable(
  "inspections",
  {
    id: serial("id").primaryKey(),
    workOrderId: integer("work_order_id")
      .notNull()
      .references(() => workOrders.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 64 }).notNull(),
    status: varchar("status", { length: 30 }).notNull().default("rascunho"),
    sharedAt: timestamp("shared_at", { withTimezone: true }),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
    acknowledgementName: varchar("acknowledgement_name", { length: 160 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("inspections_token_unique").on(table.token)],
);

export const inspectionItems = pgTable(
  "inspection_items",
  {
    id: serial("id").primaryKey(),
    inspectionId: integer("inspection_id")
      .notNull()
      .references(() => inspections.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 160 }).notNull(),
    condition: inspectionConditionEnum("condition").notNull().default("ok"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("inspection_items_inspection_idx").on(table.inspectionId)],
);

// --- Fase 2: agenda, faturação, pagamentos ----------------------------------

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "confirmada",
  "concluida",
  "cancelada",
]);
export const appointmentSourceEnum = pgEnum("appointment_source", ["interna", "online"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "rascunho",
  "emitida",
  "paga",
  "anulada",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "dinheiro",
  "multibanco",
  "mbway",
  "cartao",
  "transferencia",
  "outro",
]);

export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    vehicleId: integer("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    workOrderId: integer("work_order_id").references(() => workOrders.id, { onDelete: "set null" }),
    siteId: integer("site_id").references(() => sites.id, { onDelete: "set null" }),
    technicianId: integer("technician_id").references(() => users.id, { onDelete: "set null" }),
    ramp: varchar("ramp", { length: 40 }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("confirmada"),
    source: appointmentSourceEnum("source").notNull().default("interna"),
    notes: text("notes"),
    contactName: varchar("contact_name", { length: 160 }),
    contactPhone: varchar("contact_phone", { length: 40 }),
    contactEmail: varchar("contact_email", { length: 180 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("appointments_starts_idx").on(table.startsAt),
    index("appointments_technician_idx").on(table.technicianId),
    index("appointments_ramp_idx").on(table.ramp),
  ],
);

export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    number: varchar("number", { length: 40 }).notNull(),
    workOrderId: integer("work_order_id").references(() => workOrders.id, { onDelete: "set null" }),
    quoteId: integer("quote_id").references(() => quotes.id, { onDelete: "set null" }),
    siteId: integer("site_id").references(() => sites.id, { onDelete: "set null" }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    customerName: varchar("customer_name", { length: 160 }).notNull(),
    customerNif: varchar("customer_nif", { length: 20 }),
    customerAddress: text("customer_address"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    status: invoiceStatusEnum("status").notNull().default("emitida"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    vatCents: integer("vat_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    paidCents: integer("paid_cents").notNull().default(0),
    atcud: varchar("atcud", { length: 80 }),
    documentHash: varchar("document_hash", { length: 200 }),
    certifiedNumber: varchar("certified_number", { length: 80 }),
    qrCodeUrl: text("qr_code_url"),
    notes: text("notes"),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("invoices_number_unique").on(table.number),
    index("invoices_customer_idx").on(table.customerId),
    index("invoices_status_idx").on(table.status),
  ],
);

export const invoiceLines = pgTable(
  "invoice_lines",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: varchar("description", { length: 240 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    unitPriceCents: integer("unit_price_cents").notNull().default(0),
    vatRateBps: integer("vat_rate_bps").notNull().default(2300),
    discountCents: integer("discount_cents").notNull().default(0),
  },
  (table) => [index("invoice_lines_invoice_idx").on(table.invoiceId)],
);

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    amountCents: integer("amount_cents").notNull(),
    method: paymentMethodEnum("method").notNull().default("multibanco"),
    reference: varchar("reference", { length: 100 }),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("payments_invoice_idx").on(table.invoiceId)],
);

export const accountsPayable = pgTable(
  "accounts_payable",
  {
    id: serial("id").primaryKey(),
    description: varchar("description", { length: 240 }).notNull(),
    supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    amountCents: integer("amount_cents").notNull(),
    category: varchar("category", { length: 80 }),
    reference: varchar("reference", { length: 100 }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("accounts_payable_due_idx").on(table.dueAt)],
);

// --- Integrações externas: pagamentos e assinatura ---------------------------

export const integrationStatusEnum = pgEnum("integration_status", [
  "pendente",
  "pago",
  "concluido",
  "falhado",
  "cancelado",
]);

export const paymentIntents = pgTable(
  "payment_intents",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "restrict" }),
    provider: varchar("provider", { length: 40 }).notNull(),
    externalId: varchar("external_id", { length: 160 }),
    amountCents: integer("amount_cents").notNull(),
    status: integrationStatusEnum("status").notNull().default("pendente"),
    checkoutUrl: text("checkout_url"),
    reference: varchar("reference", { length: 160 }),
    method: varchar("method", { length: 40 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("payment_intents_invoice_idx").on(table.invoiceId)],
);

export const signatureRequests = pgTable(
  "signature_requests",
  {
    id: serial("id").primaryKey(),
    entity: varchar("entity", { length: 40 }).notNull(),
    entityId: integer("entity_id").notNull(),
    provider: varchar("provider", { length: 40 }).notNull(),
    externalId: varchar("external_id", { length: 160 }),
    status: integrationStatusEnum("status").notNull().default("pendente"),
    signerName: varchar("signer_name", { length: 160 }),
    signerEmail: varchar("signer_email", { length: 180 }),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    certificateSerial: varchar("certificate_serial", { length: 200 }),
    signingUrl: text("signing_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("signature_requests_entity_idx").on(table.entity, table.entityId)],
);

// ---------------------------------------------------------------------------
// Relações
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  quotes: many(quotes),
  workOrders: many(workOrders),
  auditLogs: many(auditLogs),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  vehicles: many(vehicles),
  quotes: many(quotes),
  workOrders: many(workOrders),
  consents: many(consents),
  appointments: many(appointments),
  invoices: many(invoices),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  customer: one(customers, { fields: [vehicles.customerId], references: [customers.id] }),
  quotes: many(quotes),
  workOrders: many(workOrders),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  parts: many(parts),
}));

export const partsRelations = relations(parts, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [parts.supplierId], references: [suppliers.id] }),
  quoteLines: many(quoteLines),
  workOrderLines: many(workOrderLines),
}));

export const serviceTemplatesRelations = relations(serviceTemplates, ({ many }) => ({
  quoteLines: many(quoteLines),
  workOrderLines: many(workOrderLines),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  customer: one(customers, { fields: [quotes.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [quotes.vehicleId], references: [vehicles.id] }),
  creator: one(users, { fields: [quotes.createdBy], references: [users.id] }),
  lines: many(quoteLines),
  workOrders: many(workOrders),
}));

export const quoteLinesRelations = relations(quoteLines, ({ one }) => ({
  quote: one(quotes, { fields: [quoteLines.quoteId], references: [quotes.id] }),
  part: one(parts, { fields: [quoteLines.partId], references: [parts.id] }),
  service: one(serviceTemplates, {
    fields: [quoteLines.serviceTemplateId],
    references: [serviceTemplates.id],
  }),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  customer: one(customers, { fields: [workOrders.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [workOrders.vehicleId], references: [vehicles.id] }),
  quote: one(quotes, { fields: [workOrders.quoteId], references: [quotes.id] }),
  site: one(sites, { fields: [workOrders.siteId], references: [sites.id] }),
  assignee: one(users, { fields: [workOrders.assigneeId], references: [users.id] }),
  creator: one(users, { fields: [workOrders.createdBy], references: [users.id] }),
  lines: many(workOrderLines),
  photos: many(workOrderPhotos),
  appointments: many(appointments),
  invoices: many(invoices),
  inspections: many(inspections),
}));

export const workOrderLinesRelations = relations(workOrderLines, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderLines.workOrderId],
    references: [workOrders.id],
  }),
  part: one(parts, { fields: [workOrderLines.partId], references: [parts.id] }),
  service: one(serviceTemplates, {
    fields: [workOrderLines.serviceTemplateId],
    references: [serviceTemplates.id],
  }),
}));

export const workOrderPhotosRelations = relations(workOrderPhotos, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderPhotos.workOrderId],
    references: [workOrders.id],
  }),
  inspectionItem: one(inspectionItems, {
    fields: [workOrderPhotos.inspectionItemId],
    references: [inspectionItems.id],
  }),
}));

export const consentsRelations = relations(consents, ({ one }) => ({
  customer: one(customers, { fields: [consents.customerId], references: [customers.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  customer: one(customers, { fields: [appointments.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [appointments.vehicleId], references: [vehicles.id] }),
  workOrder: one(workOrders, { fields: [appointments.workOrderId], references: [workOrders.id] }),
  site: one(sites, { fields: [appointments.siteId], references: [sites.id] }),
  technician: one(users, { fields: [appointments.technicianId], references: [users.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  workOrder: one(workOrders, { fields: [invoices.workOrderId], references: [workOrders.id] }),
  quote: one(quotes, { fields: [invoices.quoteId], references: [quotes.id] }),
  site: one(sites, { fields: [invoices.siteId], references: [sites.id] }),
  creator: one(users, { fields: [invoices.createdBy], references: [users.id] }),
  lines: many(invoiceLines),
  payments: many(payments),
  paymentIntents: many(paymentIntents),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one }) => ({
  invoice: one(invoices, { fields: [invoiceLines.invoiceId], references: [invoices.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
  creator: one(users, { fields: [payments.createdBy], references: [users.id] }),
}));

export const accountsPayableRelations = relations(accountsPayable, ({ one }) => ({
  supplier: one(suppliers, { fields: [accountsPayable.supplierId], references: [suppliers.id] }),
}));

export const paymentIntentsRelations = relations(paymentIntents, ({ one }) => ({
  invoice: one(invoices, { fields: [paymentIntents.invoiceId], references: [invoices.id] }),
}));

export const sitesRelations = relations(sites, ({ many }) => ({
  workOrders: many(workOrders),
  appointments: many(appointments),
  invoices: many(invoices),
}));

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  workOrder: one(workOrders, { fields: [inspections.workOrderId], references: [workOrders.id] }),
  items: many(inspectionItems),
}));

export const inspectionItemsRelations = relations(inspectionItems, ({ one, many }) => ({
  inspection: one(inspections, { fields: [inspectionItems.inspectionId], references: [inspections.id] }),
  photos: many(workOrderPhotos),
}));

