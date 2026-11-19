import { ArrowUpRight, Inbox } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Marca da aplicação: chave-inglesa âmbar sobre fundo escuro. */
export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-10";
  return (
    <span className={`brand-mark brand-gradient ${dimensions} shrink-0`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={size === "lg" ? "size-7" : "size-5"}>
        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5 2-2Z" />
        <path d="m17 3 4 4-2.5 2.5-4-4L17 3Z" />
      </svg>
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  eyebrow?: string;
}) {
  return (
    <header className="rise-in mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="eyebrow mb-1.5 flex items-center gap-2">
          <span className="inline-block h-px w-5 bg-brand" />
          {eyebrow ?? "Oficina Livre"}
        </p>
        <h1 className="text-[1.7rem] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1.5 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="btn-primary btn-accent">
          {action.label}
          <ArrowUpRight size={15} />
        </Link>
      ) : null}
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`panel rise-in ${className}`}>{children}</section>;
}

export function PanelTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "ink",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "ink" | "brand" | "amber" | "green" | "blue";
}) {
  const iconTones: Record<string, string> = {
    ink: "bg-slate-100 text-ink",
    brand: "bg-amber-50 text-brandstrong",
    amber: "bg-amber-50 text-brandstrong",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <Card className="panel-hover group relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow leading-relaxed">{label}</p>
        {icon ? (
          <span className={`grid size-9 place-items-center rounded-xl transition-transform group-hover:scale-105 ${iconTones[tone] ?? iconTones.ink}`}>
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[1.75rem] font-semibold leading-none tracking-tight text-ink tabular-nums">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
      <span className="pointer-events-none absolute -bottom-8 -right-8 size-24 rounded-full bg-brand/5 blur-xl transition group-hover:bg-brand/10" />
    </Card>
  );
}

export function Badge({ children, tone = "slate", dot = false }: { children: ReactNode; tone?: string; dot?: boolean }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };
  const dotTones: Record<string, string> = {
    slate: "bg-slate-400",
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${tones[tone] ?? tones.slate}`}>
      {dot ? <span className={`size-1.5 rounded-full ${dotTones[tone] ?? dotTones.slate}`} /> : null}
      {children}
    </span>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        {icon ?? <Inbox size={20} />}
      </span>
      <p className="font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

export function TableWrapper({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export const tableClasses = {
  th: "table-head px-4 py-3 text-left text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-500",
  td: "px-4 py-3 text-sm text-slate-700",
  row: "table-row",
};

export const inputClasses = "field-input";

export const labelClasses = "eyebrow mb-2 block normal-case tracking-normal text-slate-600";

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className={labelClasses}>{label}</span>
      {children}
    </label>
  );
}
