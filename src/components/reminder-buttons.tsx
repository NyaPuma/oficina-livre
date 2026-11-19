"use client";

import { Mail, MessageCircle } from "lucide-react";
import { useActionState } from "react";
import { sendReminderAction } from "@/actions/notifications";
import { whatsappLink } from "@/lib/whatsapp";
import { idleState } from "@/lib/action-state";

export function ReminderButtons({
  phone,
  email,
  message,
  subject,
}: {
  phone?: string | null;
  email?: string | null;
  message: string;
  subject: string;
}) {
  const [state, action, pending] = useActionState(sendReminderAction, idleState);
  const link = whatsappLink(phone, message);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
          <MessageCircle size={13} /> WhatsApp
        </a>
      ) : null}
      {email ? (
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="to" value={email} />
          <input type="hidden" name="subject" value={subject} />
          <input type="hidden" name="text" value={message} />
          <button type="submit" disabled={pending} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60">
            <Mail size={13} /> {pending ? "A enviar…" : "Email"}
          </button>
        </form>
      ) : null}
      {state.message ? <span className="text-xs text-slate-500">{state.message}</span> : null}
    </div>
  );
}
