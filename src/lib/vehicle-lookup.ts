import { tecdocLookupVehicle } from "./tecdoc";

/**
 * Consulta de matrículas/VIN com fornecedor opcional.
 * Sem configuração externa, valida apenas o formato da matrícula portuguesa
 * e devolve os dados que a oficina introduzir — sem custos nem API paga.
 */

export type VehicleLookupResult = {
  plate: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  source: "local" | "externo";
  message?: string;
};

const PLATE_PATTERNS = [
  /^\d{2}-\d{2}-[A-Z]{2}$/, // 00-00-AA
  /^[A-Z]{2}-\d{2}-\d{2}$/, // AA-00-00
  /^\d{4}[A-Z]{2}$/, // 0000AA
  /^[A-Z]{2}\d{4}$/, // AA0000
];

export function isValidPtPlate(value: string): boolean {
  const plate = value.trim().toUpperCase().replace(/\s/g, "");
  return PLATE_PATTERNS.some((pattern) => pattern.test(plate));
}

export async function lookupVehicle(plateInput: string): Promise<VehicleLookupResult> {
  const plate = plateInput.trim().toUpperCase().replace(/\s/g, "");
  if (!isValidPtPlate(plate)) {
    return { plate, source: "local", message: "Formato de matrícula português inválido." };
  }

  // 1) TecDoc quando configurado (identificação de veículo licenciada).
  if (process.env.TECDOC_API_URL) {
    const result = await tecdocLookupVehicle(plate);
    const vehicle = result.data[0];
    if (vehicle) {
      return {
        plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        source: "externo",
        message: result.message ?? "Dados obtidos do TecDoc.",
      };
    }
    return { plate, source: "local", message: result.message ?? "Sem dados no TecDoc." };
  }

  // 2) Fornecedor genérico configurável.
  const url = process.env.VEHICLE_LOOKUP_URL;
  if (!url) {
    return { plate, source: "local", message: "Formato válido. Preencha marca/modelo manualmente ou configure VEHICLE_LOOKUP_URL." };
  }

  try {
    const response = await fetch(`${url}${encodeURIComponent(plate)}`, {
      headers: process.env.VEHICLE_LOOKUP_TOKEN
        ? { Authorization: `Bearer ${process.env.VEHICLE_LOOKUP_TOKEN}` }
        : undefined,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as Record<string, unknown>;
    return {
      plate,
      brand: String(data.brand ?? data.marca ?? "") || null,
      model: String(data.model ?? data.modelo ?? "") || null,
      year: Number(data.year ?? data.ano ?? 0) || null,
      source: "externo",
      message: "Dados obtidos do fornecedor configurado.",
    };
  } catch {
    return { plate, source: "local", message: "Fornecedor externo indisponível. Preencha manualmente." };
  }
}
