"use client";

import { Wrench } from "lucide-react";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { idleState } from "@/lib/action-state";
import { Field, inputClasses } from "@/components/ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, idleState);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid size-12 place-items-center rounded-xl bg-slate-900 text-white">
            <Wrench size={22} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Oficina Livre</h1>
          <p className="mt-1 text-sm text-slate-500">Inicie sessão para continuar</p>
        </div>

        <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <input type="hidden" name="next" value={next} />
          <Field label="Email">
            <input name="email" type="email" autoComplete="username" required className={inputClasses} placeholder="admin@oficinalivre.local" />
          </Field>
          <Field label="Palavra-passe">
            <input name="password" type="password" autoComplete="current-password" required className={inputClasses} />
          </Field>

          {state.message ? (
            <p className={`rounded-lg px-3 py-2 text-sm ${state.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {pending ? "A entrar…" : "Entrar"}
          </button>
          <p className="text-center text-xs text-slate-400">Software livre · licença MIT</p>
        </form>
      </div>
    </main>
  );
}
