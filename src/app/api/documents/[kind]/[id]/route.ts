import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { quotes, workOrders } from "@/lib/db/schema";
import { generateQuotePdf, generateWorkOrderPdf, type PdfDocumentData } from "@/lib/pdf";


function vehicleLabel(brand: string | null, model: string | null, year: number | null): string {
  return [brand, model, year].filter(Boolean).join(" ") || "—";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  if (!(await getCurrentUser())) return new Response("Não autorizado", { status: 401 });

  const { kind, id } = await params;
  const documentId = Number(id);
  if (!Number.isInteger(documentId)) return new Response("Inválido", { status: 400 });

  let pdf: Buffer;
  let filename: string;

  if (kind === "orcamento") {
    const quote = await db.query.quotes.findFirst({
      where: eq(quotes.id, documentId),
      with: { customer: true, vehicle: true, lines: true },
    });
    if (!quote) return new Response("Não encontrado", { status: 404 });

    const data: PdfDocumentData = {
      title: "Orçamento",
      number: quote.number,
      date: quote.createdAt,
      validUntil: quote.validUntil,
      customerName: quote.customer.name,
      customerNif: quote.customer.nif,
      customerPhone: quote.customer.phone,
      plate: quote.vehicle.plate,
      vehicle: vehicleLabel(quote.vehicle.brand, quote.vehicle.model, quote.vehicle.year),
      notes: quote.notes,
      lines: quote.lines,
      signatureLine: true,
    };
    pdf = await generateQuotePdf(data);
    filename = `orcamento-${quote.number}.pdf`;
  } else if (kind === "ordem") {
    const order = await db.query.workOrders.findFirst({
      where: eq(workOrders.id, documentId),
      with: { customer: true, vehicle: true, lines: true },
    });
    if (!order) return new Response("Não encontrado", { status: 404 });

    const data: PdfDocumentData = {
      title: "Ordem de Serviço",
      number: order.number,
      date: order.createdAt,
      customerName: order.customer.name,
      customerNif: order.customer.nif,
      customerPhone: order.customer.phone,
      plate: order.vehicle.plate,
      vehicle: vehicleLabel(order.vehicle.brand, order.vehicle.model, order.vehicle.year),
      odometer: order.odometer,
      complaint: order.complaint,
      diagnosis: order.diagnosis,
      lines: order.lines,
    };
    pdf = await generateWorkOrderPdf(data);
    filename = `ordem-servico-${order.number}.pdf`;
  } else {
    return new Response("Tipo inválido", { status: 400 });
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
