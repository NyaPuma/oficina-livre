"use client";

import { MapPin, ShieldCheck } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { createCustomer } from "@/actions/customers";
import {
  geocodeAction,
  validateNifAction,
  type GeocodeState,
  type NifState,
} from "@/actions/external";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function CustomerForm() {
  const [state, action, pending] = useActionState(createCustomer, idleState);
  const [nifState, nifAction, nifPending] = useActionState<NifState, FormData>(validateNifAction, idleState);
  const [geoState, geoAction, geoPending] = useActionState<GeocodeState, FormData>(geocodeAction, idleState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const address = geoState.result;
    if (!address || !formRef.current) return;
    const form = formRef.current;
    const set = (name: string, value?: string | null) => {
      const field = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
      if (field && value) field.value = value;
    };
    set("address", address.address);
    set("postalCode", address.postalCode);
    set("city", address.city);
  }, [geoState]);

  return (
    <div className="space-y-5">
      <form action={geoAction} className="flex flex-wrap items-end gap-2 rounded-xl border border-line bg-slate-50 p-4">
        <label className="flex-1 text-sm text-slate-700">
          Pesquisar morada (OpenStreetMap)
          <input name="query" required className={`${inputClasses} mt-1`} placeholder="Rua das Flores 10, Porto" />
        </label>
        <button type="submit" disabled={geoPending} className="btn-secondary">
          <MapPin size={14} /> {geoPending ? "A procurar…" : "Pesquisar"}
        </button>
      </form>
      {geoState.message ? <p className="text-xs text-slate-500">{geoState.message} © OpenStreetMap contributors</p> : null}

      <form ref={formRef} action={action} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome *" className="sm:col-span-2">
            <input name="name" required minLength={2} className={inputClasses} />
          </Field>
          <div>
            <span className="eyebrow mb-2 block normal-case tracking-normal text-slate-600">NIF</span>
            <div className="flex gap-2">
              <input name="nif" inputMode="numeric" maxLength={9} className={inputClasses} />
              <button type="submit" formAction={nifAction} formNoValidate disabled={nifPending} className="btn-secondary shrink-0" title="Validar NIF">
                <ShieldCheck size={15} />
              </button>
            </div>
          </div>
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

        {nifState.message ? (
          <p className={`text-xs ${nifState.status === "error" ? "text-red-600" : "text-emerald-600"}`}>{nifState.message}</p>
        ) : null}
        {nifState.result?.name ? <p className="text-xs text-slate-500">{nifState.result.name}</p> : null}

        <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          <input name="consent" type="checkbox" className="mt-0.5 size-4 accent-slate-900" defaultChecked />
          <span>O cliente foi informado do tratamento dos seus dados pessoais e deu consentimento (RGPD).</span>
        </label>

        {state.message ? (
          <p className={`rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {state.message}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="btn-primary">Guardar cliente</button>
      </form>
    </div>
  );
}
