import { ilike, or } from "drizzle-orm";
import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, TableWrapper, tableClasses, inputClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";


export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = q?.trim();
  const rows = await db.query.customers.findMany({
    where: term
      ? or(ilike(customers.name, `%${term}%`), ilike(customers.nif, `%${term}%`))
      : undefined,
    with: { vehicles: { columns: { plate: true } } },
    orderBy: (customers, { asc }) => [asc(customers.name)],
    limit: 100,
  });

  return (
    <>
      <PageHeader
        title="Clientes e viaturas"
        description="Fichas de clientes, veículos e respetivo histórico"
        action={{ href: "/clientes/novo", label: "Novo cliente" }}
      />

      <Card className="p-4">
        <form method="get" className="flex gap-2">
          <input name="q" defaultValue={term ?? ""} placeholder="Pesquisar por nome ou NIF" className={inputClasses} />
          <button type="submit" className="btn-primary shrink-0">
            Pesquisar
          </button>
        </form>
      </Card>

      <Card className="mt-5">
        {rows.length === 0 ? (
          <EmptyState title="Sem clientes" description="Adicione o primeiro cliente da oficina." />
        ) : (
          <TableWrapper>
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className={tableClasses.th}>Nome</th>
                  <th className={tableClasses.th}>NIF</th>
                  <th className={tableClasses.th}>Contacto</th>
                  <th className={tableClasses.th}>Viaturas</th>
                  <th className={tableClasses.th} />
                </tr>
              </thead>
              <tbody>
                {rows.map((customer) => (
                  <tr key={customer.id} className={tableClasses.row}>
                    <td className={`${tableClasses.td} font-medium text-slate-900`}>{customer.name}</td>
                    <td className={tableClasses.td}>{customer.nif ?? "—"}</td>
                    <td className={tableClasses.td}>{customer.phone ?? customer.email ?? "—"}</td>
                    <td className={tableClasses.td}>
                      <div className="flex flex-wrap gap-1">
                        {customer.vehicles.length === 0 ? "—" : customer.vehicles.map((v) => (
                          <Badge key={v.plate}>{v.plate}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className={`${tableClasses.td} text-right`}>
                      <Link href={`/clientes/${customer.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                        Abrir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </Card>
    </>
  );
}

export const instant = false;
