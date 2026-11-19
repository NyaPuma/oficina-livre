import "server-only";

export type GeocodeResult = {
  address: string | null;
  postalCode: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  source: "osm";
  message?: string;
};

/**
 * Geocodificação com Nominatim (OpenStreetMap).
 * Limite do serviço público: 1 pedido/segundo. Dados © OpenStreetMap contributors (ODbL).
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  const term = query.trim();
  if (term.length < 4) {
    return { address: null, postalCode: null, city: null, lat: null, lon: null, source: "osm", message: "Escreva mais caracteres." };
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", term);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "pt");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "OficinaLivre/0.6 (gestao de oficina; contacto local)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = (await response.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      address?: Record<string, string>;
    }>;
    const row = rows[0];
    if (!row) {
      return { address: null, postalCode: null, city: null, lat: null, lon: null, source: "osm", message: "Morada não encontrada." };
    }

    const address = row.address ?? {};
    const street = [address.road, address.house_number].filter(Boolean).join(" ");
    return {
      address: street || row.display_name.split(",")[0]?.trim() || null,
      postalCode: address.postcode ?? null,
      city: address.city ?? address.town ?? address.village ?? address.municipality ?? null,
      lat: Number(row.lat),
      lon: Number(row.lon),
      source: "osm",
      message: "Morada encontrada — © OpenStreetMap contributors.",
    };
  } catch {
    return { address: null, postalCode: null, city: null, lat: null, lon: null, source: "osm", message: "Serviço de geocodificação indisponível." };
  }
}
