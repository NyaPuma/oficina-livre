"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionState, errorState, firstZodIssue, successState } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { inspectionItems, inspections, workOrderPhotos } from "@/lib/db/schema";
import { sendMail } from "@/lib/mail";
import { clientKey, checkRateLimit } from "@/lib/rate-limit";

const itemSchema = z.object({
  label: z.string().trim().min(1).max(160),
  condition: z.enum(["ok", "atencao", "falha"]),
  notes: z.string().trim().max(2000).optional(),
});

export async function createInspection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const workOrderId = Number(formData.get("workOrderId"));
  if (!Number.isInteger(workOrderId)) return errorState("Ordem inválida.");

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return errorState("Itens de inspeção inválidos.");
  }
  const parsed = z.array(itemSchema).min(1, "Adicione pelo menos um item").safeParse(raw);
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  const token = randomBytes(24).toString("hex");
  const inspectionId = await db.transaction(async (tx) => {
    const [inspection] = await tx
      .insert(inspections)
      .values({
        workOrderId,
        token,
        status: "rascunho",
        notes: String(formData.get("notes") ?? "") || null,
      })
      .returning({ id: inspections.id });

    for (const item of parsed.data) {
      await tx.insert(inspectionItems).values({
        inspectionId: inspection.id,
        label: item.label,
        condition: item.condition,
        notes: item.notes || null,
      });
    }
    return inspection.id;
  });

  await logAudit(user.id, "criar", "diagnostico", inspectionId, { workOrderId });
  revalidatePath(`/ordens/${workOrderId}/diagnostico`);
  redirect(`/ordens/${workOrderId}/diagnostico`);
}

export async function shareInspection(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id)).limit(1);
  if (!inspection) return;

  await db
    .update(inspections)
    .set({ status: "partilhado", sharedAt: new Date() })
    .where(eq(inspections.id, id));

  await logAudit(user.id, "partilhar", "diagnostico", id);

  const detail = await db.query.workOrders.findFirst({
    where: (wo, { eq }) => eq(wo.id, inspection.workOrderId),
    with: { customer: true },
  });
  if (detail?.customer.email) {
    const link = `${process.env.APP_URL ?? "http://localhost:3000"}/diagnostico/${inspection.token}`;
    await sendMail(
      detail.customer.email,
      `Diagnóstico digital da viatura — Ordem ${detail.number}`,
      `Consulte o relatório de diagnóstico da sua viatura: ${link}`,
    ).catch(() => false);
  }

  revalidatePath(`/ordens/${inspection.workOrderId}/diagnostico`);
}

/** Foto associada a um item específico do diagnóstico digital. */
export async function addInspectionPhoto(formData: FormData): Promise<void> {
  const user = await requireUser();
  const inspectionItemId = Number(formData.get("inspectionItemId"));
  const file = formData.get("photo");
  if (!Number.isInteger(inspectionItemId) || !(file instanceof File) || file.size === 0) return;
  if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;

  const [item] = await db.select().from(inspectionItems).where(eq(inspectionItems.id, inspectionItemId)).limit(1);
  if (!item) return;
  const [inspection] = await db.select().from(inspections).where(eq(inspections.id, item.inspectionId)).limit(1);
  if (!inspection) return;

  const uploadDir = path.join(process.cwd(), "data", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

  await db.insert(workOrderPhotos).values({
    workOrderId: inspection.workOrderId,
    inspectionItemId: item.id,
    filename,
    caption: item.label,
    phase: "diagnostico",
  });
  await logAudit(user.id, "adicionar_foto_diagnostico", "diagnostico", inspection.id, { filename });
  revalidatePath(`/ordens/${inspection.workOrderId}/diagnostico`);
}

export async function acknowledgeInspectionPublic(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const requestHeaders = await headers();
  if (!(await checkRateLimit(clientKey("diagnostico", requestHeaders), 12, 60 * 60_000))) {
    return errorState("Demasiadas tentativas. Tente mais tarde.");
  }

  const token = String(formData.get("token") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (token.length < 10 || name.length < 2) return errorState("Token ou nome inválido.");

  const [inspection] = await db.select().from(inspections).where(eq(inspections.token, token)).limit(1);
  if (!inspection) return errorState("Relatório não encontrado.");

  await db
    .update(inspections)
    .set({
      status: "confirmado",
      acknowledgedAt: new Date(),
      acknowledgementName: name,
    })
    .where(eq(inspections.id, inspection.id));

  await logAudit(null, "confirmar_diagnostico", "diagnostico", inspection.id, { name });
  revalidatePath(`/diagnostico/${token}`);
  return successState("Obrigado! A oficina foi notificada da sua confirmação.");
}
