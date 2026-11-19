"use client";

import { ClipboardList, LayoutDashboard, Monitor } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/movel", label: "Início", icon: LayoutDashboard },
  { href: "/movel/ordens", label: "Ordens", icon: ClipboardList },
  { href: "/", label: "Completo", icon: Monitor },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex border-t border-line bg-white/95 backdrop-blur-md">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/movel" ? pathname === "/movel" : pathname.startsWith(href) && href !== "/";
        const desktopActive = href === "/" && pathname === "/";
        const selected = active || desktopActive;
        return (
          <Link key={href} href={href} className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-[0.68rem] font-medium transition ${selected ? "text-brandstrong" : "text-slate-400"}`}>
            {selected ? <span className="absolute top-0 h-0.5 w-10 rounded-full bg-brand" /> : null}
            <Icon size={19} strokeWidth={selected ? 2.3 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
