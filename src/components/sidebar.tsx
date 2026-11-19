"use client";

import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  ScrollText,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";

const links = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/clientes", label: "Clientes e viaturas", icon: Users },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/ordens", label: "Ordens de serviço", icon: Wrench },
  { href: "/stock", label: "Stock e peças", icon: Package },
  { href: "/faturacao", label: "Faturação", icon: Receipt },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/utilizadores", label: "Utilizadores", icon: ClipboardList },
  { href: "/auditoria", label: "Auditoria", icon: ScrollText },
];

export function Sidebar({
  userName,
  role,
}: {
  userName: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <div className="grid size-9 place-items-center rounded-lg bg-slate-900 text-white">
          <Wrench size={18} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">Oficina Livre</p>
          <p className="text-xs text-slate-500">Gestão de oficina</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-slate-900 font-medium text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <p className="truncate text-sm font-medium text-slate-800">{userName}</p>
        <p className="text-xs capitalize text-slate-500">{role}</p>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut size={16} /> Terminar sessão
          </button>
        </form>
      </div>
    </aside>
  );
}
