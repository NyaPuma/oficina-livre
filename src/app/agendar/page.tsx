import { CalendarDays, Wrench } from "lucide-react";
import { BookingForm } from "@/components/forms/booking-form";
import { Card } from "@/components/ui";

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-900 text-white"><Wrench size={22} /></div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Marcar serviço na Oficina Livre</h1>
          <p className="mt-2 text-sm text-slate-500">Preencha os dados abaixo. A oficina confirma a marcação por telefone ou email.</p>
        </div>
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <CalendarDays size={16} /> Horário de funcionamento: dias úteis, 09:00–18:00
          </div>
          <BookingForm />
        </Card>
        <p className="mt-6 text-center text-xs text-slate-400">Software livre Oficina Livre · licença MIT</p>
      </div>
    </main>
  );
}

export const instant = false;
