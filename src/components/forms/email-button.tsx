"use client";

import { Mail } from "lucide-react";
import { useActionState } from "react";
import { sendDocumentByEmail } from "@/actions/mail";
import { idleState } from "@/lib/action-state";

export function EmailButton({
  kind,
  id,
  email,
}: {
  kind: "orcamento" | "ordem";
  id: number;
  email?: string | null;
}) {
  const [state, action, pending] = useActionState(sendDocumentByEmail, idleState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <input name="email" defaultValue={email ?? ""} placeholder="Email do cliente" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <button type="submit" disabled={pending} className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
        <Mail size={15} /> {pending ? "A enviar…" : "Enviar por email"}
      </button>
      {state.message ? (
        <span className={`text-xs ${state.status === "error" ? "text-red-600" : "text-emerald-600"}`}>{state.message}</span>
      ) : null}
    </form>
  );
}
