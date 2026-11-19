import { Card, EmptyState, PageHeader, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";


export default async function AuditPage() {
  const logs = await db.query.auditLogs.findMany({
    with: { user: { columns: { name: true } } },
    orderBy: (logs, { desc: descFn }) => [descFn(logs.createdAt)],
    limit: 200,
  });

  return (
    <>
      <PageHeader title="Auditoria" description="Registo de ações realizadas na aplicação" />
      <Card>
        {logs.length === 0 ? (
          <EmptyState title="Sem registos" />
        ) : (
          <TableWrapper>
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className={tableClasses.th}>Data</th>
                  <th className={tableClasses.th}>Utilizador</th>
                  <th className={tableClasses.th}>Ação</th>
                  <th className={tableClasses.th}>Entidade</th>
                  <th className={tableClasses.th}>ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className={tableClasses.row}>
                    <td className={tableClasses.td}>{formatDateTime(log.createdAt)}</td>
                    <td className={tableClasses.td}>{log.user?.name ?? "Sistema"}</td>
                    <td className={tableClasses.td}>{log.action}</td>
                    <td className={tableClasses.td}>{log.entity}</td>
                    <td className={tableClasses.td}>{log.entityId ?? "—"}</td>
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
