import { asc } from "drizzle-orm";
import { SiteForm } from "@/components/forms/site-form";
import { Badge, Card, PageHeader, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";

export default async function SitesPage() {
  const allSites = await db.select().from(sites).orderBy(asc(sites.name));

  return (
    <>
      <PageHeader title="Localizações" description="Oficinas, filiais e rampas por local" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <TableWrapper>
            <table className="w-full">
              <thead className="bg-slate-50"><tr>
                <th className={tableClasses.th}>Nome</th><th className={tableClasses.th}>Código</th>
                <th className={tableClasses.th}>Morada</th><th className={tableClasses.th}>Contacto</th>
                <th className={tableClasses.th}>Criado</th>
              </tr></thead>
              <tbody>
                {allSites.map((site) => (
                  <tr key={site.id} className={tableClasses.row}>
                    <td className={`${tableClasses.td} font-medium`}>{site.name}</td>
                    <td className={tableClasses.td}><Badge>{site.code}</Badge></td>
                    <td className={tableClasses.td}>{site.address ?? "—"}</td>
                    <td className={tableClasses.td}>{site.phone ?? "—"}</td>
                    <td className={tableClasses.td}>{formatDate(site.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Novo local</h2>
          <SiteForm />
        </Card>
      </div>
    </>
  );
}

export const instant = false;
