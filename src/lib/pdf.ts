import PDFDocument from "pdfkit";
import { documentTotals, formatDate, formatMoney, formatVat, lineTotalCents } from "./format";

export type PdfLine = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  vatRateBps: number;
  discountCents: number;
};

export type PdfDocumentData = {
  title: string;
  number: string;
  date: Date;
  validUntil?: Date | null;
  companyName?: string;
  customerName: string;
  customerNif?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  plate: string;
  vehicle?: string | null;
  odometer?: number | null;
  complaint?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  lines: PdfLine[];
  signatureLine?: boolean;
};

export function generateDocumentPdf(data: PdfDocumentData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const totals = documentTotals(data.lines);

    doc.fontSize(18).font("Helvetica-Bold").text(data.companyName ?? "Oficina Livre");
    doc.fontSize(9).font("Helvetica").fillColor("#666666").text("Gestão de oficina automóvel");
    doc.fillColor("#000000");

    doc.moveDown(1.2);
    doc.fontSize(20).font("Helvetica-Bold").text(data.title);
    doc.moveDown(0.2);
    doc.fontSize(10).font("Helvetica").fillColor("#555555").text(`Documento: ${data.number}`);
    doc.text(`Data: ${formatDate(data.date)}`);
    if (data.validUntil) doc.text(`Válido até: ${formatDate(data.validUntil)}`);
    doc.fillColor("#000000");

    doc.moveDown(1);
    const col1 = left;
    const col2 = left + 270;
    doc.fontSize(11).font("Helvetica-Bold").text("Cliente", col1, doc.y);
    doc.font("Helvetica").fontSize(10)
      .text(data.customerName, col1, doc.y + 2)
      .text(data.customerNif ? `NIF: ${data.customerNif}` : "", col1)
      .text(data.customerAddress ?? "", col1)
      .text(data.customerPhone ?? "", col1);

    doc.fontSize(11).font("Helvetica-Bold").text("Veículo", col2, doc.y - 48);
    doc.font("Helvetica").fontSize(10)
      .text(data.plate, col2, doc.y + 2)
      .text(data.vehicle ?? "", col2)
      .text(data.odometer ? `Quilómetros: ${data.odometer.toLocaleString("pt-PT")} km` : "", col2);
    doc.moveDown(2);

    if (data.complaint) {
      doc.fontSize(10).font("Helvetica-Bold").text("Queixa / descrição:");
      doc.font("Helvetica").text(data.complaint, { width: right - left });
      doc.moveDown(0.6);
    }
    if (data.diagnosis) {
      doc.fontSize(10).font("Helvetica-Bold").text("Diagnóstico:");
      doc.font("Helvetica").text(data.diagnosis, { width: right - left });
      doc.moveDown(0.6);
    }

    const tableTop = doc.y + 8;
    doc.rect(left, tableTop, right - left, 24).fill("#EEF2F6");
    doc.fillColor("#000000").fontSize(9).font("Helvetica-Bold");
    doc.text("Descrição", left + 6, tableTop + 8);
    doc.text("Qtd.", left + 320, tableTop + 8, { width: 40, align: "right" });
    doc.text("P. unit.", left + 365, tableTop + 8, { width: 75, align: "right" });
    doc.text("IVA", left + 445, tableTop + 8, { width: 40, align: "right" });
    doc.text("Total", left + 490, tableTop + 8, { width: 60, align: "right" });

    let y = tableTop + 24;
    doc.font("Helvetica").fontSize(9);
    for (const line of data.lines) {
      if (y > doc.page.height - 140) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      doc.text(line.description, left + 6, y + 4, { width: 300 });
      doc.text(String(line.quantity), left + 320, y + 4, { width: 40, align: "right" });
      doc.text(formatMoney(line.unitPriceCents), left + 365, y + 4, { width: 75, align: "right" });
      doc.text(formatVat(line.vatRateBps), left + 445, y + 4, { width: 40, align: "right" });
      doc.text(formatMoney(lineTotalCents(line)), left + 490, y + 4, { width: 60, align: "right" });
      y += 20;
      doc.moveTo(left, y).lineTo(right, y).strokeColor("#E5E7EB").stroke();
    }

    y += 12;
    const boxX = right - 230;
    doc.fontSize(10).font("Helvetica");
    doc.text("Subtotal", boxX, y, { width: 130, align: "right" });
    doc.text(formatMoney(totals.subtotalCents), boxX + 132, y, { width: 96, align: "right" });
    y += 16;
    doc.text("IVA", boxX, y, { width: 130, align: "right" });
    doc.text(formatMoney(totals.vatCents), boxX + 132, y, { width: 96, align: "right" });
    y += 20;
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("TOTAL", boxX, y, { width: 130, align: "right" });
    doc.text(formatMoney(totals.totalCents), boxX + 132, y, { width: 96, align: "right" });

    if (data.notes) {
      doc.moveDown(2).font("Helvetica").fontSize(9).fillColor("#555555")
        .text(`Observações: ${data.notes}`, { width: right - left });
    }

    if (data.signatureLine) {
      const sigY = Math.max(doc.y + 40, doc.page.height - 110);
      doc.moveTo(left, sigY).lineTo(left + 220, sigY).strokeColor("#999999").stroke();
      doc.fillColor("#555555").fontSize(8).text("Assinatura do cliente", left, sigY + 6);
      doc.moveTo(left + 280, sigY).lineTo(right, sigY).strokeColor("#999999").stroke();
      doc.text("Recebido / Data", left + 280, sigY + 6);
    }

    doc.fillColor("#888888").fontSize(8)
      .text("Documento gerado pelo Oficina Livre — software livre sob licença MIT", left, doc.page.height - 40, {
        width: right - left,
        align: "center",
      });

    doc.end();
  });
}

export function generateQuotePdf(data: PdfDocumentData): Promise<Buffer> {
  return generateDocumentPdf({ ...data, title: "Orçamento", signatureLine: true });
}

export function generateWorkOrderPdf(data: PdfDocumentData): Promise<Buffer> {
  return generateDocumentPdf({ ...data, title: "Ordem de Serviço" });
}
