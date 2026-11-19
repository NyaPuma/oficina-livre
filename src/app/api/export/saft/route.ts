import { and, gte, lte } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { generateSaftXml } from "@/lib/saft";

export async function GET(request: Request) {
  if (!(await getCurrentUser())) return new Response("Não autorizado", { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const conditions = [];
  if (from) conditions.push(gte(invoices.issuedAt, new Date(from)));
  if (to) conditions.push(lte(invoices.issuedAt, new Date(`${to}T23:59:59`)));

  const rows = await db.query.invoices.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    with: { lines: true },
    limit: 10000,
    orderBy: (i, { asc }) => [asc(i.issuedAt)],
  });

  const xml = generateSaftXml(
    rows.map((invoice) => ({
      number: invoice.number,
      issuedAt: invoice.issuedAt,
      dueAt: invoice.dueAt,
      status: invoice.status,
      customerName: invoice.customerName,
      customerNif: invoice.customerNif,
      customerAddress: invoice.customerAddress,
      subtotalCents: invoice.subtotalCents,
      vatCents: invoice.vatCents,
      totalCents: invoice.totalCents,
      lines: invoice.lines,
    })),
    {
      companyNif: process.env.AT_COMPANY_NIF ?? process.env.COMPANY_NIF,
      certificateNumber: process.env.AT_SOFTWARE_CERTIFICATE_NUMBER,
      productId: process.env.AT_PRODUCT_ID,
      productVersion: process.env.AT_PRODUCT_VERSION,
      vendorNif: process.env.AT_VENDOR_NIF,
    },
  );

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="saft-${new Date().getFullYear()}.xml"`,
    },
  });
}
