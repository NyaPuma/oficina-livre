"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type ActionState, errorState, firstZodIssue, successState } from "@/lib/action-state";
import { logAudit } from "@/lib/audit";
import { hashPassword, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { userSchema } from "@/lib/validation";

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const current = await requireRole("admin");
  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return errorState(firstZodIssue(parsed.error));
  if (!parsed.data.password) return errorState("Defina uma palavra-passe inicial.");

  try {
    const [user] = await db
      .insert(users)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: parsed.data.role,
      })
      .returning({ id: users.id });
    await logAudit(current.id, "criar", "utilizador", user.id, { email: parsed.data.email });
  } catch {
    return errorState("Já existe um utilizador com esse email.");
  }

  revalidatePath("/utilizadores");
  return successState("Utilizador criado.");
}

export async function updateUser(formData: FormData): Promise<void> {
  const current = await requireRole("admin");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id === current.id) return;

  const role = String(formData.get("role"));
  const active = formData.get("active") === "on";
  if (!["admin", "gestor", "mecanico"].includes(role)) return;

  await db.update(users).set({ role: role as "admin" | "gestor" | "mecanico", active, updatedAt: new Date() }).where(eq(users.id, id));
  await logAudit(current.id, "atualizar", "utilizador", id, { role, active });
  revalidatePath("/utilizadores");
}
