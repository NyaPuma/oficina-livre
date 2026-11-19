import { apiUnauthorized, isValidApiKey } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  if (!process.env.API_KEY) return apiUnauthorized();
  if (!isValidApiKey(request)) return apiUnauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);

  const rows = await db.query.workOrders.findMany({
    with: {
      customer: { columns: { id: true, name: true } },
      vehicle: { columns: { plate: true } },
      lines: true,
      site: { columns: { name: true } },
    },
    orderBy: (wo, { desc }) => [desc(wo.createdAt)],
    limit: Number.isFinite(limit) ? limit : 100,
  });
  const filtered = status ? rows.filter((o) => o.status === status) : rows;

  return Response.json({ data: filtered, total: filtered.length });
}
