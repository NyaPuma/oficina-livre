import { CheckCircle2, ClipboardCheck, FileText, Wrench } from "lucide-react";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

const features = [
  { icon: Wrench, text: "Ordens de serviço digitais com fotos e checklist" },
  { icon: FileText, text: "Orçamentos, faturas e recibos no mesmo sitio" },
  { icon: ClipboardCheck, text: "Diagnóstico digital partilhado com o cliente" },
  { icon: CheckCircle2, text: "Stock, agenda e relatórios sempre atualizados" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen">
      <section className="ink-gradient diagonal-texture relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -left-20 top-1/3 size-80 rounded-full border border-white/8" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 size-96 rounded-full bg-brand/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <BrandMark size="lg" />
          <div>
            <p className="text-lg font-bold tracking-tight">Oficina Livre</p>
            <p className="text-xs text-slate-400">gestão automóvel open-source</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="eyebrow text-brand">Feito para mecânicos</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
            A oficina organizada, <span className="text-brand">sem papelaria.</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-slate-300">
            Menos tempo em cadernos e folhas de cálculo. Mais tempo a reparar viaturas e a servir clientes.
          </p>
          <ul className="mt-8 space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="grid size-7 place-items-center rounded-lg bg-brand/15 text-brand"><Icon size={14} /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">software livre · licença MIT · dados na sua oficina</p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-canvas px-5 py-12">
        <LoginForm next={next ?? "/"} />
      </section>
    </main>
  );
}

export const instant = false;
