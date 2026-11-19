import "server-only";

import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SetupField = {
  key: string;
  label: string;
  placeholder: string;
  help?: string;
  secret?: boolean;
  url?: boolean;
};

export type SetupSection = {
  id: string;
  title: string;
  description: string;
  fields: SetupField[];
};

/** Apenas estas chaves podem ser escritas pelo assistente (white-list). */
export const SETUP_SECTIONS: SetupSection[] = [
  {
    id: "geral",
    title: "Oficina",
    description: "Identificação da oficina e localização para o painel de tempo.",
    fields: [
      { key: "COMPANY_NIF", label: "NIF da oficina", placeholder: "500000000" },
      { key: "WORKSHOP_LAT", label: "Latitude", placeholder: "38.7223" },
      { key: "WORKSHOP_LON", label: "Longitude", placeholder: "-9.1393" },
      { key: "APP_URL", label: "URL pública", placeholder: "http://localhost:3000", url: true },
    ],
  },
  {
    id: "pagamentos",
    title: "Pagamentos",
    description: "Gateway de cartão ou MB WAY. Sem credenciais, os pagamentos ficam em demonstração.",
    fields: [
      { key: "PAYMENT_PROVIDER", label: "Fornecedor", placeholder: "stripe | sibs | none" },
      { key: "STRIPE_SECRET_KEY", label: "Stripe secret key", placeholder: "sk_test_...", secret: true },
      { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe webhook secret", placeholder: "whsec_...", secret: true },
      { key: "SIBS_API_URL", label: "SIBS API URL", placeholder: "https://...", url: true },
      { key: "SIBS_API_KEY", label: "SIBS API key", placeholder: "chave", secret: true },
      { key: "SIBS_WEBHOOK_SECRET", label: "SIBS webhook secret", placeholder: "segredo", secret: true },
    ],
  },
  {
    id: "fiscal",
    title: "Faturação certificada",
    description: "Programa certificado pela AT (Moloni). Nunca emita faturas fiscais sem licença.",
    fields: [
      { key: "FISCAL_PROVIDER", label: "Fornecedor", placeholder: "moloni | none" },
      { key: "MOLONI_CLIENT_ID", label: "Client ID", placeholder: "cliente", secret: true },
      { key: "MOLONI_CLIENT_SECRET", label: "Client secret", placeholder: "segredo", secret: true },
      { key: "MOLONI_USERNAME", label: "Utilizador", placeholder: "email" },
      { key: "MOLONI_PASSWORD", label: "Palavra-passe", placeholder: "••••", secret: true },
      { key: "MOLONI_COMPANY_ID", label: "Company ID", placeholder: "0000" },
      { key: "AT_SOFTWARE_CERTIFICATE_NUMBER", label: "Certificado software AT", placeholder: "nº atribuído pela AT" },
    ],
  },
  {
    id: "assinatura",
    title: "Assinatura qualificada",
    description: "Serviço externo com certificado qualificado.",
    fields: [
      { key: "QSIGN_API_URL", label: "API URL", placeholder: "https://...", url: true },
      { key: "QSIGN_API_KEY", label: "API key", placeholder: "chave", secret: true },
      { key: "QSIGN_WEBHOOK_SECRET", label: "Webhook secret", placeholder: "segredo", secret: true },
    ],
  },
  {
    id: "catalogos",
    title: "Catálogos técnicos",
    description: "TecDoc (peças) e TecRMI (reparação) — licenças distintas da TecAlliance.",
    fields: [
      { key: "TECDOC_API_URL", label: "TecDoc API URL", placeholder: "https://...", url: true },
      { key: "TECDOC_API_KEY", label: "TecDoc API key", placeholder: "chave", secret: true },
      { key: "TECRMI_API_URL", label: "TecRMI API URL", placeholder: "https://...", url: true },
      { key: "TECRMI_API_KEY", label: "TecRMI API key", placeholder: "chave", secret: true },
      { key: "TECRMI_DATA_SUPPLIER", label: "Data supplier", placeholder: "código" },
    ],
  },
  {
    id: "ia",
    title: "Assistente inteligente",
    description: "LLM compatível com OpenAI. Sem configuração, o assistente usa regras locais.",
    fields: [
      { key: "AI_API_URL", label: "API URL", placeholder: "https://api.openai.com/v1/chat/completions", url: true },
      { key: "AI_API_KEY", label: "API key", placeholder: "sk-...", secret: true },
      { key: "AI_MODEL", label: "Modelo", placeholder: "gpt-4o-mini" },
    ],
  },
  {
    id: "acessos",
    title: "Acessos e notificações",
    description: "Chave da API pública, segredo do cron e email SMTP.",
    fields: [
      { key: "API_KEY", label: "Chave API pública", placeholder: "gerada automaticamente", secret: true },
      { key: "CRON_SECRET", label: "Segredo do cron", placeholder: "gerado automaticamente", secret: true },
      { key: "SMTP_HOST", label: "SMTP host", placeholder: "smtp.exemplo.pt" },
      { key: "SMTP_PORT", label: "SMTP port", placeholder: "587" },
      { key: "SMTP_USER", label: "SMTP user", placeholder: "utilizador" },
      { key: "SMTP_PASSWORD", label: "SMTP password", placeholder: "••••", secret: true },
      { key: "SMTP_FROM", label: "Remetente", placeholder: "Oficina Livre <nao-responder@exemplo.pt>" },
    ],
  },
];

const ALLOWED_KEYS = new Set(SETUP_SECTIONS.flatMap((section) => section.fields.map((field) => field.key)));
const ENV_PATH = path.join(process.cwd(), ".env.local");

export function generateSecret(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}

/** Devolve apenas se cada chave está configurada — nunca os valores. */
export async function getSetupStatus(): Promise<Record<string, boolean>> {
  const values = await readEnvFile();
  const status: Record<string, boolean> = {};
  for (const key of ALLOWED_KEYS) {
    status[key] = Boolean((values.get(key) || process.env[key] || "").trim());
  }
  return status;
}

export async function readEnvFile(): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  try {
    const content = await readFile(ENV_PATH, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 0) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      result.set(key, value);
    }
  } catch {
    // Ficheiro ainda não existe.
  }
  return result;
}

export async function saveEnvValues(updates: Record<string, string>): Promise<number> {
  const current = await readEnvFile();
  for (const [key, value] of Object.entries(updates)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    const clean = value.trim();
    if (clean) current.set(key, clean);
    else current.delete(key);
  }
  const lines = [...current.entries()].map(([key, value]) => `${key}=${value.includes(" ") ? `"${value}"` : value}`);
  await writeFile(ENV_PATH, `${lines.join("\n")}\n`, { mode: 0o600 });
  return current.size;
}
