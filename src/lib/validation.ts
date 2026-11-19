import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || null);

/** Trata selects/inputs opcionais vazios como "não preenchido" em vez de 0. */
const optionalPositiveInt = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().int().positive().optional(),
);

const optionalNonNegativeInt = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().int().min(0).optional(),
);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "Palavra-passe obrigatória"),
});

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(160),
  nif: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "NIF deve ter 9 dígitos")
    .optional()
    .or(z.literal("")),
  phone: optionalText(40),
  email: z.union([z.string().trim().email("Email inválido"), z.literal("")]).optional(),
  address: optionalText(500),
  postalCode: optionalText(20),
  city: optionalText(100),
  notes: optionalText(2000),
  consent: z.string().optional(),
});

export const vehicleSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  plate: z.string().trim().min(4, "Matrícula obrigatória").max(20).toUpperCase(),
  vin: optionalText(30),
  brand: optionalText(80),
  model: optionalText(100),
  year: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().int().min(1900).max(2100).optional(),
  ),
  fuel: optionalText(40),
  mileage: z.coerce.number().int().min(0).default(0),
  notes: optionalText(2000),
});

export const partSchema = z.object({
  code: z.string().trim().min(1, "Código obrigatório").max(60).toUpperCase(),
  description: z.string().trim().min(2, "Descrição obrigatória").max(200),
  costPrice: z.string().trim().default("0"),
  salePrice: z.string().trim().default("0"),
  vatRate: z.coerce.number().int().min(0).max(100).default(23),
  stockQty: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(0),
  supplierId: optionalPositiveInt,
});

export const serviceTemplateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: optionalText(2000),
  standardHours: z.coerce.number().int().min(0).default(1),
  salePrice: z.string().trim().default("0"),
  vatRate: z.coerce.number().int().min(0).max(100).default(13),
});

export const lineSchema = z.object({
  kind: z.enum(["part", "service", "manual"]),
  itemId: z.string().optional(),
  description: z.string().trim().min(1, "Descrição obrigatória").max(240),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPrice: z.string().trim().default("0"),
  vatRate: z.coerce.number().int().min(0).max(100).default(23),
  discount: z.string().trim().default("0"),
});

export const quoteSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  vehicleId: z.coerce.number().int().positive(),
  validUntil: z.string().optional(),
  notes: optionalText(2000),
  lines: z.array(lineSchema).min(1, "Adicione pelo menos uma linha"),
});

export const workOrderSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  vehicleId: z.coerce.number().int().positive(),
  siteId: optionalPositiveInt,
  quoteId: optionalPositiveInt,
  assigneeId: optionalPositiveInt,
  odometer: optionalNonNegativeInt,
  complaint: optionalText(4000),
  diagnosis: optionalText(4000),
  lines: z.array(lineSchema).default([]),
});

export const userSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Mínimo 8 caracteres").optional().or(z.literal("")),
  role: z.enum(["admin", "gestor", "mecanico"]),
  active: z.string().optional(),
});

export const appointmentSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  vehicleId: z.coerce.number().int().positive(),
  siteId: optionalPositiveInt,
  technicianId: optionalPositiveInt,
  workOrderId: optionalPositiveInt,
  ramp: optionalText(40),
  startsAt: z.string().min(1, "Data e hora obrigatórias"),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(60),
  notes: optionalText(2000),
});

export const onlineBookingSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(160),
  phone: z.string().trim().min(9, "Telemóvel obrigatório").max(40),
  email: z.union([z.string().trim().email("Email inválido"), z.literal("")]).optional(),
  plate: z.string().trim().min(4, "Matrícula obrigatória").max(20).toUpperCase(),
  description: z.string().trim().min(3, "Descreva o serviço pretendido").max(2000),
  date: z.string().min(1, "Data obrigatória"),
  time: z.string().min(1, "Hora obrigatória"),
});

export const paymentSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  amount: z.string().trim().min(1, "Valor obrigatório"),
  method: z.enum(["dinheiro", "multibanco", "mbway", "cartao", "transferencia", "outro"]),
  reference: optionalText(100),
  paidAt: z.string().optional(),
});

export const payableSchema = z.object({
  description: z.string().trim().min(2).max(240),
  amount: z.string().trim().min(1, "Valor obrigatório"),
  category: optionalText(80),
  reference: optionalText(100),
  dueAt: z.string().optional(),
  supplierId: optionalPositiveInt,
});

export const approvalSchema = z.object({
  token: z.string().min(10),
  name: z.string().trim().min(2, "Escreva o seu nome completo").max(160),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type PartInput = z.infer<typeof partSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type WorkOrderInput = z.infer<typeof workOrderSchema>;
export type LineInput = z.infer<typeof lineSchema>;
