"use client";

import { useActionState } from "react";
import { approveQuotePublic } from "@/actions/approval";
import { inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function ApprovalForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(approveQuotePublic, idleState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo *</span>
        <input name="name" required minLength={2} className={inputClasses} placeholder="O seu nome" />
      </label>
      <p className="text-xs text-slate-500">Ao aprovar, regista digitalmente a aceitação do orçamento.</p>
      {state.message ? (
        <p className={`rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{state.message}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
        {pending ? "A aprovar…" : "Aprovar orçamento"}
      </button>
    </form>
  );
}
