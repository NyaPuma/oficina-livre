"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type ActionState, errorState, firstZodIssue, successState } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  parts,
  serviceTemplates,
  workOrderLines,
  workOrderPhotos,
  workOrders,
} from "@/lib/db/schema";
import { parseMoneyToCents } from "@/lib/format";
import { nextDocumentNumber } from "@/lib/sequence";
import { lineSchema, workOrderSchema } from "@/lib/validation";

function parseLines(raw: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(String(raw ?? "[]"));
  } catch {
    return null;
  }
}

const ALLOWED_STATUSES = ["recebida", "diagnostico", "aguarda_peca", "em_reparacao", "pronta", "entregue", "cancelada"] as const;

export async function createWorkOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = workOrderSchema.safeParse({
    customerId: formData.get("customerId"),
    vehicleId: formData.get("vehicleId"),
    quoteId: formData.get("quoteId") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    odometer: formData.get("odometer") || undefined,
    complaint: formData.get("complaint"),
    diagnosis: formData.get("diagnosis"),
    lines: parseLines(formData.get("lines")),
  });
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const data = parsed.data;
  const number = await nextDocumentNumber("OR");
  const checklist: Record<string, boolean> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("check_") && value === "on") checklist[key.slice(6)] = true;
  }

  let workOrderId: number;
  try {
    workOrderId = await db.transaction(async (tx) => {
      const [workOrder] = await tx
        .insert(workOrders)
        .values({
          number,
          customerId: data.customerId,
          vehicleId: data.vehicleId,
          quoteId: data.quoteId,
          assigneeId: data.assigneeId,
          odometer: data.odometer,
          complaint: data.complaint,
          diagnosis: data.diagnosis,
          checklist,
          createdBy: user.id,
        })
        .returning({ id: workOrders.id });

      for (const line of data.lines) {
        let partId: number | null = null;
        let serviceTemplateId: number | null = null;
        let stockDeducted = false;

        if (line.kind === "part" && line.itemId) {
          const id = Number(line.itemId);
          const [part] = await tx.select().from(parts).where(eq(parts.id, id)).limit(1);
          if (part) {
            partId = part.id;
            if (part.stockQty < line.quantity) {
              throw new Error(`Stock insuficiente para ${part.description}. Disponível: ${part.stockQty}.`);
            }
            await tx
              .update(parts)
              .set({ stockQty: sql`${parts.stockQty} - ${line.quantity}`, updatedAt: new Date() })
              .where(eq(parts.id, part.id));
            stockDeducted = true;
          }
        } else if (line.kind === "service" && line.itemId) {
          const id = Number(line.itemId);
          const [service] = await tx.select({ id: serviceTemplates.id }).from(serviceTemplates).where(eq(serviceTemplates.id, id)).limit(1);
          if (service) serviceTemplateId = service.id;
        }

        await tx.insert(workOrderLines).values({
          workOrderId: workOrder.id,
          partId,
          serviceTemplateId,
          description: line.description,
          quantity: line.quantity,
          unitPriceCents: parseMoneyToCents(line.unitPrice),
          vatRateBps: line.vatRate * 100,
          discountCents: parseMoneyToCents(line.discount),
          stockDeducted,
        });
      }
      return workOrder.id;
    });
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Não foi possível criar a ordem de serviço.");
  }

  await logAudit(user.id, "criar", "ordem_servico", workOrderId, { number });
  revalidatePath("/ordens");
  revalidatePath("/stock");
  redirect(`/ordens/${workOrderId}`);
}

export async function addWorkOrderLine(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const workOrderId = Number(formData.get("id"));
  if (!Number.isInteger(workOrderId)) return errorState("Ordem inválida.");

  const parsed = lineSchema.array().min(1).safeParse(parseLines(formData.get("lines")));
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  try {
    await db.transaction(async (tx) => {
      for (const line of parsed.data) {
        let partId: number | null = null;
        let serviceTemplateId: number | null = null;
        let stockDeducted = false;

        if (line.kind === "part" && line.itemId) {
          const [part] = await tx.select().from(parts).where(eq(parts.id, Number(line.itemId))).limit(1);
          if (part) {
            if (part.stockQty < line.quantity) throw new Error(`Stock insuficiente para ${part.description}.`);
            partId = part.id;
            await tx.update(parts).set({ stockQty: sql`${parts.stockQty} - ${line.quantity}`, updatedAt: new Date() }).where(eq(parts.id, part.id));
            stockDeducted = true;
          }
        } else if (line.kind === "service" && line.itemId) {
          const [service] = await tx.select({ id: serviceTemplates.id }).from(serviceTemplates).where(eq(serviceTemplates.id, Number(line.itemId))).limit(1);
          if (service) serviceTemplateId = service.id;
        }

        await tx.insert(workOrderLines).values({
          workOrderId,
          partId,
          serviceTemplateId,
          description: line.description,
          quantity: line.quantity,
          unitPriceCents: parseMoneyToCents(line.unitPrice),
          vatRateBps: line.vatRate * 100,
          discountCents: parseMoneyToCents(line.discount),
          stockDeducted,
        });
      }
    });
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Não foi possível adicionar a linha.");
  }

  await logAudit(user.id, "adicionar_linha", "ordem_servico", workOrderId);
  revalidatePath(`/ordens/${workOrderId}`);
  revalidatePath("/stock");
  return successState("Linha adicionada.");
}

export async function updateWorkOrder(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await db
    .update(workOrders)
    .set({
      diagnosis: String(formData.get("diagnosis") ?? "") || null,
      odometer: Number(formData.get("odometer")) || null,
      assigneeId: Number(formData.get("assigneeId")) || null,
      updatedAt: new Date(),
    })
    .where(eq(workOrders.id, id));
  await logAudit(user.id, "atualizar", "ordem_servico", id);
  revalidatePath(`/ordens/${id}`);
}

export async function setWorkOrderStatus(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as (typeof ALLOWED_STATUSES)[number];
  if (!Number.isInteger(id) || !ALLOWED_STATUSES.includes(status)) return;

  await db
    .update(workOrders)
    .set({
      status,
      completedAt: status === "entregue" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(workOrders.id, id));
  await logAudit(user.id, `estado_${status}`, "ordem_servico", id);
  revalidatePath(`/ordens/${id}`);
  revalidatePath("/ordens");
}

export async function deleteWorkOrderLine(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const lineId = Number(formData.get("lineId"));
  if (!Number.isInteger(id) || !Number.isInteger(lineId)) return;

  const [line] = await db.select().from(workOrderLines).where(eq(workOrderLines.id, lineId)).limit(1);
  if (line && line.workOrderId === id) {
    await db.transaction(async (tx) => {
      if (line.stockDeducted && line.partId) {
        await tx
          .update(parts)
          .set({ stockQty: sql`${parts.stockQty} + ${line.quantity}`, updatedAt: new Date() })
          .where(eq(parts.id, line.partId));
      }
      await tx.delete(workOrderLines).where(eq(workOrderLines.id, lineId));
    });
  }
  await logAudit(user.id, "remover_linha", "ordem_servico", id, { lineId });
  revalidatePath(`/ordens/${id}`);
  revalidatePath("/stock");
}

export async function addWorkOrderPhoto(formData: FormData): Promise<void> {
  const user = await requireUser();
  const workOrderId = Number(formData.get("workOrderId"));
  const file = formData.get("photo");
  const caption = String(formData.get("caption") ?? "") || null;
  const phase = String(formData.get("phase") ?? "entrada");

  if (!Number.isInteger(workOrderId) || !(file instanceof File) || file.size === 0) return;
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;

  const uploadDir = path.join(process.cwd(), "data", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  await db.insert(workOrderPhotos).values({ workOrderId, filename, caption, phase });
  await logAudit(user.id, "adicionar_foto", "ordem_servico", workOrderId, { filename });
  revalidatePath(`/ordens/${workOrderId}`);
}
