import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { MobileOrderClient } from "@/components/mobile/mobile-client";
import { db } from "@/lib/db";
import { workOrders } from "@/lib/db/schema";
import type { OfflineOrder } from "@/lib/offline/types";

export default async function MobileOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const order = await db.query.workOrders.findFirst({
    where: eq(workOrders.id, id),
    with: { customer: true, vehicle: true, photos: true },
  });
  if (!order) notFound();

  const offlineOrder: OfflineOrder = {
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
  };

  return <MobileOrderClient order={offlineOrder} />;
}

export const instant = false;
