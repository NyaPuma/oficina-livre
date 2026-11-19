"use client";

import { BadgeCheck } from "lucide-react";
import { useActionState } from "react";
import { issueCertifiedInvoiceAction } from "@/actions/invoicing";
import { idleState } from "@/lib/action-state";

export function CertifiedInvoiceButton({ invoiceId }: { invoiceId: number }) {
  const [state, action, pending] = useActionState(issueCertifiedInvoiceAction, idleState);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={invoiceId} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        <BadgeCheck size={15} /> {pending ? "A emitir…" : "Emitir fatura certificada"}
      </button>
      {state.message ? <p className={`mt-2 text-xs ${state.status === "error" ? "text-red-600" : "text-emerald-600"}`}>{state.message}</p> : null}
    </form>
  );
}
