"use client";

import { useActionState } from "react";
import { createSite } from "@/actions/sites";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function SiteForm() {
  const [state, action, pending] = useActionState(createSite, idleState);
  return (
    <form action={action} className="space-y-4">
      <Field label="Nome *"><input name="name" required className={inputClasses} /></Field>
      <Field label="Código *"><input name="code" required className={inputClasses} placeholder="SEDE" /></Field>
      <Field label="Morada"><input name="address" className={inputClasses} /></Field>
      <Field label="Telemóvel"><input name="phone" className={inputClasses} /></Field>
      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-600" : "text-emerald-600"}`}>{state.message}</p> : null}
      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
        {pending ? "A guardar…" : "Adicionar local"}
      </button>
    </form>
  );
}
