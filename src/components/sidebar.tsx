"use client";

import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Database,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Receipt,
  ScrollText,
  Smartphone,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { BrandMark } from "@/components/ui";

type NavLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
};

const groups: Array<{ label: string; links: NavLink[] }> = [
  {
    label: "Operação",
    links: [
      { href: "/", label: "Painel", icon: LayoutDashboard },
      { href: "/agenda", label: "Agenda", icon: CalendarDays, roles: ["admin", "gestor"] },
      { href: "/clientes", label: "Clientes e viaturas", icon: Users },
      { href: "/orcamentos", label: "Orçamentos", icon: FileText, roles: ["admin", "gestor"] },
      { href: "/ordens", label: "Ordens de serviço", icon: Wrench },
      { href: "/stock", label: "Stock e peças", icon: Package },
      { href: "/tecdoc", label: "TecDoc", icon: Database, roles: ["admin", "gestor"] },
    ],
  },
  {
    label: "Gestão",
    links: [
      { href: "/faturacao", label: "Faturação", icon: Receipt, roles: ["admin", "gestor"] },
      { href: "/financeiro", label: "Financeiro", icon: Wallet, roles: ["admin"] },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3, roles: ["admin", "gestor"] },
      { href: "/locais", label: "Localizações", icon: MapPin, roles: ["admin"] },
    ],
  },
  {
    label: "Sistema",
    links: [
      { href: "/movel", label: "Modo mecânico", icon: Smartphone },
      { href: "/utilizadores", label: "Utilizadores", icon: ClipboardList, roles: ["admin"] },
      { href: "/auditoria", label: "Auditoria", icon: ScrollText, roles: ["admin"] },
    ],
  },
];

const roleLabel: Record<string, string> = {
  admin: "Administrador",
  gestor: "Gestor",
  mecanico: "Mecânico",
};

export function Sidebar({ userName, role }: { userName: string; role: string }) {
  const pathname = usePathname();
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="ink-gradient diagonal-texture sticky top-0 flex h-screen w-[16.5rem] shrink-0 flex-col border-r border-white/5 text-white">
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-5">
        <BrandMark />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">Oficina Livre</p>
          <p className="text-[0.68rem] text-slate-400">gestão automóvel</p>
        </div>
      </div>

      <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-white/8 bg-white/5 px-3 py-2">
        <span className="live-dot" />
        <span className="text-[0.7rem] text-slate-300">Oficina operacional</span>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {groups.map((group) => {
          const visible = group.links.filter((link) => !link.roles || link.roles.includes(role));
          if (visible.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="eyebrow mb-2 px-3 text-slate-500">{group.label}</p>
              <div className="space-y-0.5">
                {visible.map(({ href, label, icon: Icon }) => {
                  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link key={href} href={href} className={`nav-link ${active ? "nav-link-active" : ""}`}>
                      <Icon size={16} strokeWidth={1.9} />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/8 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/15 text-xs font-bold text-brand">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{userName}</p>
            <p className="text-[0.68rem] text-slate-400">{roleLabel[role] ?? role}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" title="Terminar sessão" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white">
              <LogOut size={15} />
            </button>
          </form>
        </div>
        <p className="mt-3 text-center text-[0.62rem] text-slate-600">software livre · licença MIT</p>
      </div>
    </aside>
  );
}
