import { eq } from "drizzle-orm";
import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { ApprovalForm } from "@/components/forms/approval-form";
import { BrandMark, Card } from "@/components/ui";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { documentTotals, formatDate, formatMoney, lineTotalCents } from "@/lib/format";

export default async function PublicApprovalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.approvalToken, token),
    with: { customer: true, vehicle: true, lines: true },
  });
  if (!quote) notFound();

  const totals = documentTotals(quote.lines);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto w-fit"><BrandMark size="lg" /></div>
          <p className="eyebrow mt-5">Proposta da oficina</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Orçamento {quote.number}</h1>
          <p className="mt-2 text-sm text-slate-500">Emitido em {formatDate(quote.createdAt)} · Válido até {formatDate(quote.validUntil)}</p>
        </div>

        <Card className="p-6">
          <div className="mb-5 grid gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <div><p className="text-slate-500">Cliente</p><p className="font-medium text-slate-800">{quote.customer.name}</p></div>
            <div><p className="text-slate-500">Viatura</p><p className="font-medium text-slate-800">{quote.vehicle.plate}</p></div>
          </div>

          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
              <th className="py-2">Serviço / peça</th><th className="py-2 text-right">Qtd.</th><th className="py-2 text-right">Total</th>
            </tr></thead>
            <tbody>
              {quote.lines.map((line) => (
                <tr key={line.id} className="border-b border-slate-100">
                  <td className="py-2">{line.description}</td>
                  <td className="py-2 text-right">{line.quantity}</td>
                  <td className="py-2 text-right">{formatMoney(lineTotalCents(line))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end text-base font-semibold text-slate-900">
            Total: {formatMoney(totals.totalCents)}
          </div>

          {quote.status === "aprovado" ? (
            <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-center text-sm text-emerald-700">
              <CheckCircle2 className="mx-auto mb-2" size={22} />
              Orçamento aprovado digitalmente por {quote.signatureName ?? "cliente"} em {formatDate(quote.signedAt ?? quote.approvedAt)}.
            </div>
          ) : (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <h2 className="mb-4 font-semibold text-slate-900">Aprovar orçamento</h2>
              <ApprovalForm token={quote.approvalToken ?? token} />
            </div>
          )}
        </Card>
        <p className="mt-6 text-center text-xs text-slate-400">Oficina Livre · software livre sob licença MIT</p>
      </div>
    </main>
  );
}

export const instant = false;
