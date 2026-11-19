import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelInvoice } from "@/actions/invoicing";
import { DemoSignatureCompleteForm, GatewayPaymentForm, SignatureRequestForm } from "@/components/forms/integration-forms";
import { CertifiedInvoiceButton } from "@/components/forms/certified-invoice-button";
import { PaymentForm } from "@/components/forms/payment-form";
import { isCertifiedInvoicingEnabled } from "@/lib/fiscal";
import { isLivePaymentEnabled } from "@/lib/payments";
import { isQualifiedSignatureEnabled } from "@/lib/signature";
import { Badge, Card, PageHeader, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { invoices, paymentIntents, signatureRequests } from "@/lib/db/schema";
import { formatDate, formatDateTime, formatMoney, formatVat, lineTotalCents } from "@/lib/format";

const tones: Record<string, string> = { rascunho: "slate", emitida: "blue", paga: "green", anulada: "red" };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoiceId = Number(id);
  if (!Number.isInteger(invoiceId)) notFound();

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.id, invoiceId),
    with: { lines: true, payments: true, workOrder: true, quote: true },
  });
  if (!invoice) notFound();

  const [signatures, intents] = await Promise.all([
    db
      .select()
      .from(signatureRequests)
      .where(and(eq(signatureRequests.entity, "fatura"), eq(signatureRequests.entityId, invoice.id)))
      .orderBy(desc(signatureRequests.createdAt)),
    db.select().from(paymentIntents).where(eq(paymentIntents.invoiceId, invoice.id)).orderBy(desc(paymentIntents.createdAt)),
  ]);
  const balance = Math.max(0, invoice.totalCents - invoice.paidCents);

  return (
    <>
      <PageHeader
        title={`Fatura ${invoice.number}`}
        description={`Emitida em ${formatDateTime(invoice.issuedAt)}`}
        action={{ href: `/api/documents/fatura/${invoice.id}`, label: "Abrir PDF" }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="font-semibold text-slate-900">Linhas</h2>
              <Badge tone={tones[invoice.status]}>{invoice.status}</Badge>
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
                  {invoice.lines.map((line) => (
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
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatMoney(invoice.subtotalCents)}</span></div>
              <div className="flex justify-between text-slate-600"><span>IVA</span><span>{formatMoney(invoice.vatCents)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900"><span>Total</span><span>{formatMoney(invoice.totalCents)}</span></div>
              <div className="flex justify-between text-emerald-600"><span>Pago</span><span>{formatMoney(invoice.paidCents)}</span></div>
              <div className="flex justify-between font-semibold text-slate-900"><span>Em aberto</span><span>{formatMoney(balance)}</span></div>
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4"><h2 className="font-semibold text-slate-900">Pagamentos</h2></div>
            {invoice.payments.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-slate-500">Ainda não há pagamentos registados.</p>
            ) : (
              <TableWrapper>
                <table className="w-full">
                  <thead className="bg-slate-50"><tr>
                    <th className={tableClasses.th}>Data</th><th className={tableClasses.th}>Método</th>
                    <th className={tableClasses.th}>Referência</th><th className={tableClasses.th}>Valor</th>
                  </tr></thead>
                  <tbody>
                    {invoice.payments.map((payment) => (
                      <tr key={payment.id} className={tableClasses.row}>
                        <td className={tableClasses.td}>{formatDateTime(payment.paidAt)}</td>
                        <td className={tableClasses.td}>{payment.method}</td>
                        <td className={tableClasses.td}>{payment.reference ?? "—"}</td>
                        <td className={tableClasses.td}>{formatMoney(payment.amountCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrapper>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900">Cliente</h2>
            <p className="mt-3 text-sm text-slate-800">{invoice.customerName}</p>
            <p className="text-sm text-slate-500">NIF {invoice.customerNif ?? "—"}</p>
            {invoice.customerAddress ? <p className="mt-1 text-sm text-slate-500">{invoice.customerAddress}</p> : null}
            <p className="mt-3 text-sm text-slate-500">Vencimento: {formatDate(invoice.dueAt)}</p>
            {invoice.workOrder ? <Link href={`/ordens/${invoice.workOrderId}`} className="mt-2 block text-sm text-slate-600 underline">Ordem {invoice.workOrder.number}</Link> : null}
            {invoice.quote ? <Link href={`/orcamentos/${invoice.quoteId}`} className="mt-1 block text-sm text-slate-600 underline">Orçamento {invoice.quote.number}</Link> : null}
          </Card>

          {invoice.status !== "anulada" && invoice.status !== "paga" ? (
            <>
              <Card className="p-5">
                <h2 className="mb-4 font-semibold text-slate-900">Pagamento online</h2>
                <GatewayPaymentForm invoiceId={invoice.id} live={isLivePaymentEnabled()} balanceCents={balance} />
                {intents.length > 0 ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Último intent: {intents[0].provider} · {intents[0].status} · {formatMoney(intents[0].amountCents)}
                  </p>
                ) : null}
              </Card>
              <Card className="p-5">
                <h2 className="mb-4 font-semibold text-slate-900">Registar pagamento manualmente</h2>
                <PaymentForm invoiceId={invoice.id} balanceCents={balance} />
              </Card>
            </>
          ) : null}

          <Card className="p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Fatura certificada (AT)</h2>
            <p className="mb-3 text-xs text-slate-500">
              {isCertifiedInvoicingEnabled()
                ? "Programa certificado configurado — o documento é submetido através dele."
                : "Sem programa certificado configurado — emitir apenas documento interno."}
            </p>
            <CertifiedInvoiceButton invoiceId={invoice.id} />
            {invoice.atcud ? (
              <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
                <p><strong>ATCUD:</strong> {invoice.atcud}</p>
                {invoice.certifiedNumber ? <p><strong>N.º certificado:</strong> {invoice.certifiedNumber}</p> : null}
                {invoice.documentHash ? <p className="break-all"><strong>Hash:</strong> {invoice.documentHash}</p> : null}
              </div>
            ) : null}
            {invoice.qrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={invoice.qrCodeUrl} alt="QR code da fatura certificada" className="mt-3 size-32" />
            ) : null}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Assinatura qualificada</h2>
            <p className="mb-3 text-xs text-slate-500">
              {isQualifiedSignatureEnabled()
                ? "Serviço de assinatura configurado — o documento é enviado para assinatura com certificado qualificado."
                : "Sem serviço de assinatura configurado — pedidos ficam em modo demonstração."}
            </p>
            <SignatureRequestForm entity="fatura" entityId={invoice.id} email={null} />
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

          {invoice.status === "paga" ? (
            <Card className="p-5">
              <h2 className="font-semibold text-slate-900">Recibo</h2>
              <a href={`/api/documents/recibo/${invoice.id}`} className="mt-3 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
                Abrir recibo PDF
              </a>
            </Card>
          ) : null}

          {invoice.status !== "anulada" ? (
            <form action={cancelInvoice}>
              <input type="hidden" name="id" value={invoice.id} />
              <button type="submit" className="text-xs text-red-600 underline">Anular fatura</button>
            </form>
          ) : null}
        </div>
      </div>
    </>
  );
}

export const instant = false;
