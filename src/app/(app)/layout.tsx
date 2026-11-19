import { CalendarPlus, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const today = new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={user.name} role={user.role} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-line bg-white/85 px-8 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Área de trabalho</span>
            <ChevronRight size={13} />
            <span className="font-medium text-ink">{today}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/agendar" target="_blank" className="hidden items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-brand/50 hover:text-ink sm:flex">
              <ExternalLink size={14} /> Link de reservas
            </Link>
            <Link href="/agenda/novo" className="flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white transition hover:bg-inksoft">
              <CalendarPlus size={14} /> Nova marcação
            </Link>
          </div>
        </header>
        <main className="min-w-0 px-6 py-7 lg:px-9">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
