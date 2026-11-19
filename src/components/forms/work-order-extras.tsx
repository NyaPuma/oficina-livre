"use client";

import { useActionState } from "react";
import { addWorkOrderPhoto, addWorkOrderLine } from "@/actions/work-orders";
import { LineItemsEditor, type LineItemOption } from "@/components/forms/line-items-editor";
import { idleState } from "@/lib/action-state";

export function AddLineForm({ workOrderId, options }: { workOrderId: number; options: LineItemOption[] }) {
  const [state, action, pending] = useActionState(addWorkOrderLine, idleState);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={workOrderId} />
      <LineItemsEditor options={options} />
      {state.message ? (
        <p className={`text-sm ${state.status === "error" ? "text-red-600" : "text-emerald-600"}`}>{state.message}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-secondary disabled:opacity-60">
        {pending ? "A guardar…" : "Adicionar à ordem"}
      </button>
    </form>
  );
}

export function PhotoForm({ workOrderId }: { workOrderId: number }) {
  return (
    <form action={addWorkOrderPhoto} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="workOrderId" value={workOrderId} />
      <label className="text-sm text-slate-700">
        Foto
        <input name="photo" type="file" accept="image/*" required className="mt-1 block text-sm" />
      </label>
      <label className="text-sm text-slate-700">
        Fase
        <select name="phase" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="entrada">Entrada</option>
          <option value="diagnostico">Diagnóstico</option>
          <option value="final">Final</option>
        </select>
      </label>
      <label className="flex-1 text-sm text-slate-700">
        Descrição
        <input name="caption" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <button type="submit" className="btn-secondary">
        Anexar
      </button>
    </form>
  );
}
