import { asc } from "drizzle-orm";
import { updateUser } from "@/actions/users";
import { UserForm } from "@/components/forms/user-form";
import { Badge, Card, PageHeader, TableWrapper, tableClasses } from "@/components/ui";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { formatDate } from "@/lib/format";


export default async function UsersPage() {
  const allUsers = await db.select().from(users).orderBy(asc(users.name));

  return (
    <>
      <PageHeader title="Utilizadores" description="Contas de acesso e permissões" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <TableWrapper>
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className={tableClasses.th}>Nome</th>
                  <th className={tableClasses.th}>Email</th>
                  <th className={tableClasses.th}>Perfil</th>
                  <th className={tableClasses.th}>Criado</th>
                  <th className={tableClasses.th}>Ativo</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => (
                  <tr key={user.id} className={tableClasses.row}>
                    <td className={`${tableClasses.td} font-medium`}>{user.name}</td>
                    <td className={tableClasses.td}>{user.email}</td>
                    <td className={tableClasses.td}>
                      <form action={updateUser} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={user.id} />
                        <select name="role" defaultValue={user.role} className="rounded border border-slate-300 px-2 py-1 text-sm">
                          <option value="mecanico">Mecânico</option>
                          <option value="gestor">Gestor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <label className="flex items-center gap-1 text-xs text-slate-500">
                          <input type="checkbox" name="active" defaultChecked={user.active} className="size-3.5 accent-slate-900" />
                          Ativo
                        </label>
                        <button type="submit" className="text-xs text-slate-500 hover:text-slate-900">Guardar</button>
                      </form>
                    </td>
                    <td className={tableClasses.td}>{formatDate(user.createdAt)}</td>
                    <td className={tableClasses.td}><Badge tone={user.active ? "green" : "red"}>{user.active ? "Sim" : "Não"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold text-slate-900">Novo utilizador</h2>
          <UserForm />
        </Card>
      </div>
    </>
  );
}

export const instant = false;
