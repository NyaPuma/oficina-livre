import "server-only";

export type Holiday = { date: string; name: string };

type CacheEntry = { at: number; value: Holiday[] };
let cache: CacheEntry | null = null;
const TTL = 24 * 60 * 60 * 1000;

/** Feriados públicos portugueses via Nager.Date (gratuito, sem chave). */
export async function getPortugueseHolidays(): Promise<Holiday[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;

  const year = new Date().getFullYear();
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PT`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = (await response.json()) as Array<{ date: string; localName?: string; name?: string; global?: boolean }>;
    const value = rows
      .filter((row) => row.global !== false)
      .map((row) => ({ date: row.date, name: row.localName ?? row.name ?? "Feriado" }));
    cache = { at: Date.now(), value };
    return value;
  } catch {
    return cache?.value ?? [];
  }
}

export function upcomingHolidays(holidays: Holiday[], count = 3): Holiday[] {
  const today = new Date().toISOString().slice(0, 10);
  return holidays.filter((holiday) => holiday.date >= today).slice(0, count);
}
