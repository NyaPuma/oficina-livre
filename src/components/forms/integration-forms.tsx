"use client";

import { CreditCard, PenLine } from "lucide-react";
import { useActionState } from "react";
import {
  completeDemoSignature,
  createGatewayPayment,
  requestDocumentSignature,
  type PaymentIntentState,
  type SignatureState,
} from "@/actions/integrations";
import { inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function GatewayPaymentForm({ invoiceId, live, balanceCents }: { invoiceId: number; live: boolean; balanceCents: number }) {
  const [state, action, pending] = useActionState<PaymentIntentState, FormData>(createGatewayPayment, idleState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <select name="method" className={inputClasses}>
        <option value="card">Cartão</option>
        <option value="mbway">MB WAY</option>
        <option value="multibanco">Multibanco</option>
      </select>
      <button type="submit" disabled={pending || balanceCents <= 0} className="flex w-full items-center justify-center gap-2 btn-primary hover:bg-slate-700 disabled:opacity-50">
        <CreditCard size={15} /> {pending ? "A iniciar…" : `Pagar ${(balanceCents / 100).toFixed(2)} €`}
      </button>
      {state.message ? <p className={`text-xs ${state.status === "error" ? "text-red-600" : "text-slate-600"}`}>{state.message}</p> : null}
      {state.checkoutUrl ? (
        <a href={state.checkoutUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">
          Abrir página de pagamento ↗
        </a>
      ) : null}
      {state.reference ? <p className="text-xs text-slate-500">Referência: {state.reference}</p> : null}
      {!live ? <p className="text-xs text-amber-600">Gateway não configurado — modo demonstração, sem pagamento real.</p> : null}
    </form>
  );
}

export function SignatureRequestForm({ entity, entityId, email }: { entity: "orcamento" | "fatura"; entityId: number; email?: string | null }) {
  const [state, action, pending] = useActionState<SignatureState, FormData>(requestDocumentSignature, idleState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="entityId" value={entityId} />
      <input name="signerName" placeholder="Nome do signatário" className={inputClasses} />
      <input name="signerEmail" defaultValue={email ?? ""} placeholder="Email do signatário" className={inputClasses} />
      <button type="submit" disabled={pending} className="btn-secondary w-full disabled:opacity-60">
        <PenLine size={15} /> {pending ? "A enviar…" : "Pedir assinatura qualificada"}
      </button>
      {state.message ? <p className={`text-xs ${state.status === "error" ? "text-red-600" : "text-slate-600"}`}>{state.message}</p> : null}
      {state.signingUrl ? (
        <a href={state.signingUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-sm text-slate-600 underline">Abrir página de assinatura ↗</a>
      ) : null}
    </form>
  );
}

export function DemoSignatureCompleteForm({ requestId }: { requestId: number }) {
  return (
    <form action={completeDemoSignature} className="flex items-end gap-2">
      <input type="hidden" name="id" value={requestId} />
      <input name="name" required placeholder="Nome do cliente" className={inputClasses} />
      <button type="submit" className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
        Concluir (demo)
      </button>
    </form>
  );
}
