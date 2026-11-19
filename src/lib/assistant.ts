import "server-only";

/**
 * Assistente de oficina: sugestões baseadas em regras locais, com provedor LLM
 * opcional (OpenAI-compatible). Nunca altera preços nem decide IVA — apenas
 * sugere serviços/peças para confirmação humana.
 */

export type CatalogItem = {
  id: number;
  kind: "service" | "part";
  description: string;
  priceCents: number;
  vatRateBps: number;
};

export type Suggestion = {
  itemId: number;
  kind: "service" | "part";
  description: string;
  reason: string;
  priceCents: number;
  vatRateBps: number;
  confidence: number;
};

const KEYWORDS: Array<{ match: RegExp; catalog: RegExp[] }> = [
  { match: /trav|pastilha|disco/, catalog: [/trav/, /pastilha/, /disco/] },
  { match: /[oó]leo|filtro|revis[aã]o/, catalog: [/óleo/, /oleo/, /filtro/, /revis/] },
  { match: /barulho|motor|ru[ií]do|ruido/, catalog: [/diagn/i, /motor/, /vela/, / correia/] },
  { match: /pneu|alinhamento|dire[cç][aã]o/, catalog: [/pneu/, /alinhamento/, /dire[cç][aã]o/] },
  { match: /bateria|arranque|n[aã]o arranca/, catalog: [/bateria/, /arranque/] },
  { match: /ar condicionado|climatiza/, catalog: [/climatiza/, /ar condicionado/] },
];

function localSuggestions(
  complaint: string,
  history: string[],
  mileage: number | null,
  catalog: CatalogItem[],
): Suggestion[] {
  const text = `${complaint} ${history.join(" ")}`.toLowerCase();
  const matchedRules = KEYWORDS.filter((rule) => rule.match.test(text));

  const suggestions = catalog
    .filter((item) => {
      const description = item.description.toLowerCase();
      return matchedRules.some((rule) => rule.catalog.some((pattern) => pattern.test(description)));
    })
    .map((item) => ({
      itemId: item.id,
      kind: item.kind,
      description: item.description,
      reason: "Correspondência com a queixa/histórico da viatura",
      priceCents: item.priceCents,
      vatRateBps: item.vatRateBps,
      confidence: 0.7,
    }));

  if (mileage && mileage > 100_000 && !suggestions.some((s) => /distribui/i.test(s.description))) {
    const timing = catalog.find((item) => /distribui/i.test(item.description));
    if (timing) {
      suggestions.push({
        itemId: timing.id,
        kind: timing.kind,
        description: timing.description,
        reason: `Quilometragem elevada (${mileage.toLocaleString("pt-PT")} km)`,
        priceCents: timing.priceCents,
        vatRateBps: timing.vatRateBps,
        confidence: 0.5,
      });
    }
  }

  return suggestions.slice(0, 5);
}

async function llmSuggestions(
  complaint: string,
  history: string[],
  catalog: CatalogItem[],
): Promise<Suggestion[] | null> {
  const url = process.env.AI_API_URL;
  const key = process.env.AI_API_KEY;
  if (!url || !key) return null;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "És um assistente de oficina. Sugere apenas serviços/peças do catálogo fornecido. " +
              "Responde com JSON: {\"suggestions\":[{\"itemId\":n,\"reason\":\"...\"}]}. Não alteres preços nem IVA.",
          },
          {
            role: "user",
            content: JSON.stringify({ complaint, history, catalog: catalog.map((c) => ({ id: c.id, description: c.description })) }),
          },
        ],
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { suggestions?: Array<{ itemId: number; reason: string }> };
    return (parsed.suggestions ?? [])
      .map((entry) => {
        const item = catalog.find((c) => c.id === entry.itemId);
        if (!item) return null;
        return {
          itemId: item.id,
          kind: item.kind,
          description: item.description,
          reason: entry.reason || "Sugestão do assistente",
          priceCents: item.priceCents,
          vatRateBps: item.vatRateBps,
          confidence: 0.6,
        } satisfies Suggestion;
      })
      .filter((s): s is Suggestion => s !== null)
      .slice(0, 5);
  } catch {
    return null;
  }
}

export async function suggestWork(
  complaint: string,
  history: string[],
  mileage: number | null,
  catalog: CatalogItem[],
): Promise<{ suggestions: Suggestion[]; source: "local" | "ia" }> {
  const fromLlm = await llmSuggestions(complaint, history, catalog);
  if (fromLlm && fromLlm.length > 0) return { suggestions: fromLlm, source: "ia" };
  return { suggestions: localSuggestions(complaint, history, mileage, catalog), source: "local" };
}

export function summarizeDiagnosis(diagnosis: string | null, lines: Array<{ description: string; quantity: number }>): string {
  const parts = lines.map((line) => `${line.quantity}x ${line.description}`).join(", ");
  if (!diagnosis && !parts) return "Sem informação de diagnóstico registada.";
  return [
    diagnosis ? `Diagnóstico: ${diagnosis.trim()}` : null,
    parts ? `Intervenções: ${parts}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function predictNextServiceKm(mileage: number | null, historyKm: number[]): number | null {
  if (!mileage) return null;
  const sorted = [...historyKm].sort((a, b) => a - b);
  if (sorted.length < 2) return mileage + 15_000;
  const intervals = sorted.slice(1).map((value, index) => value - sorted[index]);
  const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  return mileage + Math.round(average / 500) * 500;
}
