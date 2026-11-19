"use client";

import { useActionState } from "react";
import { createUser } from "@/actions/users";
import { Field, inputClasses } from "@/components/ui";
import { idleState } from "@/lib/action-state";

export function UserForm() {
  const [state, action, pending] = useActionState(createUser, idleState);
  return (
    <form action={action} className="space-y-4">
      <Field label="Nome"><input name="name" required className={inputClasses} /></Field>
      <Field label="Email"><input name="email" type="email" required className={inputClasses} /></Field>
      <Field label="Palavra-passe inicial"><input name="password" type="password" minLength={8} required className={inputClasses} /></Field>
      <Field label="Perfil">
        <select name="role" className={inputClasses}>
          <option value="mecanico">Mecânico</option>
          <option value="gestor">Gestor / rececionista</option>
          <option value="admin">Administrador</option>
        </select>
      </Field>
      {state.message ? <p className={`text-sm ${state.status === "error" ? "text-red-600" : "text-emerald-600"}`}>{state.message}</p> : null}
      <button type="submit" disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60">
        {pending ? "A criar…" : "Criar utilizador"}
      </button>
    </form>
  );
}
