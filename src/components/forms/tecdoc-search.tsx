"use client";

import { Search, Download } from "lucide-react";
import { useActionState } from "react";
import { importTecDocPartAction, searchTecDocPartsAction, type TecDocState } from "@/actions/tecdoc";
import { inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function TecDocSearch() {
  const [searchState, searchAction, searching] = useActionState<TecDocState, FormData>(searchTecDocPartsAction, idleState);
  const [importState, importAction, importing] = useActionState(importTecDocPartAction, idleState);

  return (
    <div className="space-y-6">
      <form action={searchAction} className="flex gap-2">
        <input name="query" required minLength={2} placeholder="Referência, descrição ou código OE" className={inputClasses} />
        <button type="submit" disabled={searching} className="btn-primary disabled:opacity-60">
          <Search size={16} /> {searching ? "A pesquisar…" : "Pesquisar"}
        </button>
      </form>

      {searchState.message ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
          {searchState.message}
          {searchState.source ? <span className="ml-2 text-xs uppercase text-slate-400">({searchState.source})</span> : null}
        </p>
      ) : null}

      {searchState.parts && searchState.parts.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Descrição</th><th className="px-4 py-3">Marca</th><th className="px-4 py-3">Preço</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody>
              {searchState.parts.map((part) => (
                <tr key={part.id} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3 font-medium">{part.code}</td>
                  <td className="px-4 py-3">{part.description}{part.oeNumber ? <span className="block text-xs text-slate-400">OE {part.oeNumber}</span> : null}</td>
                  <td className="px-4 py-3">{part.brand}</td>
                  <td className="px-4 py-3">{(part.priceCents / 100).toFixed(2)} €</td>
                  <td className="px-4 py-3 text-right">
                    <form action={importAction}>
                      <input type="hidden" name="code" value={part.code} />
                      <input type="hidden" name="description" value={part.description} />
                      <input type="hidden" name="brand" value={part.brand} />
                      <input type="hidden" name="priceCents" value={part.priceCents} />
                      <input type="hidden" name="vatRateBps" value={part.vatRateBps} />
                      <button type="submit" disabled={importing} className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-60">
                        <Download size={13} /> Importar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {importState.message ? <p className={`text-sm ${importState.status === "error" ? "text-red-600" : "text-emerald-600"}`}>{importState.message}</p> : null}
    </div>
  );
}
