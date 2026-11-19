import "server-only";

/**
 * Adaptador TecRMI (TecAlliance) para dados de reparação e manutenção.
 *
 * TecRMI é um produto comercial com licença própria, distinto do TecDoc,
 * disponível como SOAP e REST. Sem credenciais, a aplicação usa um conjunto
 * local de demonstração — nunca apresentado como dado OEM real.
 */

export type TecRmiVehicle = {
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  engine?: string | null;
};

export type TecRmiResult<T> = {
  data: T;
  source: "tecrmi" | "local";
  message?: string;
};

export type RepairTime = {
  operation: string;
  hours: number;
  note?: string | null;
};

export type VehicleTechData = {
  engineOilLitres: number | null;
  oilSpecification: string | null;
  tyrePressureFrontBar: number | null;
  tyrePressureRearBar: number | null;
  coolantLitres: number | null;
};

export type ServiceItem = {
  operation: string;
  intervalKm?: number | null;
  intervalMonths?: number | null;
  note?: string | null;
};

export function isTecRmiConfigured(): boolean {
  return Boolean(process.env.TECRMI_API_URL && process.env.TECRMI_API_KEY);
}

async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const base = process.env.TECRMI_API_URL!.replace(/\/$/, "");
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TECRMI_API_KEY}`,
      ...(process.env.TECRMI_DATA_SUPPLIER
        ? { "X-Data-Supplier": process.env.TECRMI_DATA_SUPPLIER }
        : {}),
    },
    body: JSON.stringify({ ...body, locale: "pt-PT" }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`TecRMI HTTP ${response.status}`);
  return (await response.json()) as T;
}

function fallbackMessage(): string {
  return "Sem credenciais TecRMI — a mostrar valores de demonstração. Confirmar sempre no manual do fabricante.";
}

export async function getRepairTime(vehicle: TecRmiVehicle, operation: string): Promise<TecRmiResult<RepairTime | null>> {
  if (isTecRmiConfigured()) {
    try {
      const result = await request<{ hours?: number; note?: string }>("/repair-times", { vehicle, operation });
      return {
        data: { operation, hours: Number(result.hours ?? 0), note: result.note ?? null },
        source: "tecrmi",
        message: "Tempo obtido do TecRMI.",
      };
    } catch {
      return { data: null, source: "local", message: "TecRMI indisponível. Verifique credenciais e endpoint." };
    }
  }

  const term = operation.toLowerCase();
  const demo: Array<[RegExp, number, string]> = [
    [/pastilha|trav[aã]o/, 1.6, "Inclui desmontagem de roda e verificação de discos"],
    [/óleo|oleo|filtro/, 0.8, "Inclui drenagem e reposição de óleo"],
    [/revis[aã]o/, 2.0, "Revisão geral com verificação de níveis"],
    [/embraiagem|embreagem/, 4.5, "Inclui desmontagem da caixa"],
    [/correia|distribui/, 3.2, "Inclui tensores e verificação de sincronismo"],
    [/vela|igni[cç][aã]o/, 1.2, "Inclui substituição de velas"],
  ];
  const match = demo.find(([pattern]) => pattern.test(term));
  return {
    data: match ? { operation, hours: match[1], note: match[2] } : null,
    source: "local",
    message: fallbackMessage(),
  };
}

export async function getVehicleTechData(vehicle: TecRmiVehicle): Promise<TecRmiResult<VehicleTechData>> {
  if (isTecRmiConfigured()) {
    try {
      const data = await request<VehicleTechData>("/vehicle-data", { vehicle });
      return { data, source: "tecrmi", message: "Dados técnicos obtidos do TecRMI." };
    } catch {
      return {
        data: emptyTechData(),
        source: "local",
        message: "TecRMI indisponível. Dados técnicos não disponíveis.",
      };
    }
  }
  return { data: emptyTechData(), source: "local", message: fallbackMessage() };
}

function emptyTechData(): VehicleTechData {
  return {
    engineOilLitres: null,
    oilSpecification: null,
    tyrePressureFrontBar: null,
    tyrePressureRearBar: null,
    coolantLitres: null,
  };
}

export async function getServiceSchedule(vehicle: TecRmiVehicle, mileage: number | null): Promise<TecRmiResult<ServiceItem[]>> {
  if (isTecRmiConfigured()) {
    try {
      const result = await request<{ items?: ServiceItem[] }>("/service-schedule", { vehicle, mileage });
      return { data: result.items ?? [], source: "tecrmi", message: "Plano de manutenção obtido do TecRMI." };
    } catch {
      return { data: [], source: "local", message: "TecRMI indisponível." };
    }
  }

  return {
    data: [
      { operation: "Troca de óleo e filtro", intervalKm: 15000, intervalMonths: 12 },
      { operation: "Verificação de travões", intervalKm: 30000, intervalMonths: 24 },
      { operation: "Correia de distribuição", intervalKm: 120000, intervalMonths: 120, note: "Consultar fabricante — varia por motor" },
      { operation: "Líquido de travões", intervalKm: null, intervalMonths: 24 },
    ],
    source: "local",
    message: fallbackMessage(),
  };
}
