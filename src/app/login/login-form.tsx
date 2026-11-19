"use client";

import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, idleState);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <p className="eyebrow flex items-center gap-2"><span className="h-px w-5 bg-brand" /> Acesso à oficina</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Iniciar sessão</h1>
        <p className="mt-2 text-sm text-slate-500">Introduza as suas credenciais para continuar.</p>
      </div>

      <form action={action} className="panel space-y-5 p-7">
        <input type="hidden" name="next" value={next} />

        <Field label="Email">
          <div className="relative">
            <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="email" type="email" autoComplete="username" required className={`${inputClasses} pl-9`} placeholder="admin@oficinalivre.local" />
          </div>
        </Field>
        <Field label="Palavra-passe">
          <div className="relative">
            <LockKeyhole size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="password" type="password" autoComplete="current-password" required className={`${inputClasses} pl-9`} placeholder="••••••••" />
          </div>
        </Field>

        {state.message ? (
          <p className={`rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {state.message}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="btn-primary btn-accent w-full">
          {pending ? "A entrar…" : "Entrar na oficina"}
          {!pending ? <ArrowRight size={15} /> : null}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">Oficina Livre · software livre sob licença MIT</p>
    </div>
  );
}
