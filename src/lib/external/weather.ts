import "server-only";

export type Weather = {
  temperature: number;
  precipitation: number;
  code: number;
  source: "open-meteo";
};

type CacheEntry = { at: number; value: Weather };
let cache: CacheEntry | null = null;
const TTL = 30 * 60 * 1000;

/** Tempo atual via Open-Meteo (gratuito, sem chave). Requer latitude/longitude da oficina. */
export async function getCurrentWeather(): Promise<Weather | null> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;

  const lat = process.env.WORKSHOP_LAT ?? "38.7223";
  const lon = process.env.WORKSHOP_LON ?? "-9.1393";
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,precipitation,weather_code");

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as {
      current?: { temperature_2m?: number; precipitation?: number; weather_code?: number };
    };
    if (!data.current || data.current.temperature_2m === undefined) return null;
    const value: Weather = {
      temperature: data.current.temperature_2m,
      precipitation: data.current.precipitation ?? 0,
      code: data.current.weather_code ?? 0,
      source: "open-meteo",
    };
    cache = { at: Date.now(), value };
    return value;
  } catch {
    return cache?.value ?? null;
  }
}
