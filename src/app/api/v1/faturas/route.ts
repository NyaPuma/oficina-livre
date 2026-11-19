import { apiUnauthorized, isValidApiKey } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  if (!process.env.API_KEY) return apiUnauthorized();
  if (!isValidApiKey(request)) return apiUnauthorized();

  const rows = await db.query.invoices.findMany({
    with: { lines: true, payments: true, site: { columns: { name: true } } },
    orderBy: (i, { desc }) => [desc(i.issuedAt)],
    limit: 500,
  });
  return Response.json({ data: rows, total: rows.length });
}
