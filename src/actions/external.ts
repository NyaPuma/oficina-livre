"use server";

import { type ActionState, errorState, successState } from "@/lib/action-state";
import { requireUser } from "@/lib/auth";
import { geocodeAddress, type GeocodeResult } from "@/lib/external/geocode";
import { getPortugueseHolidays } from "@/lib/external/holidays";
import { validateVatNumber, type ViesResult } from "@/lib/external/nif";
import { decodeVin, type VinDecodeResult } from "@/lib/external/vin";

export type NifState = ActionState & { result?: ViesResult };
export type VinState = ActionState & { result?: VinDecodeResult };
export type GeocodeState = ActionState & { result?: GeocodeResult };

export async function validateNifAction(_prev: NifState, formData: FormData): Promise<NifState> {
  await requireUser();
  const nif = String(formData.get("nif") ?? "").trim();
  if (!/^\d{9}$/.test(nif)) return errorState("Introduza um NIF com 9 dígitos.");
  const result = await validateVatNumber(nif);
  return {
    ...(result.valid ? successState(result.message ?? "NIF válido.") : errorState(result.message ?? "NIF inválido.")),
    result,
  };
}

export async function decodeVinAction(_prev: VinState, formData: FormData): Promise<VinState> {
  await requireUser();
  const vin = String(formData.get("vin") ?? "").trim();
  if (vin.length < 6) return errorState("Introduza um VIN válido.");
  const result = await decodeVin(vin);
  return { ...successState(result.message ?? "VIN decodificado."), result };
}

export async function geocodeAction(_prev: GeocodeState, formData: FormData): Promise<GeocodeState> {
  await requireUser();
  const query = String(formData.get("query") ?? "").trim();
  if (query.length < 4) return errorState("Escreva uma morada ou localidade.");
  const result = await geocodeAddress(query);
  return { ...successState(result.message ?? "Morada processada."), result };
}

export async function getHolidaysAction(): Promise<Array<{ date: string; name: string }>> {
  await requireUser();
  return getPortugueseHolidays();
}
