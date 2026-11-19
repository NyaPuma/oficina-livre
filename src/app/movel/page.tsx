import { MobileHomeClient } from "@/components/mobile/mobile-client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { workOrders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { getCurrentWeather } from "@/lib/external/weather";
import type { OfflineOrder } from "@/lib/offline/types";

export default async function MobileHomePage() {
  await connection();
  const user = await requireUser();
  const [rows, weather] = await Promise.all([
    db.query.workOrders.findMany({
      where: user.role === "mecanico" ? eq(workOrders.assigneeId, user.id) : undefined,
      with: { customer: true, vehicle: true, photos: true },
      orderBy: (wo, { desc }) => [desc(wo.createdAt)],
      limit: 100,
    }),
    getCurrentWeather(),
  ]);

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

  return (
    <>
      {weather ? (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-800">
          <span className="font-medium">Tempo na oficina</span>
          <span>{weather.temperature.toFixed(0)} °C · precipitação {weather.precipitation} mm</span>
          <span className="text-[0.62rem] text-sky-600">Open-Meteo.com</span>
        </div>
      ) : null}
      <MobileHomeClient initialOrders={orders} />
    </>
  );
}

export const instant = false;
