"use client";

import { Sparkles, Plus } from "lucide-react";
import { useActionState } from "react";
import { getAssistantSuggestions, type AssistantState } from "@/actions/assistant";
import { addWorkOrderLine } from "@/actions/work-orders";
import { idleState } from "@/lib/action-state";

export function AssistantPanel({ workOrderId }: { workOrderId: number }) {
  const [state, action, pending] = useActionState<AssistantState, FormData>(getAssistantSuggestions, idleState);
  const [addState, addAction, adding] = useActionState(addWorkOrderLine, idleState);

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-amber-50 text-brandstrong"><Sparkles size={16} /></span>
        <div>
          <h2 className="text-sm font-semibold text-ink">Assistente de oficina</h2>
          <p className="text-xs text-slate-500">Sugestões com base na queixa e histórico — sempre com confirmação</p>
        </div>
      </div>

      <form action={action} className="mt-4">
        <input type="hidden" name="workOrderId" value={workOrderId} />
        <button type="submit" disabled={pending} className="btn-primary">
          <Sparkles size={14} /> {pending ? "A analisar…" : "Gerar sugestões"}
        </button>
      </form>

      {state.message ? <p className="mt-3 text-xs text-slate-500">{state.message}</p> : null}
      {state.summary ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><strong>Resumo:</strong> {state.summary}</p>
      ) : null}
      {state.nextServiceKm ? (
        <p className="mt-2 text-xs text-slate-500">Próxima revisão estimada: {state.nextServiceKm.toLocaleString("pt-PT")} km</p>
      ) : null}

      {state.suggestions && state.suggestions.length > 0 ? (
        <div className="mt-4 space-y-2">
          {state.suggestions.map((suggestion) => (
            <div key={`${suggestion.kind}-${suggestion.itemId}`} className="flex items-start justify-between gap-3 rounded-lg border border-line p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{suggestion.description}</p>
                <p className="mt-0.5 text-xs text-slate-500">{suggestion.reason}</p>
                <p className="mt-0.5 text-[0.68rem] text-slate-400">
                  {(suggestion.priceCents / 100).toFixed(2)} € · IVA {suggestion.vatRateBps / 100}% · confiança {Math.round(suggestion.confidence * 100)}%
                </p>
              </div>
              <form action={addAction}>
                <input type="hidden" name="id" value={workOrderId} />
                <input
                  type="hidden"
                  name="lines"
                  value={JSON.stringify([{
                    kind: suggestion.kind,
                    itemId: String(suggestion.itemId),
                    description: suggestion.description,
                    quantity: "1",
                    unitPrice: (suggestion.priceCents / 100).toFixed(2),
                    vatRate: String(suggestion.vatRateBps / 100),
                    discount: "0",
                  }])}
                />
                <button type="submit" disabled={adding} className="btn-secondary shrink-0" title="Adicionar à ordem">
                  <Plus size={13} /> Adicionar
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : null}
      {addState.message ? <p className="mt-2 text-xs text-emerald-600">{addState.message}</p> : null}
    </section>
  );
}
