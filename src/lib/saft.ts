import { createHash } from "node:crypto";
import { lineTotalCents } from "./format";

export type SaftConfig = {
  companyNif?: string;
  certificateNumber?: string;
  productId?: string;
  productVersion?: string;
  vendorNif?: string;
};

export function atCertificateConfigured(): boolean {
  return Boolean(process.env.AT_SOFTWARE_CERTIFICATE_NUMBER && process.env.AT_COMPANY_NIF);
}

/**
 * Hash no estilo SAP/AT: SHA-1 dos valores concatenados por '*', em Base64.
 * ATENÇÃO: a ordem exata dos campos depende da versão do SAF-T e deve ser
 * validada com a documentação oficial da AT antes de qualquer submissão.
 */
export function atDocumentHash(fields: Array<string | number>): string {
  return createHash("sha1").update(fields.map(String).join("*"), "utf8").digest("base64");
}

export type SaftInvoice = {
  number: string;
  issuedAt: Date;
  dueAt: Date | null;
  status: string;
  customerName: string;
  customerNif: string | null;
  customerAddress: string | null;
  subtotalCents: number;
  vatCents: number;
  totalCents: number;
  lines: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    vatRateBps: number;
    discountCents: number;
  }>;
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function amount(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Exportação XML SAF-T com os campos de certificação da AT configuráveis.
 *
 * O ficheiro só pode ser considerado um SAF-T certificado quando:
 *   1. a oficina tem um número de certificado de software atribuído pela AT,
 *   2. o produto foi certificado com esse número e versão,
 *   3. a ordem dos campos usada nos hashes foi validada pela AT/contabilista.
 * Sem esses elementos, o ficheiro é uma exportação para apoio à contabilidade.
 */
export function generateSaftXml(invoices: SaftInvoice[], config: SaftConfig = {}): string {
  const year = new Date().getFullYear();
  const total = invoices.reduce((sum, invoice) => sum + invoice.totalCents, 0);
  const company = config.companyNif || "000000000";
  const certificateNumber = config.certificateNumber || "0";
  const productId = config.productId || "Oficina Livre";
  const productVersion = config.productVersion || "0.4.0";
  const vendorNif = config.vendorNif || "000000000";
  const certified = certificateNumber !== "0";
  const parts: string[] = [];

  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push("<AuditFile>");
  parts.push("  <Header>");
  parts.push("    <AuditFileVersion>1.04</AuditFileVersion>");
  parts.push(`    <CompanyID>${esc(company)}</CompanyID>`);
  parts.push(`    <TaxRegistrationNumber>${esc(company)}</TaxRegistrationNumber>`);
  parts.push("    <CompanyName>Oficina Livre</CompanyName>");
  parts.push(`    <FiscalYear>${year}</FiscalYear>`);
  parts.push("    <CurrencyCode>EUR</CurrencyCode>");
  parts.push(`    <DateCreated>${isoDate(new Date())}</DateCreated>`);
  parts.push(`    <ProductCompanyTaxID>${esc(vendorNif)}</ProductCompanyTaxID>`);
  parts.push(`    <SoftwareCertificateNumber>${esc(certificateNumber)}</SoftwareCertificateNumber>`);
  parts.push(`    <ProductID>${esc(productId)}</ProductID>`);
  parts.push(`    <ProductVersion>${esc(productVersion)}</ProductVersion>`);
  parts.push(
    certified
      ? "    <HeaderComment>Exportacao SAF-T com numero de certificado de software AT configurado. Validar com o contabilista.</HeaderComment>"
      : "    <HeaderComment>Exportacao simplificada para apoio a contabilidade. NAO e um SAF-T certificado pela AT.</HeaderComment>",
  );
  parts.push("  </Header>");
  parts.push("  <MasterData>");
  parts.push("    <Suppliers />");
  parts.push("    <Customers>");
  const seenNif = new Set<string>();
  for (const invoice of invoices) {
    const nif = invoice.customerNif || "SEM-NIF";
    if (seenNif.has(nif)) continue;
    seenNif.add(nif);
    parts.push("      <Customer>");
    parts.push(`        <CustomerID>${esc(nif)}</CustomerID>`);
    parts.push(`        <Name>${esc(invoice.customerName)}</Name>`);
    if (invoice.customerNif) parts.push(`        <TaxNumber>${esc(invoice.customerNif)}</TaxNumber>`);
    if (invoice.customerAddress) parts.push(`        <Address><AddressDetail>${esc(invoice.customerAddress)}</AddressDetail></Address>`);
    parts.push("      </Customer>");
  }
  parts.push("    </Customers>");
  parts.push("  </MasterData>");
  parts.push("  <SourceDocuments>");
  parts.push("    <SalesInvoices>");
  parts.push(`      <NumberOfInvoices>${invoices.length}</NumberOfInvoices>`);
  parts.push(`      <TotalInvoicingAmount>${amount(total)}</TotalInvoicingAmount>`);
  for (const invoice of invoices) {
    const integrityHash = atDocumentHash([
      invoice.number,
      isoDate(invoice.issuedAt),
      invoice.customerNif || "SEM-NIF",
      amount(invoice.totalCents),
    ]);
    parts.push("      <Invoice>");
    parts.push(`        <InvoiceNo>${esc(invoice.number)}</InvoiceNo>`);
    parts.push(`        <IssueDate>${isoDate(invoice.issuedAt)}</IssueDate>`);
    if (invoice.dueAt) parts.push(`        <DueDate>${isoDate(invoice.dueAt)}</DueDate>`);
    parts.push("        <InvoiceType>FT</InvoiceType>");
    parts.push(`        <Hash>${integrityHash}</Hash>`);
    parts.push("        <DocumentStatus>");
    parts.push(`          <InvoiceStatus>${invoice.status === "anulada" ? "A" : "N"}</InvoiceStatus>`);
    parts.push("          <InvoiceStatusDate>" + isoDate(invoice.issuedAt) + "</InvoiceStatusDate>");
    parts.push("        </DocumentStatus>");
    parts.push(`        <CustomerID>${esc(invoice.customerNif || "SEM-NIF")}</CustomerID>`);
    parts.push("        <Totals>");
    parts.push(`          <SumExcludingTaxes>${amount(invoice.subtotalCents)}</SumExcludingTaxes>`);
    parts.push(`          <TotalTax>${amount(invoice.vatCents)}</TotalTax>`);
    parts.push(`          <TotalAmount>${amount(invoice.totalCents)}</TotalAmount>`);
    parts.push("        </Totals>");
    for (const [index, line] of invoice.lines.entries()) {
      parts.push("        <Line>");
      parts.push(`          <LineNumber>${index + 1}</LineNumber>`);
      parts.push(`          <Description>${esc(line.description)}</Description>`);
      parts.push(`          <Quantity>${line.quantity}</Quantity>`);
      parts.push(`          <UnitPrice>${amount(line.unitPriceCents)}</UnitPrice>`);
      parts.push(`          <Tax><TaxType>IVA</TaxType><TaxPercentage>${line.vatRateBps / 100}</TaxPercentage><TaxAmount>${amount(Math.round(lineTotalCents(line) * line.vatRateBps / 10_000))}</TaxAmount></Tax>`);
      parts.push(`          <LineTotalAmount>${amount(lineTotalCents(line))}</LineTotalAmount>`);
      parts.push(`          <Hash>${atDocumentHash([line.description, line.quantity, amount(line.unitPriceCents), amount(lineTotalCents(line))])}</Hash>`);
      parts.push("        </Line>");
    }
    parts.push("      </Invoice>");
  }
  parts.push("    </SalesInvoices>");
  parts.push("  </SourceDocuments>");
  parts.push("</AuditFile>");
  return parts.join("\n");
}
