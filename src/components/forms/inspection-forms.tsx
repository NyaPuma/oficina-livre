"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { acknowledgeInspectionPublic, addInspectionPhoto, createInspection } from "@/actions/inspections";
import { inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

type Item = { label: string; condition: "ok" | "atencao" | "falha"; notes: string };

const defaultItems: Item[] = [
  { label: "Pneus e pressões", condition: "ok", notes: "" },
  { label: "Travões", condition: "ok", notes: "" },
  { label: "Níveis e fluidos", condition: "ok", notes: "" },
  { label: "Luzes e sinalização", condition: "ok", notes: "" },
  { label: "Suspensão e direção", condition: "ok", notes: "" },
];

export function InspectionEditor({ workOrderId }: { workOrderId: number }) {
  const [items, setItems] = useState<Item[]>(defaultItems);
  const [state, action, pending] = useActionState(createInspection, idleState);

  function update(index: number, patch: Partial<Item>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <input type="hidden" name="items" value={JSON.stringify(items.filter((i) => i.label.trim()))} />
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-12">
            <input
              value={item.label}
              onChange={(e) => update(index, { label: e.target.value })}
              className={`${inputClasses} sm:col-span-5`}
              aria-label="Item inspecionado"
            />
            <select
              value={item.condition}
              onChange={(e) => update(index, { condition: e.target.value as Item["condition"] })}
              className={`${inputClasses} sm:col-span-3`}
              aria-label="Estado"
            >
              <option value="ok">OK</option>
              <option value="atencao">Atenção</option>
              <option value="falha">Falha</option>
            </select>
            <input
              value={item.notes}
              onChange={(e) => update(index, { notes: e.target.value })}
              className={`${inputClasses} sm:col-span-3`}
              placeholder="Observações"
            />
            <button type="button" onClick={() => setItems((current) => current.filter((_, i) => i !== index))} className="grid size-9 place-items-center text-slate-400 hover:text-red-600" aria-label="Remover">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setItems((current) => [...current, { label: "", condition: "ok", notes: "" }])} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <Plus size={16} /> Adicionar item
      </button>
      <Field label="Notas gerais">
        <textarea name="notes" rows={3} className={inputClasses} />
      </Field>
      {state.message ? <p className="text-sm text-red-600">{state.message}</p> : null}
      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
        {pending ? "A criar…" : "Criar diagnóstico digital"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

export function AcknowledgeForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acknowledgeInspectionPublic, idleState);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Nome de quem confirma *</span>
        <input name="name" required minLength={2} className={inputClasses} />
      </label>
      {state.message ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{state.message}</p>
      ) : null}
      <button type="submit" disabled={pending} className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
        {pending ? "A confirmar…" : "Confirmar receção do diagnóstico"}
      </button>
    </form>
  );
}

export function InspectionPhotoForm({ inspectionId, itemId, itemLabel }: { inspectionId: number; itemId: number; itemLabel: string }) {
  return (
    <form action={addInspectionPhoto} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="inspectionItemId" value={itemId} />
      <input type="hidden" name="inspectionId" value={inspectionId} />
      <label className="text-xs text-slate-600">
        Foto · {itemLabel}
        <input name="photo" type="file" accept="image/*" required className="mt-1 block text-xs" />
      </label>
      <button type="submit" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">Anexar</button>
    </form>
  );
}
