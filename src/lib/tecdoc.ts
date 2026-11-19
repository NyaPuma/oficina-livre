import { randomUUID } from "node:crypto";

/**
 * Adaptador TecDoc / TecRMI.
 *
 * O TecDoc é um serviço comercial: sem credenciais válidas não há dados reais.
 * Quando `TECDOC_API_URL` está configurada, as pesquisas são enviadas para esse
 * endpoint (espera-se um gateway compatível com a API do fornecedor). Caso
 * contrário, é usado um catálogo local de demonstração, identificado como tal.
 */

export type TecDocPart = {
  id: string;
  code: string;
  description: string;
  brand: string;
  priceCents: number;
  vatRateBps: number;
  oeNumber?: string | null;
};

export type TecDocVehicle = {
  plate: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  engine?: string | null;
};

export type TecDocResult<T> = {
  data: T[];
  source: "tecdoc" | "local";
  message?: string;
};

const DEMO_PARTS: TecDocPart[] = [
  { id: "demo-1", code: "OLEO-5W30", description: "Óleo motor 5W30 4L", brand: "Motul", priceCents: 3900, vatRateBps: 2300, oeNumber: "MN9711" },
  { id: "demo-2", code: "FILTRO-OLEO", description: "Filtro de óleo", brand: "Mann", priceCents: 1200, vatRateBps: 2300, oeNumber: "W712/94" },
  { id: "demo-3", code: "PAST-FR", description: "Pastilhas de travão dianteiras", brand: "Brembo", priceCents: 5500, vatRateBps: 2300, oeNumber: "P06084" },
  { id: "demo-4", code: "DISCO-FR", description: "Disco de travão dianteiro", brand: "Brembo", priceCents: 7800, vatRateBps: 2300, oeNumber: "09.7879.11" },
  { id: "demo-5", code: "CORR-DIST", description: "Kit correia de distribuição", brand: "Gates", priceCents: 13500, vatRateBps: 2300, oeNumber: "KP15565XS" },
  { id: "demo-6", code: "BAT-60", description: "Bateria 60Ah 540A", brand: "Varta", priceCents: 8900, vatRateBps: 2300, oeNumber: "560410054" },
  { id: "demo-7", code: "FILTRO-AR", description: "Filtro de ar", brand: "Mann", priceCents: 1800, vatRateBps: 2300, oeNumber: "C35154" },
  { id: "demo-8", code: "FILTRO-HAB", description: "Filtro de habitáculo", brand: "Mann", priceCents: 2200, vatRateBps: 2300, oeNumber: "CU3556" },
  { id: "demo-9", code: "VELA-IGN", description: "Vela de ignição", brand: "NGK", priceCents: 950, vatRateBps: 2300, oeNumber: "BKR6EIX" },
  { id: "demo-10", code: "AMORT-FR", description: "Amortecedor dianteiro", brand: "Sachs", priceCents: 11500, vatRateBps: 2300, oeNumber: "315 065" },
];

function isConfigured(): boolean {
  return Boolean(process.env.TECDOC_API_URL);
}

async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const base = process.env.TECDOC_API_URL!.replace(/\/$/, "");
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.TECDOC_API_KEY ? { Authorization: `Bearer ${process.env.TECDOC_API_KEY}` } : {}),
      ...(process.env.TECDOC_DATA_SUPPLIER ? { "X-Data-Supplier": process.env.TECDOC_DATA_SUPPLIER } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`TecDoc HTTP ${response.status}`);
  return (await response.json()) as T;
}

function normalizePart(raw: Record<string, unknown>): TecDocPart {
  return {
    id: String(raw.id ?? raw.articleId ?? randomUUID()),
    code: String(raw.code ?? raw.articleNumber ?? ""),
    description: String(raw.description ?? raw.name ?? "Sem descrição"),
    brand: String(raw.brand ?? raw.manufacturer ?? ""),
    priceCents: Number(raw.priceCents ?? Math.round(Number(raw.price ?? 0) * 100)) || 0,
    vatRateBps: Number(raw.vatRateBps ?? 2300),
    oeNumber: raw.oeNumber ? String(raw.oeNumber) : null,
  };
}

export async function searchTecDocParts(query: string, limit = 20): Promise<TecDocResult<TecDocPart>> {
  const term = query.trim().toLowerCase();
  if (!term) return { data: [], source: isConfigured() ? "tecdoc" : "local" };

  if (isConfigured()) {
    try {
      const response = await request<{ parts?: Record<string, unknown>[] } | Record<string, unknown>[]>("/parts/search", {
        query: term,
        limit,
        locale: "pt-PT",
      });
      const list = Array.isArray(response) ? response : (response.parts ?? []);
      return {
        data: list.slice(0, limit).map(normalizePart),
        source: "tecdoc",
        message: "Resultados do TecDoc.",
      };
    } catch {
      return {
        data: [],
        source: "local",
        message: "TecDoc indisponível. Verifique as credenciais e o endpoint.",
      };
    }
  }

  const data = DEMO_PARTS.filter(
    (part) => part.description.toLowerCase().includes(term) || part.code.toLowerCase().includes(term) || part.oeNumber?.toLowerCase().includes(term),
  ).slice(0, limit);
  return {
    data,
    source: "local",
    message: "Catálogo de demonstração — configure TECDOC_API_URL para dados reais.",
  };
}

export async function tecdocLookupVehicle(value: string): Promise<TecDocResult<TecDocVehicle>> {
  const term = value.trim().toUpperCase();
  if (!term) return { data: [], source: isConfigured() ? "tecdoc" : "local" };

  if (isConfigured()) {
    try {
      const response = await request<{ vehicles?: Record<string, unknown>[] } | Record<string, unknown>[]>("/vehicles/identify", {
        plate: term,
        vin: term,
        locale: "pt-PT",
      });
      const list = Array.isArray(response) ? response : (response.vehicles ?? []);
      return {
        data: list.slice(0, 5).map((raw) => ({
          plate: String(raw.plate ?? term),
          brand: raw.brand ? String(raw.brand) : null,
          model: raw.model ? String(raw.model) : null,
          year: Number(raw.year ?? 0) || null,
          engine: raw.engine ? String(raw.engine) : null,
        })),
        source: "tecdoc",
        message: "Identificação obtida do TecDoc.",
      };
    } catch {
      return { data: [], source: "local", message: "TecDoc indisponível para identificação de veículo." };
    }
  }

  return {
    data: [],
    source: "local",
    message: "Sem credenciais TecDoc. Introduza marca, modelo e ano manualmente.",
  };
}
