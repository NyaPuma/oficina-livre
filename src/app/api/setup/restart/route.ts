import { requireRole } from "@/lib/auth";

/** Reinicia o processo para aplicar novas variáveis de ambiente (auto-hospedagem). */
export async function POST() {
  await requireRole("admin");
  setTimeout(() => process.exit(0), 300);
  return Response.json({ restarting: true });
}
