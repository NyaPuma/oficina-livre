"use client";

import { useActionState } from "react";
import { createOnlineBooking } from "@/actions/appointments";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function BookingForm() {
  const [state, action, pending] = useActionState(createOnlineBooking, idleState);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome *"><input name="name" required className={inputClasses} /></Field>
        <Field label="Telemóvel *"><input name="phone" required className={inputClasses} placeholder="912 345 678" /></Field>
        <Field label="Email"><input name="email" type="email" className={inputClasses} /></Field>
        <Field label="Matrícula *"><input name="plate" required className={inputClasses} placeholder="00-00-AA" /></Field>
        <Field label="Data pretendida *"><input name="date" type="date" required className={inputClasses} /></Field>
        <Field label="Hora pretendida *"><input name="time" type="time" required className={inputClasses} /></Field>
        <Field label="O que precisa?" className="sm:col-span-2">
          <textarea name="description" rows={3} required className={inputClasses} placeholder="Ex.: revisão completa, barulho no motor…" />
        </Field>
      </div>
      {state.message ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{state.message}</p>
      ) : null}
      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
        {pending ? "A enviar…" : "Pedir marcação"}
      </button>
    </form>
  );
}
