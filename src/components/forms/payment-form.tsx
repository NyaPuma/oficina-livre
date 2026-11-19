"use client";

import { useActionState } from "react";
import { recordPayment } from "@/actions/invoicing";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function PaymentForm({ invoiceId, balanceCents }: { invoiceId: number; balanceCents: number }) {
  const [state, action, pending] = useActionState(recordPayment, idleState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <Field label={`Valor a receber (${(balanceCents / 100).toFixed(2)} €)*`}>
        <input name="amount" required inputMode="decimal" defaultValue={(balanceCents / 100).toFixed(2)} className={inputClasses} />
      </Field>
      <Field label="Método de pagamento">
        <select name="method" className={inputClasses}>
          <option value="multibanco">Multibanco</option>
          <option value="mbway">MB WAY</option>
          <option value="cartao">Cartão</option>
          <option value="transferencia">Transferência</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="outro">Outro</option>
        </select>
      </Field>
      <Field label="Referência">
        <input name="reference" className={inputClasses} />
      </Field>
      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-600" : "text-emerald-600"}`}>{state.message}</p> : null}
      <button type="submit" disabled={pending || balanceCents <= 0} className="btn-primary w-full disabled:opacity-50">
        {pending ? "A registar…" : "Registar pagamento"}
      </button>
    </form>
  );
}
