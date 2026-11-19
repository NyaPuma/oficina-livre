"use client";

import { ShieldAlert } from "lucide-react";
import { useActionState } from "react";
import { checkVehicleSafetyAction, type SafetyState } from "@/actions/knowledge";
import { idleState } from "@/lib/action-state";

export function SafetyCheck({ vehicleId }: { vehicleId: number }) {
  const [state, action, pending] = useActionState<SafetyState, FormData>(checkVehicleSafetyAction, idleState);

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-red-50 text-red-600"><ShieldAlert size={16} /></span>
        <div>
          <h2 className="text-sm font-semibold text-ink">Segurança do veículo</h2>
          <p className="text-xs text-slate-500">Recalls e queixas NHTSA (dados dos EUA)</p>
        </div>
      </div>

      <form action={action} className="mt-4">
        <input type="hidden" name="vehicleId" value={vehicleId} />
        <button type="submit" disabled={pending} className="btn-secondary w-full">
          {pending ? "A consultar…" : "Verificar recalls e queixas"}
        </button>
      </form>

      {state.message ? <p className="mt-2 text-xs text-slate-500">{state.message}</p> : null}
      {state.vehicle ? <p className="mt-1 text-xs font-medium text-ink">{state.vehicle}</p> : null}

      {state.recalls && state.recalls.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="eyebrow text-red-600">Recalls ({state.recalls.length})</p>
          {state.recalls.map((notice) => (
            <details key={notice.id} className="rounded-lg border border-red-100 bg-red-50/50 p-3 text-xs">
              <summary className="cursor-pointer font-medium text-ink">{notice.component} · {notice.id}</summary>
              <p className="mt-2 text-slate-600">{notice.summary}</p>
              {notice.remedy ? <p className="mt-1 text-slate-600"><strong>Remédio:</strong> {notice.remedy}</p> : null}
            </details>
          ))}
        </div>
      ) : state.recalls ? <p className="mt-3 text-xs text-emerald-600">Sem recalls registados.</p> : null}

      {state.complaints && state.complaints.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="eyebrow">Queixas frequentes ({state.complaints.length})</p>
          {state.complaints.slice(0, 4).map((notice) => (
            <div key={notice.id} className="rounded-lg border border-line p-3 text-xs">
              <p className="font-medium text-ink">{notice.component}</p>
              <p className="mt-1 line-clamp-3 text-slate-600">{notice.summary}</p>
              {notice.consequence ? <p className="mt-1 text-red-600">{notice.consequence}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
