import "server-only";

export type SafetyNotice = {
  id: string;
  component: string;
  summary: string;
  date?: string | null;
  consequence?: string | null;
  remedy?: string | null;
};

type CacheEntry = { at: number; value: SafetyNotice[] };
const cache = new Map<string, CacheEntry>();
const TTL = 24 * 60 * 60 * 1000;

async function fetchNhtsa<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const url = new URL(`https://api.nhtsa.gov/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { results?: T[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

/** Recalls oficiais (EUA) por marca/modelo/ano — gratuito e sem chave. */
export async function getRecalls(make: string, model: string, year: number): Promise<SafetyNotice[]> {
  const key = `recall:${make}:${model}:${year}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL) return cached.value;

  const rows = await fetchNhtsa<Record<string, string>>("recalls/recallsByVehicle", {
    make,
    model,
    modelYear: String(year),
  });
  const value = rows.map((row, index) => ({
    id: row.NHTSACampaignNumber ?? String(index),
    component: row.Component ?? "Não especificado",
    summary: row.Summary ?? "",
    date: row.ReportReceivedDate ?? null,
    consequence: row.Consequence ?? null,
    remedy: row.Remedy ?? null,
  }));
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** Queixas de proprietários (NHTSA ODI) por marca/modelo/ano. */
export async function getComplaints(make: string, model: string, year: number): Promise<SafetyNotice[]> {
  const key = `complaint:${make}:${model}:${year}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL) return cached.value;

  const rows = await fetchNhtsa<Record<string, unknown>>("complaints/complaintsByVehicle", {
    make,
    model,
    modelYear: String(year),
  });
  const value = rows.slice(0, 10).map((row, index) => ({
    id: String(row.odiNumber ?? index),
    component: String(row.components ?? "Não especificado"),
    summary: String(row.summary ?? ""),
    date: row.dateComplaintFiled ? String(row.dateComplaintFiled) : null,
    consequence: row.crash === true || row.fire === true ? "Regista Acidente/Incêndio" : null,
    remedy: null,
  }));
  cache.set(key, { at: Date.now(), value });
  return value;
}
