import { createHash } from "node:crypto";
import { lineTotalCents } from "./format";

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
 * Exportação XML no formato SAF-T (estrutura simplificada) para apoio à contabilidade.
 *
 * ATENÇÃO: este ficheiro NÃO é um SAF-T certificado pela Autoridade Tributária:
 * não contém certificado de software nem os hashes oficiais. Deve ser validado
 * por um contabilista antes de qualquer entrega à AT.
 */
export function generateSaftXml(invoices: SaftInvoice[], companyNif?: string): string {
  const year = new Date().getFullYear();
  const total = invoices.reduce((sum, invoice) => sum + invoice.totalCents, 0);
  const company = companyNif || "000000000";
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
  parts.push("    <ProductCompanyTaxID>000000000</ProductCompanyTaxID>");
  parts.push("    <SoftwareCertificateNumber>0</SoftwareCertificateNumber>");
  parts.push("    <ProductID>Oficina Livre</ProductID>");
  parts.push("    <ProductVersion>0.2.0</ProductVersion>");
  parts.push("    <HeaderComment>Exportacao simplificada para apoio a contabilidade. NAO e um SAF-T certificado pela AT.</HeaderComment>");
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
    const canonical = `${invoice.number}|${isoDate(invoice.issuedAt)}|${amount(invoice.totalCents)}`;
    const integrityHash = createHash("sha256").update(canonical).digest("hex");
    parts.push("      <Invoice>");
    parts.push(`        <InvoiceNo>${esc(invoice.number)}</InvoiceNo>`);
    parts.push(`        <IssueDate>${isoDate(invoice.issuedAt)}</IssueDate>`);
    if (invoice.dueAt) parts.push(`        <DueDate>${isoDate(invoice.dueAt)}</DueDate>`);
    parts.push("        <InvoiceType>FT</InvoiceType>");
    parts.push(`        <Hash>${integrityHash}</Hash>`);
    parts.push("        <HashAlgorithm>SHA-256 (integridade interna, nao AT)</HashAlgorithm>");
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
      parts.push("        </Line>");
    }
    parts.push("      </Invoice>");
  }
  parts.push("    </SalesInvoices>");
  parts.push("  </SourceDocuments>");
  parts.push("</AuditFile>");
  return parts.join("\n");
}
