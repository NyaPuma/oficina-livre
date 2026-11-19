import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || null);

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
  year: z.coerce.number().int().min(1900).max(2100).optional(),
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
  supplierId: z.coerce.number().int().positive().optional(),
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
  quoteId: z.coerce.number().int().positive().optional(),
  assigneeId: z.coerce.number().int().positive().optional(),
  odometer: z.coerce.number().int().min(0).optional(),
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

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type PartInput = z.infer<typeof partSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type WorkOrderInput = z.infer<typeof workOrderSchema>;
export type LineInput = z.infer<typeof lineSchema>;
