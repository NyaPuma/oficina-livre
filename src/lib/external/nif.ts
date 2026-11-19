import "server-only";

/** Validação do NIF português por algoritmo de cheque (sem custo nem API). */
export function isValidPortugueseNif(value: string): boolean {
  const nif = value.replace(/\D/g, "");
  if (!/^\d{9}$/.test(nif)) return false;
  const first = Number(nif[0]);
  if (![1, 2, 3, 5, 6, 8, 9].includes(first)) return false;

  const sum = nif
    .slice(0, 8)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (9 - index), 0);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === Number(nif[8]);
}

export type ViesResult = {
  valid: boolean;
  name: string | null;
  address: string | null;
  source: "local" | "vies";
  message?: string;
};

/** Validação opcional via VIES (através do VATcomply, gratuito e open-source). */
export async function validateVatNumber(nif: string): Promise<ViesResult> {
  const digits = nif.replace(/\D/g, "");
  const localValid = isValidPortugueseNif(digits);
  if (!localValid) {
    return { valid: false, name: null, address: null, source: "local", message: "NIF com dígito de controlo inválido." };
  }

  try {
    const response = await fetch(`https://api.vatcomply.com/vat?vat_number=PT${digits}`, {
      headers: { "User-Agent": "OficinaLivre/0.6 (+gestão de oficina)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { valid?: boolean; name?: string; address?: string };
    return {
      valid: Boolean(data.valid),
      name: data.name && data.name !== "---" ? data.name : null,
      address: data.address && data.address !== "---" ? data.address : null,
      source: "vies",
      message: data.valid ? "NIF válido e registado no VIES." : "Dígito correto, mas sem registo VIES.",
    };
  } catch {
    return {
      valid: localValid,
      name: null,
      address: null,
      source: "local",
      message: "Validação local OK; VIES indisponível neste momento.",
    };
  }
}
