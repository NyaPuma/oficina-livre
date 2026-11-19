import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { workOrders } from "@/lib/db/schema";
import type { OfflineOrder } from "@/lib/offline/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const rows = await db.query.workOrders.findMany({
    where: user.role === "mecanico" ? eq(workOrders.assigneeId, user.id) : undefined,
    with: { customer: true, vehicle: true, photos: true },
    orderBy: (wo, { desc: descFn }) => [descFn(wo.createdAt)],
    limit: 100,
  });

  const orders: OfflineOrder[] = rows.map((order) => ({
    id: order.id,
    number: order.number,
    status: order.status,
    odometer: order.odometer,
    diagnosis: order.diagnosis,
    complaint: order.complaint,
    customerName: order.customer.name,
    plate: order.vehicle.plate,
    createdAt: order.createdAt.toISOString(),
    photoCount: order.photos.length,
  }));

  return Response.json({ orders });
}
