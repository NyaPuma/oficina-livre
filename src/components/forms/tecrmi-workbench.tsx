"use client";

import { useState } from "react";
import { TecRmiPanel } from "@/components/forms/tecrmi-panel";
import { Card, inputClasses } from "@/components/ui";

export function TecRmiWorkbench({
  vehicles,
}: {
  vehicles: Array<{ id: number; label: string; mileage: number }>;
}) {
  const [selected, setSelected] = useState(vehicles[0]?.id ?? 0);
  const vehicle = vehicles.find((item) => item.id === selected);

  if (vehicles.length === 0) {
    return <Card className="p-6 text-sm text-slate-500">Ainda não existem viaturas registadas.</Card>;
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <label className="block">
          <span className="eyebrow mb-2 block normal-case tracking-normal">Viatura</span>
          <select value={selected} onChange={(e) => setSelected(Number(e.target.value))} className={inputClasses}>
            {vehicles.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </Card>
      <Card className="p-6">
        <TecRmiPanel vehicleId={selected} mileage={vehicle?.mileage ?? 0} />
      </Card>
    </div>
  );
}
