import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { workOrderPhotos, workOrders } from "@/lib/db/schema";

const statusValues = ["recebida", "diagnostico", "aguarda_peca", "em_reparacao", "pronta", "entregue", "cancelada"] as const;

const opSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("status"), workOrderId: z.number().int().positive(), status: z.enum(statusValues) }),
  z.object({
    type: z.literal("diagnosis"),
    workOrderId: z.number().int().positive(),
    diagnosis: z.string().max(4000),
    odometer: z.number().int().min(0).nullable(),
  }),
  z.object({
    type: z.literal("photo"),
    workOrderId: z.number().int().positive(),
    dataUrl: z.string().startsWith("data:image/").max(8 * 1024 * 1024),
    caption: z.string().max(200).nullable(),
    phase: z.enum(["entrada", "diagnostico", "final"]),
  }),
]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = z.array(opSchema).max(100).safeParse(body);
  if (!parsed.success) return Response.json({ error: "Operações inválidas" }, { status: 400 });

  const results: Array<{ type: string; ok: boolean; error?: string }> = [];

  for (const op of parsed.data) {
    const [order] = await db.select({ id: workOrders.id }).from(workOrders).where(eq(workOrders.id, op.workOrderId)).limit(1);
    if (!order) {
      results.push({ type: op.type, ok: false, error: "Ordem não encontrada" });
      continue;
    }

    try {
      if (op.type === "status") {
        await db
          .update(workOrders)
          .set({ status: op.status, completedAt: op.status === "entregue" ? new Date() : null, updatedAt: new Date() })
          .where(eq(workOrders.id, op.workOrderId));
      } else if (op.type === "diagnosis") {
        await db
          .update(workOrders)
          .set({ diagnosis: op.diagnosis || null, odometer: op.odometer, updatedAt: new Date() })
          .where(eq(workOrders.id, op.workOrderId));
      } else {
        const match = op.dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (!match) throw new Error("Imagem inválida");
        const extension = match[1].split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
        const buffer = Buffer.from(match[2], "base64");
        if (buffer.length > 5 * 1024 * 1024) throw new Error("Imagem demasiado grande");

        const uploadDir = path.join(process.cwd(), "data", "uploads");
        await mkdir(uploadDir, { recursive: true });
        const filename = `${randomUUID()}.${extension}`;
        await writeFile(path.join(uploadDir, filename), buffer);
        await db.insert(workOrderPhotos).values({
          workOrderId: op.workOrderId,
          filename,
          caption: op.caption,
          phase: op.phase,
        });
      }
      await logAudit(user.id, `mobile_${op.type}`, "ordem_servico", op.workOrderId);
      results.push({ type: op.type, ok: true });
    } catch (error) {
      results.push({ type: op.type, ok: false, error: error instanceof Error ? error.message : "Erro desconhecido" });
    }
  }

  return Response.json({ results });
}
