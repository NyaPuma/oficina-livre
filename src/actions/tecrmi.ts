"use server";

import { eq } from "drizzle-orm";
import { type ActionState, errorState, successState } from "@/lib/action-state";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import {
  getRepairTime,
  getServiceSchedule,
  getVehicleTechData,
  type RepairTime,
  type ServiceItem,
  type TecRmiVehicle,
  type VehicleTechData,
} from "@/lib/tecrmi";

export type TecRmiState<T> = ActionState & { data?: T; source?: "tecrmi" | "local" };

async function vehicleFor(id: number): Promise<TecRmiVehicle | null> {
  const vehicle = await db.query.vehicles.findFirst({ where: eq(vehicles.id, id) });
  if (!vehicle) return null;
  return {
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    engine: vehicle.fuel,
  };
}

export async function lookupRepairTimeAction(
  _prev: TecRmiState<RepairTime | null>,
  formData: FormData,
): Promise<TecRmiState<RepairTime | null>> {
  await requireRole("admin", "gestor");
  const vehicleId = Number(formData.get("vehicleId"));
  const operation = String(formData.get("operation") ?? "").trim();
  if (!Number.isInteger(vehicleId) || operation.length < 2) return errorState("Viatura e operação obrigatórias.");

  const vehicle = await vehicleFor(vehicleId);
  if (!vehicle) return errorState("Viatura não encontrada.");

  const result = await getRepairTime(vehicle, operation);
  return {
    ...successState(result.message ?? "Consulta concluída."),
    data: result.data,
    source: result.source,
  };
}

export async function getTechDataAction(
  _prev: TecRmiState<VehicleTechData>,
  formData: FormData,
): Promise<TecRmiState<VehicleTechData>> {
  await requireRole("admin", "gestor");
  const vehicleId = Number(formData.get("vehicleId"));
  if (!Number.isInteger(vehicleId)) return errorState("Viatura inválida.");

  const vehicle = await vehicleFor(vehicleId);
  if (!vehicle) return errorState("Viatura não encontrada.");

  const result = await getVehicleTechData(vehicle);
  return {
    ...successState(result.message ?? "Consulta concluída."),
    data: result.data,
    source: result.source,
  };
}

export async function getServiceScheduleAction(
  _prev: TecRmiState<ServiceItem[]>,
  formData: FormData,
): Promise<TecRmiState<ServiceItem[]>> {
  await requireRole("admin", "gestor");
  const vehicleId = Number(formData.get("vehicleId"));
  const mileage = Number(formData.get("mileage") ?? 0);
  if (!Number.isInteger(vehicleId)) return errorState("Viatura inválida.");

  const vehicle = await vehicleFor(vehicleId);
  if (!vehicle) return errorState("Viatura não encontrada.");

  const result = await getServiceSchedule(vehicle, Number.isFinite(mileage) ? mileage : null);
  return {
    ...successState(result.message ?? "Consulta concluída."),
    data: result.data,
    source: result.source,
  };
}
