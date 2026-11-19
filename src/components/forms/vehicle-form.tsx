"use client";

import { useActionState } from "react";
import { createVehicle } from "@/actions/customers";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function VehicleForm({ customerId }: { customerId: number }) {
  const [state, action, pending] = useActionState(createVehicle, idleState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Matrícula *">
          <input name="plate" required className={inputClasses} placeholder="00-00-AA" />
        </Field>
        <Field label="VIN">
          <input name="vin" className={inputClasses} />
        </Field>
        <Field label="Marca">
          <input name="brand" className={inputClasses} />
        </Field>
        <Field label="Modelo">
          <input name="model" className={inputClasses} />
        </Field>
        <Field label="Ano">
          <input name="year" type="number" min={1900} max={2100} className={inputClasses} />
        </Field>
        <Field label="Combustível">
          <input name="fuel" className={inputClasses} placeholder="Diesel, Gasolina, Elétrico…" />
        </Field>
        <Field label="Quilómetros" className="sm:col-span-2">
          <input name="mileage" type="number" min={0} defaultValue={0} className={inputClasses} />
        </Field>
      </div>
      {state.message ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
        {pending ? "A adicionar…" : "Adicionar viatura"}
      </button>
    </form>
  );
}
