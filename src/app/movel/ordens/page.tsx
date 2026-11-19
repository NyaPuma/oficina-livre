import { eq } from "drizzle-orm";
import { MobileOrdersClient } from "@/components/mobile/mobile-client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { workOrders } from "@/lib/db/schema";
import type { OfflineOrder } from "@/lib/offline/types";

export default async function MobileOrdersPage() {
  const user = await requireUser();
  const rows = await db.query.workOrders.findMany({
    where: user.role === "mecanico" ? eq(workOrders.assigneeId, user.id) : undefined,
    with: { customer: true, vehicle: true, photos: true },
    orderBy: (wo, { desc }) => [desc(wo.createdAt)],
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

  return <MobileOrdersClient initialOrders={orders} />;
}

export const instant = false;
