import { CalendarCheck, Clock3, MessageCircle, ShieldCheck, Wrench } from "lucide-react";
import { BookingForm } from "@/components/forms/booking-form";
import { BrandMark, Card } from "@/components/ui";

const steps = [
  { icon: CalendarCheck, title: "Escolha a data", text: "Indique quando pretende trazer a viatura." },
  { icon: MessageCircle, title: "Confirmamos", text: "Entramos em contacto para confirmar horário e serviço." },
  { icon: Wrench, title: "Mãos à obra", text: "Recebe o diagnóstico e acompanha a reparação." },
];

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <section className="ink-gradient grid-texture relative overflow-hidden px-5 py-12 text-white sm:py-16">
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full border border-white/8" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto w-fit"><BrandMark size="lg" /></div>
          <p className="eyebrow mt-5 text-brand">Reservas online</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Marque o seu serviço na Oficina Livre</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300">
            Simples, rápido e sem chamadas. Preencha os dados e tratamos do resto.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><Clock3 size={13} /> Dias úteis, 09:00–18:00</span>
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5"><ShieldCheck size={13} /> Os seus dados protegidos</span>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-6 max-w-5xl px-4 pb-16">
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="p-7 lg:col-span-3">
            <p className="eyebrow mb-1.5">Dados da marcação</p>
            <h2 className="mb-6 text-xl font-semibold tracking-tight text-ink">Pedir marcação</h2>
            <BookingForm />
          </Card>

          <aside className="lg:col-span-2">
            <Card className="p-6">
              <p className="eyebrow mb-5">Como funciona</p>
              <ol className="space-y-5">
                {steps.map(({ icon: Icon, title, text }, i) => (
                  <li key={title} className="flex gap-3">
                    <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-brandstrong">
                      <Icon size={16} />
                      {i < steps.length - 1 ? <span className="absolute left-1/2 top-11 h-5 w-px -translate-x-1/2 bg-line" /> : null}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
            <p className="mt-4 text-center text-xs text-slate-400">Oficina Livre · software livre sob licença MIT</p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export const instant = false;
