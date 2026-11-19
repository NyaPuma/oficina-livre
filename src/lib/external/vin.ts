import "server-only";

export type VinDecodeResult = {
  vin: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  source: "nhtsa" | "local";
  message?: string;
};

/** Ano pela 10.ª posição do VIN (código SAE). */
function yearFromVin(vin: string): number | null {
  const char = vin[9]?.toUpperCase();
  if (!char) return null;
  const codes: Record<string, number> = {
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
    J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
    T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030,
  };
  const year = codes[char];
  return year ?? null;
}

export async function decodeVin(vinInput: string): Promise<VinDecodeResult> {
  const vin = vinInput.trim().toUpperCase();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return { vin, brand: null, model: null, year: null, source: "local", message: "VIN inválido (deve ter 17 caracteres)." };
  }

  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as {
      Results?: Array<{ Variable: string; Value: string | null }>;
    };
    const find = (name: string) =>
      data.Results?.find((item) => item.Variable === name && item.Value)?.Value?.trim() || null;

    return {
      vin,
      brand: find("Make"),
      model: find("Model"),
      year: Number(find("Model Year")) || yearFromVin(vin),
      source: "nhtsa",
      message: "Dados obtidos da base NHTSA vPIC.",
    };
  } catch {
    return {
      vin,
      brand: null,
      model: null,
      year: yearFromVin(vin),
      source: "local",
      message: "Serviço NHTSA indisponível — apenas o ano foi inferido localmente.",
    };
  }
}
