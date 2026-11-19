import Link from "next/link";
import { ClipboardList, LayoutDashboard, Monitor } from "lucide-react";
import { requireUser } from "@/lib/auth";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Oficina Livre</p>
          <p className="text-xs text-slate-500">Modo mecânico · {user.name}</p>
        </div>
        <Link href="/" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600">
          Desktop
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-slate-200 bg-white">
        <Link href="/movel" className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-slate-600">
          <LayoutDashboard size={20} /> Início
        </Link>
        <Link href="/movel/ordens" className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-slate-600">
          <ClipboardList size={20} /> Ordens
        </Link>
        <Link href="/" className="flex flex-1 flex-col items-center gap-1 py-3 text-xs text-slate-600">
          <Monitor size={20} /> Completo
        </Link>
      </nav>
    </div>
  );
}
