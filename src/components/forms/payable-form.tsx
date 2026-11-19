"use client";

import { useActionState } from "react";
import { createPayable } from "@/actions/invoicing";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function PayableForm() {
  const [state, action, pending] = useActionState(createPayable, idleState);
  return (
    <form action={action} className="space-y-4">
      <Field label="Descrição *"><input name="description" required className={inputClasses} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valor (€) *"><input name="amount" required inputMode="decimal" className={inputClasses} /></Field>
        <Field label="Categoria"><input name="category" className={inputClasses} placeholder="Ex.: renda, energia, peças" /></Field>
        <Field label="Vencimento"><input name="dueAt" type="date" className={inputClasses} /></Field>
        <Field label="Referência"><input name="reference" className={inputClasses} /></Field>
      </div>
      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-600" : "text-emerald-600"}`}>{state.message}</p> : null}
      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
        {pending ? "A guardar…" : "Adicionar conta"}
      </button>
    </form>
  );
}
