const moneyFormatter = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatMoney(cents: number): string {
  return moneyFormatter.format(cents / 100);
}

/** Aceita "12,50", "12.50" ou "12" e devolve centimos. */
export function parseMoneyToCents(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100);
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) return 0;
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function formatVat(bps: number): string {
  return `${Number((bps / 100).toFixed(2))}%`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return dateTimeFormatter.format(date);
}

export type PricedLine = {
  quantity: number;
  unitPriceCents: number;
  vatRateBps: number;
  discountCents: number;
};

export function lineTotalCents(line: PricedLine): number {
  return Math.max(0, line.quantity * line.unitPriceCents - line.discountCents);
}

export function documentTotals<T extends PricedLine>(lines: T[]): {
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
} {
  let subtotalCents = 0;
  let vatCents = 0;
  for (const line of lines) {
    const total = lineTotalCents(line);
    subtotalCents += total;
    vatCents += Math.round((total * line.vatRateBps) / 10_000);
  }
  return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}

/** Número sequencial simples: OR-2026-0001 / OC-2026-0001 */
export function documentNumber(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
}

export const STATUS_LABELS: Record<string, string> = {
  recebida: "Recebida",
  diagnostico: "Em diagnóstico",
  aguarda_peca: "À espera de peça",
  em_reparacao: "Em reparação",
  pronta: "Pronta",
  entregue: "Entregue",
  cancelada: "Cancelada",
  rascunho: "Rascunho",
  enviado: "Enviado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};
