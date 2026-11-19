"use client";

import { useActionState } from "react";
import { createCustomer } from "@/actions/customers";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function CustomerForm() {
  const [state, action, pending] = useActionState(createCustomer, idleState);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome *" className="sm:col-span-2">
          <input name="name" required minLength={2} className={inputClasses} />
        </Field>
        <Field label="NIF">
          <input name="nif" inputMode="numeric" maxLength={9} className={inputClasses} />
        </Field>
        <Field label="Telemóvel">
          <input name="phone" className={inputClasses} />
        </Field>
        <Field label="Email" className="sm:col-span-2">
          <input name="email" type="email" className={inputClasses} />
        </Field>
        <Field label="Morada" className="sm:col-span-2">
          <input name="address" className={inputClasses} />
        </Field>
        <Field label="Código postal">
          <input name="postalCode" className={inputClasses} placeholder="0000-000" />
        </Field>
        <Field label="Localidade">
          <input name="city" className={inputClasses} />
        </Field>
        <Field label="Observações" className="sm:col-span-2">
          <textarea name="notes" rows={3} className={inputClasses} />
        </Field>
      </div>

      <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
        <input name="consent" type="checkbox" className="mt-0.5 size-4 accent-slate-900" defaultChecked />
        <span>
          O cliente foi informado do tratamento dos seus dados pessoais e deu consentimento (RGPD).
          O registo fica associado à ficha.
        </span>
      </label>

      {state.message ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
        {pending ? "A guardar…" : "Guardar cliente"}
      </button>
    </form>
  );
}
