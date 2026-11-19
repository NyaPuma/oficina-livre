"use server";

import { type ActionState, errorState, successState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { lookupVehicle, type VehicleLookupResult } from "@/lib/vehicle-lookup";
import { z } from "zod";

export type LookupState = ActionState & { data?: VehicleLookupResult };

const schema = z.object({ plate: z.string().trim().min(4).max(20) });

export async function lookupPlateAction(_prev: LookupState, formData: FormData): Promise<LookupState> {
  await requireUser();
  const parsed = schema.safeParse({ plate: formData.get("plate") });
  if (!parsed.success) return errorState("Matrícula inválida.");

  const data = await lookupVehicle(parsed.data.plate);
  return { ...successState(data.message ?? "Consulta concluída."), data };
}
