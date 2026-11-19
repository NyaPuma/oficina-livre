"use client";

import { useActionState } from "react";
import { createPart, createServiceTemplate } from "@/actions/stock";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function PartForm() {
  const [state, action, pending] = useActionState(createPart, idleState);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Código *"><input name="code" required className={inputClasses} /></Field>
        <Field label="Descrição *"><input name="description" required className={inputClasses} /></Field>
        <Field label="Preço de custo (€)"><input name="costPrice" defaultValue="0" inputMode="decimal" className={inputClasses} /></Field>
        <Field label="Preço de venda (€)"><input name="salePrice" defaultValue="0" inputMode="decimal" className={inputClasses} /></Field>
        <Field label="IVA (%)"><input name="vatRate" type="number" min={0} max={100} defaultValue={23} className={inputClasses} /></Field>
        <Field label="Quantidade em stock"><input name="stockQty" type="number" min={0} defaultValue={0} className={inputClasses} /></Field>
        <Field label="Stock mínimo"><input name="minStock" type="number" min={0} defaultValue={0} className={inputClasses} /></Field>
      </div>
      {state.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
        {pending ? "A guardar…" : "Guardar peça"}
      </button>
    </form>
  );
}

export function ServiceTemplateForm() {
  const [state, action, pending] = useActionState(createServiceTemplate, idleState);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do serviço *"><input name="name" required className={inputClasses} /></Field>
        <Field label="Horas padrão"><input name="standardHours" type="number" min={0} defaultValue={1} className={inputClasses} /></Field>
        <Field label="Preço (€)"><input name="salePrice" defaultValue="0" inputMode="decimal" className={inputClasses} /></Field>
        <Field label="IVA (%)"><input name="vatRate" type="number" min={0} max={100} defaultValue={13} className={inputClasses} /></Field>
        <Field label="Descrição" className="sm:col-span-2"><textarea name="description" rows={2} className={inputClasses} /></Field>
      </div>
      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-600" : "text-emerald-600"}`}>{state.message}</p> : null}
      <button type="submit" disabled={pending} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
        {pending ? "A adicionar…" : "Adicionar serviço"}
      </button>
    </form>
  );
}
