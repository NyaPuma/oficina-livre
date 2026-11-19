"use server";

import { eq } from "drizzle-orm";
import { type ActionState, errorState, successState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import { getComplaints, getRecalls, type SafetyNotice } from "@/lib/external/recalls";
import {
  getObdCode,
  searchRepairKnowledge,
  type ObdCodeInfo,
  type RepairArticle,
} from "@/lib/knowledge/repairs";

export type KnowledgeState = ActionState & { articles?: RepairArticle[]; obd?: ObdCodeInfo | null };
export type SafetyState = ActionState & {
  recalls?: SafetyNotice[];
  complaints?: SafetyNotice[];
  vehicle?: string;
};

export async function searchKnowledgeAction(_prev: KnowledgeState, formData: FormData): Promise<KnowledgeState> {
  await requireUser();
  const query = String(formData.get("query") ?? "").trim();
  if (query.length < 3) return errorState("Escreva um sintoma, sistema ou código OBD (ex.: P0300).");

  const codeMatch = query.match(/\b[PBCU][0-9]{4}\b/i);
  const obd = codeMatch ? getObdCode(codeMatch[0]) : null;
  const articles = searchRepairKnowledge(obd ? `${query} ${obd.title}` : query);

  return {
    ...successState(`${articles.length} artigo(s) encontrado(s).`),
    articles,
    obd,
  };
}

export async function checkVehicleSafetyAction(_prev: SafetyState, formData: FormData): Promise<SafetyState> {
  await requireUser();
  const vehicleId = Number(formData.get("vehicleId"));
  if (!Number.isInteger(vehicleId)) return errorState("Viatura inválida.");

  const vehicle = await db.query.vehicles.findFirst({
    where: eq(vehicles.id, vehicleId),
  });
  if (!vehicle) return errorState("Viatura não encontrada.");
  if (!vehicle.brand || !vehicle.model || !vehicle.year) {
    return errorState("A viatura não tem marca, modelo e ano completos para consultar a NHTSA.");
  }

  const [recalls, complaints] = await Promise.all([
    getRecalls(vehicle.brand, vehicle.model, vehicle.year),
    getComplaints(vehicle.brand, vehicle.model, vehicle.year),
  ]);

  return {
    ...successState("Consulta concluída junto da NHTSA (dados dos EUA)."),
    recalls,
    complaints,
    vehicle: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
  };
}
