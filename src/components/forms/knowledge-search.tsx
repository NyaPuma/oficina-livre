"use client";

import { BookOpen, Search, Wrench } from "lucide-react";
import { useActionState } from "react";
import { searchKnowledgeAction, type KnowledgeState } from "@/actions/knowledge";
import { inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function KnowledgeSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [state, action, pending] = useActionState<KnowledgeState, FormData>(searchKnowledgeAction, idleState);

  return (
    <div>
      <form action={action} className="flex gap-2">
        <input name="query" defaultValue={initialQuery} required className={inputClasses} placeholder="Ex.: barulho ao travar, P0300, sobreaquecimento…" />
        <button type="submit" disabled={pending} className="btn-primary shrink-0">
          <Search size={15} /> {pending ? "A procurar…" : "Pesquisar"}
        </button>
      </form>

      {state.message ? <p className="mt-3 text-xs text-slate-500">{state.message}</p> : null}

      {state.obd ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="eyebrow text-amber-700">Código {state.obd.code}</p>
          <h3 className="mt-1 font-semibold text-ink">{state.obd.title}</h3>
          <p className="mt-2 text-xs text-slate-600"><strong>Causas prováveis:</strong> {state.obd.causes.join(" · ")}</p>
          <p className="mt-1 text-xs text-slate-600"><strong>Primeiras verificações:</strong> {state.obd.firstChecks.join(" · ")}</p>
        </div>
      ) : null}

      {state.articles && state.articles.length > 0 ? (
        <div className="mt-4 space-y-3">
          {state.articles.map((article) => (
            <details key={article.id} className="panel group p-4">
              <summary className="flex cursor-pointer items-start justify-between gap-3 list-none">
                <div>
                  <p className="eyebrow">{article.category}</p>
                  <h3 className="mt-1 font-semibold text-ink group-open:text-brandstrong">{article.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">Sintomas: {article.symptoms.slice(0, 3).join(" · ")}</p>
                </div>
                <BookOpen size={17} className="mt-1 shrink-0 text-slate-400" />
              </summary>
              <div className="mt-4 grid gap-4 border-t border-line pt-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="eyebrow mb-1">Causas possíveis</p>
                  <ul className="list-inside list-disc space-y-1 text-slate-600">{article.causes.map((cause) => <li key={cause}>{cause}</li>)}</ul>
                </div>
                <div>
                  <p className="eyebrow mb-1">Diagnóstico</p>
                  <ol className="list-inside list-decimal space-y-1 text-slate-600">{article.diagnostic.map((step) => <li key={step}>{step}</li>)}</ol>
                </div>
                <div>
                  <p className="eyebrow mb-1">Correcção</p>
                  <ul className="list-inside list-disc space-y-1 text-slate-600">{article.fix.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="flex items-center gap-1 font-semibold"><Wrench size={13} /> Segurança</p>
                  <p className="mt-1">{article.safety}</p>
                </div>
              </div>
              {article.obdCodes?.length ? <p className="mt-3 text-xs text-slate-400">Códigos: {article.obdCodes.join(", ")}</p> : null}
            </details>
          ))}
        </div>
      ) : null}
    </div>
  );
}
