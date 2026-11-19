"use client";

import { ScanBarcode, Search } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { createVehicle } from "@/actions/customers";
import { decodeVinAction, type VinState } from "@/actions/external";
import { lookupPlateAction, type LookupState } from "@/actions/vehicles";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function VehicleForm({ customerId }: { customerId: number }) {
  const [state, action, pending] = useActionState(createVehicle, idleState);
  const [lookupState, lookupAction, lookupPending] = useActionState<LookupState, FormData>(lookupPlateAction, idleState);
  const [vinState, vinAction, vinPending] = useActionState<VinState, FormData>(decodeVinAction, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const data = lookupState.data;
    if (!data || !formRef.current) return;
    const form = formRef.current;
    const set = (name: string, value?: string | number | null) => {
      const field = form.elements.namedItem(name) as HTMLInputElement | null;
      if (field && value !== undefined && value !== null) field.value = String(value);
    };
    set("plate", data.plate);
    set("brand", data.brand);
    set("model", data.model);
    set("year", data.year);
  }, [lookupState]);

  useEffect(() => {
    const data = vinState.result;
    if (!data || !formRef.current) return;
    const form = formRef.current;
    const set = (name: string, value?: string | number | null) => {
      const field = form.elements.namedItem(name) as HTMLInputElement | null;
      if (field && value !== undefined && value !== null) field.value = String(value);
    };
    set("vin", data.vin);
    set("brand", data.brand);
    set("model", data.model);
    set("year", data.year);
  }, [vinState]);

  return (
    <div className="space-y-4">
      <form action={lookupAction} className="flex items-end gap-2 rounded-lg bg-slate-50 p-3">
        <label className="flex-1 text-sm text-slate-700">
          Consultar matrícula
          <input name="plate" required className={`${inputClasses} mt-1`} placeholder="00-00-AA" />
        </label>
        <button type="submit" disabled={lookupPending} className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60">
          <Search size={15} /> {lookupPending ? "A consultar…" : "Consultar"}
        </button>
      </form>
      {lookupState.message ? <p className="text-xs text-slate-500">{lookupState.message}</p> : null}

      <form ref={formRef} action={action} className="space-y-4">
        <input type="hidden" name="customerId" value={customerId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Matrícula *">
            <input name="plate" required className={inputClasses} placeholder="00-00-AA" />
          </Field>
          <Field label="VIN">
            <div className="flex gap-2">
              <input name="vin" className={inputClasses} />
              <button type="submit" formAction={vinAction} formNoValidate disabled={vinPending} className="btn-secondary shrink-0" title="Decodificar VIN (NHTSA)">
                <ScanBarcode size={15} />
              </button>
            </div>
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
        {vinState.message ? <p className="text-xs text-slate-500">{vinState.message}</p> : null}
        {state.message ? (
          <p className={`rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {state.message}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className="btn-secondary">
          {pending ? "A adicionar…" : "Adicionar viatura"}
        </button>
      </form>
    </div>
  );
}
