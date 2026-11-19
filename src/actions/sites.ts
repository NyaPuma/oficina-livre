"use server";

import { revalidatePath } from "next/cache";
import { type ActionState, errorState, firstZodIssue, successState } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  code: z.string().trim().min(2).max(30).toUpperCase(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(40).optional(),
});

export async function createSite(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));

  try {
    const [site] = await db.insert(sites).values(parsed.data).returning({ id: sites.id });
    await logAudit(user.id, "criar", "local", site.id, { name: parsed.data.name });
  } catch {
    return errorState("Já existe um local com esse código.");
  }

  revalidatePath("/locais");
  return successState("Local adicionado.");
}
