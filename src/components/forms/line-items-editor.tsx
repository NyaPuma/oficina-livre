"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { inputClasses } from "@/components/ui";

export type LineItemOption = {
  id: number;
  kind: "part" | "service";
  description: string;
  priceCents: number;
  vatRateBps: number;
};

type Row = {
  key: number;
  kind: "part" | "service" | "manual";
  itemId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  discount: string;
};

let nextKey = 1;

function emptyRow(): Row {
  return {
    key: nextKey++,
    kind: "service",
    itemId: "",
    description: "",
    quantity: "1",
    unitPrice: "0",
    vatRate: "13",
    discount: "0",
  };
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function LineItemsEditor({ options }: { options: LineItemOption[] }) {
  const [rows, setRows] = useState<Row[]>(() => [emptyRow()]);

  const optionsByKind = useMemo(
    () => ({
      part: options.filter((o) => o.kind === "part"),
      service: options.filter((o) => o.kind === "service"),
    }),
    [options],
  );

  function update(key: number, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function selectItem(row: Row, itemId: string) {
    const item = options.find((o) => o.id === Number(itemId) && o.kind === row.kind);
    if (!item) return;
    update(row.key, {
      itemId,
      description: item.description,
      unitPrice: centsToInput(item.priceCents),
      vatRate: String(item.vatRateBps / 100),
    });
  }

  const serialized = rows
    .filter((row) => row.description.trim())
    .map((row) => ({
      kind: row.kind,
      itemId: row.itemId || undefined,
      description: row.description,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      vatRate: row.vatRate,
      discount: row.discount,
    }));

  return (
    <div>
      <input type="hidden" name="lines" value={JSON.stringify(serialized)} />
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="grid gap-2 sm:grid-cols-12">
              <select
                value={row.kind}
                onChange={(e) => {
                  const kind = e.target.value as Row["kind"];
                  update(row.key, { kind, itemId: "", description: "", vatRate: kind === "part" ? "23" : "13" });
                }}
                className={`${inputClasses} sm:col-span-2`}
                aria-label="Tipo de linha"
              >
                <option value="service">Serviço</option>
                <option value="part">Peça</option>
                <option value="manual">Manual</option>
              </select>

              {row.kind !== "manual" ? (
                <select
                  value={row.itemId}
                  onChange={(e) => selectItem(row, e.target.value)}
                  className={`${inputClasses} sm:col-span-3`}
                  aria-label="Item"
                >
                  <option value="">Selecionar…</option>
                  {optionsByKind[row.kind].map((option) => (
                    <option key={option.id} value={option.id}>{option.description}</option>
                  ))}
                </select>
              ) : null}

              <input
                value={row.description}
                onChange={(e) => update(row.key, { description: e.target.value })}
                placeholder="Descrição"
                className={`${inputClasses} ${row.kind === "manual" ? "sm:col-span-5" : "sm:col-span-2"}`}
              />
              <input value={row.quantity} onChange={(e) => update(row.key, { quantity: e.target.value })} type="number" min={1} className={`${inputClasses} sm:col-span-1`} aria-label="Quantidade" />
              <input value={row.unitPrice} onChange={(e) => update(row.key, { unitPrice: e.target.value })} inputMode="decimal" className={`${inputClasses} sm:col-span-1`} aria-label="Preço unitário" />
              <input value={row.vatRate} onChange={(e) => update(row.key, { vatRate: e.target.value })} type="number" min={0} max={100} className={`${inputClasses} sm:col-span-1`} aria-label="IVA percentagem" />
              <button
                type="button"
                onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                className="grid size-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Remover linha"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setRows((current) => [...current, emptyRow()])}
        className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:border-slate-500 hover:text-slate-900"
      >
        <Plus size={16} /> Adicionar linha
      </button>
    </div>
  );
}
