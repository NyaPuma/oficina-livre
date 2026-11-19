"use client";

import { CheckCircle2, KeyRound, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { Card, inputClasses } from "@/components/ui";
import type { SetupSection } from "@/lib/setup";

export function SetupWizard({
  sections,
  initialStatus,
}: {
  sections: SetupSection[];
  initialStatus: Record<string, boolean>;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [restarting, setRestarting] = useState(false);

  function generate(key: string) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const token = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    setValues((current) => ({ ...current, [key]: token }));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as { saved?: number; status?: Record<string, boolean>; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Falha ao guardar.");
      setStatus(data.status ?? status);
      setValues({});
      setMessage(`${data.saved} variável(is) guardada(s) em .env.local.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function restart() {
    setRestarting(true);
    await fetch("/api/setup/restart", { method: "POST" }).catch(() => {});
    setMessage("A reiniciar… a página deve recarregar dentro de segundos.");
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const configuredCount = section.fields.filter((field) => status[field.key]).length;
        return (
          <Card key={section.id} className="p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-ink">{section.title}</h2>
                <p className="mt-1 text-xs text-slate-500">{section.description}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${configuredCount === section.fields.length ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {configuredCount}/{section.fields.length} configurados
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="eyebrow mb-2 flex items-center justify-between gap-2 normal-case tracking-normal text-slate-600">
                    {field.label}
                    {status[field.key] ? <CheckCircle2 size={13} className="text-emerald-500" /> : null}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type={field.secret ? "password" : "text"}
                      value={values[field.key] ?? ""}
                      onChange={(e) => setValues((current) => ({ ...current, [field.key]: e.target.value }))}
                      placeholder={status[field.key] ? "Configurado — deixar em branco para manter" : field.placeholder}
                      className={inputClasses}
                      autoComplete="off"
                    />
                    {(field.key === "API_KEY" || field.key === "CRON_SECRET") ? (
                      <button type="button" onClick={() => generate(field.key)} className="btn-secondary shrink-0" title="Gerar valor aleatório">
                        <KeyRound size={14} />
                      </button>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
          </Card>
        );
      })}

      <Card className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-xs text-slate-500">
          {message ?? "Os valores são guardados apenas no ficheiro local .env.local (não versionado). Deixe em branco para manter o valor atual."}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void save()} disabled={saving} className="btn-primary">
            <Save size={15} /> {saving ? "A guardar…" : "Guardar configuração"}
          </button>
          <button type="button" onClick={() => void restart()} disabled={restarting} className="btn-secondary" title="Necessário para aplicar alterações em produção">
            <RotateCcw size={14} /> {restarting ? "A reiniciar…" : "Reiniciar"}
          </button>
        </div>
      </Card>

      <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
        ⚠️ Em modo desenvolvido o Next.js reinicia automaticamente ao alterar o `.env.local`. Em produção, use o botão
        <strong> Reiniciar </strong> (ou reinicie o serviço/container) para aplicar as novas variáveis.
      </p>
    </div>
  );
}
