"use client";

import { useActionState, useMemo, useState } from "react";
import { createQuote } from "@/actions/documents";
import { createWorkOrder } from "@/actions/work-orders";
import { LineItemsEditor, type LineItemOption } from "@/components/forms/line-items-editor";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

type CustomerOption = { id: number; name: string };
type VehicleOption = { id: number; customerId: number; plate: string; label: string };
type UserOption = { id: number; name: string };
type QuoteOption = { id: number; number: string; customerId: number };

const checklistItems = [
  { key: "niveis", label: "Níveis (óleo, água, travões)" },
  { key: "pneus", label: "Pneus e pressões" },
  { key: "luzes", label: "Luzes e sinalização" },
  { key: "objetos", label: "Objetos pessoais / documentos" },
  { key: "dados", label: "Dados e fotos registados" },
];

export function DocumentForm({
  mode,
  customers,
  vehicles,
  options,
  users = [],
  quotes = [],
  initialQuoteId,
  initialQuoteCustomerId,
}: {
  mode: "quote" | "order";
  customers: CustomerOption[];
  vehicles: VehicleOption[];
  options: LineItemOption[];
  users?: UserOption[];
  quotes?: QuoteOption[];
  initialQuoteId?: number;
  initialQuoteCustomerId?: number;
}) {
  const [customerId, setCustomerId] = useState(initialQuoteCustomerId ? String(initialQuoteCustomerId) : "");
  const [state, quoteAction, quotePending] = useActionState(createQuote, idleState);
  const [orderState, orderAction, orderPending] = useActionState(createWorkOrder, idleState);
  const action = mode === "quote" ? quoteAction : orderAction;
  const pending = mode === "quote" ? quotePending : orderPending;
  const message = mode === "quote" ? state.message : orderState.message;
  const failed = mode === "quote" ? state.status === "error" : orderState.status === "error";

  const filteredVehicles = useMemo(
    () => (customerId ? vehicles.filter((v) => v.customerId === Number(customerId)) : []),
    [customerId, vehicles],
  );
  const filteredQuotes = useMemo(
    () => (customerId ? quotes.filter((q) => q.customerId === Number(customerId)) : []),
    [customerId, quotes],
  );

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cliente *">
          <select name="customerId" required value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClasses}>
            <option value="">Selecionar cliente…</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </Field>
        <Field label="Viatura *">
          <select name="vehicleId" required disabled={!customerId} className={inputClasses}>
            <option value="">{customerId ? "Selecionar viatura…" : "Escolha primeiro o cliente"}</option>
            {filteredVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.label}</option>)}
          </select>
        </Field>

        {mode === "quote" ? (
          <>
            <Field label="Válido até">
              <input name="validUntil" type="date" className={inputClasses} />
            </Field>
            <Field label="Observações">
              <input name="notes" className={inputClasses} />
            </Field>
          </>
        ) : (
          <>
            <Field label="Orçamento de origem">
              <select name="quoteId" defaultValue={initialQuoteId ?? ""} className={inputClasses} disabled={!customerId}>
                <option value="">Nenhum</option>
                {filteredQuotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.number}</option>)}
              </select>
            </Field>
            <Field label="Mecânico responsável">
              <select name="assigneeId" className={inputClasses}>
                <option value="">Não atribuído</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
            </Field>
            <Field label="Quilómetros">
              <input name="odometer" type="number" min={0} className={inputClasses} />
            </Field>
            <Field label="Queixa do cliente">
              <input name="complaint" className={inputClasses} />
            </Field>
            <Field label="Diagnóstico" className="sm:col-span-2">
              <textarea name="diagnosis" rows={3} className={inputClasses} />
            </Field>
          </>
        )}
      </div>

      {mode === "order" ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Checklist de receção</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {checklistItems.map((item) => (
              <label key={item.key} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name={`check_${item.key}`} className="size-4 accent-slate-900" />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Serviços e peças</h3>
        <LineItemsEditor options={options} />
      </div>

      {message ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${failed ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message}</p>
      ) : null}

      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
        {pending ? "A guardar…" : mode === "quote" ? "Criar orçamento" : "Criar ordem de serviço"}
      </button>
    </form>
  );
}
