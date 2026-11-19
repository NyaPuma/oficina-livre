import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sendQuoteForApproval } from "@/actions/approval";
import { setQuoteStatus } from "@/actions/documents";
import { invoiceQuote } from "@/actions/invoicing";
import { EmailButton } from "@/components/forms/email-button";
import { InvoiceButton } from "@/components/forms/invoice-button";
import { DemoSignatureCompleteForm, SignatureRequestForm } from "@/components/forms/integration-forms";
import { isQualifiedSignatureEnabled } from "@/lib/signature";
import { Badge, Card, PageHeader, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { quotes, signatureRequests } from "@/lib/db/schema";
import { documentTotals, formatDate, formatMoney, formatVat, lineTotalCents, STATUS_LABELS } from "@/lib/format";


const nextStatus: Record<string, { label: string; status: string }> = {
  rascunho: { label: "Marcar como enviado", status: "enviado" },
  enviado: { label: "Aprovar orçamento", status: "aprovado" },
  aprovado: { label: "Rejeitar", status: "rejeitado" },
  rejeitado: { label: "Voltar a rascunho", status: "rascunho" },
};

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quoteId = Number(id);
  if (!Number.isInteger(quoteId)) notFound();

  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
    with: { customer: true, vehicle: true, lines: true, workOrders: true },
  });
  if (!quote) notFound();

  const signatures = await db
    .select()
    .from(signatureRequests)
    .where(and(eq(signatureRequests.entity, "orcamento"), eq(signatureRequests.entityId, quote.id)))
    .orderBy(desc(signatureRequests.createdAt));

  const totals = documentTotals(quote.lines);

  return (
    <>
      <PageHeader
        title={`Orçamento ${quote.number}`}
        description={`Criado em ${formatDate(quote.createdAt)}`}
        action={{ href: `/api/documents/orcamento/${quote.id}`, label: "Abrir PDF" }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Linhas</h2>
              <Badge tone={quote.status === "aprovado" ? "green" : quote.status === "enviado" ? "blue" : "slate"}>
                {STATUS_LABELS[quote.status]}
              </Badge>
            </div>
            <TableWrapper>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className={tableClasses.th}>Descrição</th>
                    <th className={tableClasses.th}>Qtd.</th>
                    <th className={tableClasses.th}>P. unitário</th>
                    <th className={tableClasses.th}>IVA</th>
                    <th className={tableClasses.th}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.lines.map((line) => (
                    <tr key={line.id} className={tableClasses.row}>
                      <td className={tableClasses.td}>{line.description}</td>
                      <td className={tableClasses.td}>{line.quantity}</td>
                      <td className={tableClasses.td}>{formatMoney(line.unitPriceCents)}</td>
                      <td className={tableClasses.td}>{formatVat(line.vatRateBps)}</td>
                      <td className={tableClasses.td}>{formatMoney(lineTotalCents(line))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
            <div className="ml-auto w-72 space-y-2 p-5 text-sm">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatMoney(totals.subtotalCents)}</span></div>
              <div className="flex justify-between text-slate-600"><span>IVA</span><span>{formatMoney(totals.vatCents)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
                <span>Total</span><span>{formatMoney(totals.totalCents)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900">Resumo</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-slate-500">Cliente</dt><dd className="text-slate-800"><Link href={`/clientes/${quote.customerId}`} className="hover:underline">{quote.customer.name}</Link></dd></div>
              <div><dt className="text-slate-500">Viatura</dt><dd className="text-slate-800">{quote.vehicle.plate}</dd></div>
              <div><dt className="text-slate-500">Validade</dt><dd className="text-slate-800">{formatDate(quote.validUntil)}</dd></div>
              {quote.notes ? <div><dt className="text-slate-500">Observações</dt><dd className="text-slate-800">{quote.notes}</dd></div> : null}
              {quote.approvedAt ? <div><dt className="text-slate-500">Aprovado em</dt><dd className="text-slate-800">{formatDate(quote.approvedAt)}</dd></div> : null}
            </dl>
            <form action={setQuoteStatus} className="mt-5">
              <input type="hidden" name="id" value={quote.id} />
              <input type="hidden" name="status" value={nextStatus[quote.status]?.status ?? "rascunho"} />
              <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                {nextStatus[quote.status]?.label ?? "Alterar estado"}
              </button>
            </form>
            <form action={sendQuoteForApproval} className="mt-2">
              <input type="hidden" name="id" value={quote.id} />
              <button type="submit" className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {quote.approvalToken ? "Reenviar para aprovação" : "Preparar aprovação digital"}
              </button>
            </form>
            {quote.approvalToken ? (
              <a href={`/orcamento/${quote.approvalToken}`} target="_blank" rel="noopener noreferrer" className="mt-2 block text-center text-sm text-slate-500 underline hover:text-slate-900">
                Abrir link público de aprovação ↗
              </a>
            ) : null}
            {quote.signatureName ? (
              <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
                Aprovado digitalmente por {quote.signatureName} em {formatDate(quote.signedAt)}.
              </p>
            ) : null}
            {quote.status === "aprovado" ? (
              <Link href={`/ordens/novo?quote=${quote.id}`} className="mt-2 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
                Criar ordem de serviço
              </Link>
            ) : null}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Enviar ao cliente</h2>
            <EmailButton kind="orcamento" id={quote.id} email={quote.customer.email} />
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Faturação</h2>
            <InvoiceButton id={quote.id} action={invoiceQuote} label="Emitir fatura" />
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Assinatura qualificada</h2>
            <p className="mb-3 text-xs text-slate-500">
              {isQualifiedSignatureEnabled()
                ? "Serviço de assinatura configurado — certificado qualificado."
                : "Sem serviço configurado — modo demonstração, não é assinatura qualificada."}
            </p>
            <SignatureRequestForm entity="orcamento" entityId={quote.id} email={quote.customer.email} />
            {signatures.map((signature) => (
              <div key={signature.id} className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <p>{signature.provider} · {signature.status}{signature.signerName ? ` · ${signature.signerName}` : ""}</p>
                {signature.signingUrl ? <a href={signature.signingUrl} target="_blank" rel="noopener noreferrer" className="text-slate-900 underline">Abrir assinatura ↗</a> : null}
                {!isQualifiedSignatureEnabled() && signature.status === "pendente" ? (
                  <div className="mt-2"><DemoSignatureCompleteForm requestId={signature.id} /></div>
                ) : null}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}

export const instant = false;
