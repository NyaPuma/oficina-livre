import Link from "next/link";
import { Monitor } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";
import { BrandMark } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-canvas pb-20">
      <header className="ink-gradient grid-texture sticky top-0 z-20 flex items-center justify-between px-4 py-4 text-white">
        <div className="flex items-center gap-3">
          <BrandMark size="sm" />
          <div>
            <p className="text-sm font-bold leading-tight">Oficina Livre</p>
            <p className="text-[0.65rem] text-slate-400">Modo mecânico · {user.name.split(" ")[0]}</p>
          </div>
        </div>
        <Link href="/" className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10">
          <Monitor size={13} /> Desktop
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">{children}</main>
      <MobileNav />
    </div>
  );
}
