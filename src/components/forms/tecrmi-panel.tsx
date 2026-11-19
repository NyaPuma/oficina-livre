"use client";

import { Clock3, Gauge, Wrench } from "lucide-react";
import { useActionState, useState } from "react";
import {
  getServiceScheduleAction,
  getTechDataAction,
  lookupRepairTimeAction,
  type TecRmiState,
} from "@/actions/tecrmi";
import { inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";
import type { RepairTime, ServiceItem, VehicleTechData } from "@/lib/tecrmi";

const label: Record<string, string> = { tecrmi: "TecRMI", local: "Demonstração" };

export function TecRmiPanel({
  vehicleId,
  mileage = 0,
  compact = false,
}: {
  vehicleId: number;
  mileage?: number;
  compact?: boolean;
}) {
  const [operation, setOperation] = useState("Troca de óleo e filtro");
  const [timeState, timeAction, timePending] = useActionState<TecRmiState<RepairTime | null>, FormData>(lookupRepairTimeAction, idleState);
  const [techState, techAction, techPending] = useActionState<TecRmiState<VehicleTechData>, FormData>(getTechDataAction, idleState);
  const [scheduleState, scheduleAction, schedulePending] = useActionState<TecRmiState<ServiceItem[]>, FormData>(getServiceScheduleAction, idleState);

  return (
    <div className="space-y-4">
      <form action={timeAction} className="flex items-end gap-2">
        <label className="flex-1 text-sm text-slate-700">
          Tempo de reparação
          <input value={operation} onChange={(e) => setOperation(e.target.value)} className={`${inputClasses} mt-1`} placeholder="Ex.: pastilhas de travão" />
        </label>
        <input type="hidden" name="vehicleId" value={vehicleId} />
        <input type="hidden" name="operation" value={operation} />
        <button type="submit" disabled={timePending} className="btn-secondary shrink-0">
          <Clock3 size={14} /> {timePending ? "…" : "Calcular"}
        </button>
      </form>
      {timeState.data ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink">{timeState.data.operation}</span>
            <strong className="text-brandstrong">{timeState.data.hours.toFixed(2)} h</strong>
          </div>
          {timeState.data.note ? <p className="mt-1 text-xs text-slate-600">{timeState.data.note}</p> : null}
          <p className="mt-2 text-[0.68rem] text-slate-500">Fonte: {label[timeState.source ?? "local"]}</p>
        </div>
      ) : null}
      {timeState.message ? <p className="text-xs text-slate-500">{timeState.message}</p> : null}

      {!compact ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <form action={techAction}>
              <input type="hidden" name="vehicleId" value={vehicleId} />
              <button type="submit" disabled={techPending} className="btn-secondary w-full">
                <Gauge size={14} /> Dados técnicos
              </button>
            </form>
            <form action={scheduleAction}>
              <input type="hidden" name="vehicleId" value={vehicleId} />
              <input type="hidden" name="mileage" value={mileage} />
              <button type="submit" disabled={schedulePending} className="btn-secondary w-full">
                <Wrench size={14} /> Plano de manutenção
              </button>
            </form>
          </div>

          {techState.data ? (
            <div className="rounded-lg border border-line p-3 text-xs">
              <p className="eyebrow mb-2">Dados técnicos · {label[techState.source ?? "local"]}</p>
              <dl className="grid grid-cols-2 gap-2 text-slate-600">
                <div><dt className="text-slate-400">Óleo motor</dt><dd>{techState.data.engineOilLitres ?? "—"} L · {techState.data.oilSpecification ?? "—"}</dd></div>
                <div><dt className="text-slate-400">Líquido de arrefecimento</dt><dd>{techState.data.coolantLitres ?? "—"} L</dd></div>
                <div><dt className="text-slate-400">Pressão pneus (fr)</dt><dd>{techState.data.tyrePressureFrontBar ?? "—"} bar</dd></div>
                <div><dt className="text-slate-400">Pressão pneus (tr)</dt><dd>{techState.data.tyrePressureRearBar ?? "—"} bar</dd></div>
              </dl>
            </div>
          ) : null}

          {scheduleState.data && scheduleState.data.length > 0 ? (
            <div className="rounded-lg border border-line p-3 text-xs">
              <p className="eyebrow mb-2">Plano de manutenção · {label[scheduleState.source ?? "local"]}</p>
              <ul className="divide-y divide-line">
                {scheduleState.data.map((item) => (
                  <li key={item.operation} className="flex justify-between gap-3 py-2">
                    <span className="text-slate-700">{item.operation}</span>
                    <span className="text-slate-500">{item.intervalKm ? `${item.intervalKm.toLocaleString("pt-PT")} km` : "—"}{item.intervalMonths ? ` / ${item.intervalMonths} meses` : ""}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
