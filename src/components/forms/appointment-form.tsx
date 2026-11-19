"use client";

import { useActionState, useState } from "react";
import { createAppointment } from "@/actions/appointments";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

type CustomerOption = { id: number; name: string };
type VehicleOption = { id: number; customerId: number; plate: string; label: string };
type UserOption = { id: number; name: string };
type SiteOption = { id: number; name: string };

export function AppointmentForm({
  customers,
  vehicles,
  users,
  sites = [],
}: {
  customers: CustomerOption[];
  vehicles: VehicleOption[];
  users: UserOption[];
  sites?: SiteOption[];
}) {
  const [customerId, setCustomerId] = useState("");
  const [state, action, pending] = useActionState(createAppointment, idleState);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cliente *">
          <select name="customerId" required value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClasses}>
            <option value="">Selecionar…</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </Field>
        <Field label="Viatura *">
          <select name="vehicleId" required disabled={!customerId} className={inputClasses}>
            <option value="">{customerId ? "Selecionar…" : "Escolha o cliente"}</option>
            {vehicles.filter((v) => v.customerId === Number(customerId)).map((v) => (
              <option key={v.id} value={v.id}>{v.plate} · {v.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Data e hora *">
          <input name="startsAt" type="datetime-local" required className={inputClasses} />
        </Field>
        <Field label="Duração (minutos)">
          <input name="durationMinutes" type="number" min={15} max={480} step={15} defaultValue={60} className={inputClasses} />
        </Field>
        <Field label="Rampa">
          <input name="ramp" className={inputClasses} placeholder="Rampa 1" />
        </Field>
        <Field label="Localização">
          <select name="siteId" className={inputClasses}>
            <option value="">Sem localização</option>
            {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
          </select>
        </Field>
        <Field label="Mecânico">
          <select name="technicianId" className={inputClasses}>
            <option value="">Não atribuído</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
        </Field>
        <Field label="Observações" className="sm:col-span-2">
          <textarea name="notes" rows={3} className={inputClasses} />
        </Field>
      </div>
      {state.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
        {pending ? "A guardar…" : "Marcar"}
      </button>
    </form>
  );
}
