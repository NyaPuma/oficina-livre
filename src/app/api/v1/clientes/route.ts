import { apiUnauthorized, isValidApiKey } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  // A API pública usa chave própria; a sessão não é necessária.
  if (!process.env.API_KEY) return apiUnauthorized();
  if (!isValidApiKey(request)) return apiUnauthorized();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);

  const rows = await db.query.customers.findMany({
    with: { vehicles: { columns: { plate: true, brand: true, model: true } } },
    orderBy: (customers, { asc }) => [asc(customers.id)],
    limit: Number.isFinite(limit) ? limit : 100,
  });
  const filtered = q ? rows.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())) : rows;

  return Response.json({ data: filtered, total: filtered.length });
}
