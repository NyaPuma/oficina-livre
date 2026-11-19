"use client";

import { Receipt } from "lucide-react";
import { useActionState } from "react";
import { type ActionState, idleState } from "@/lib/action-state";

type InvoiceAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function InvoiceButton({ id, action, label }: { id: number; action: InvoiceAction; label: string }) {
  const [state, formAction, pending] = useActionState(action, idleState);
  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
        <Receipt size={15} /> {pending ? "A emitir…" : label}
      </button>
      {state.message ? <p className="mt-1 text-xs text-red-600">{state.message}</p> : null}
    </form>
  );
}
