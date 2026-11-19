import { requireRole } from "@/lib/auth";
import { getSetupStatus, saveEnvValues } from "@/lib/setup";

export async function GET() {
  await requireRole("admin");
  return Response.json({ status: await getSetupStatus() });
}

export async function POST(request: Request) {
  await requireRole("admin");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") updates[key] = value;
  }
  const saved = await saveEnvValues(updates);
  return Response.json({ saved, status: await getSetupStatus() });
}
