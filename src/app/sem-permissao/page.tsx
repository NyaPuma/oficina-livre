import Link from "next/link";

export default function NoPermissionPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Sem permissão</h1>
        <p className="mt-2 text-sm text-slate-500">A sua conta não tem acesso a esta área.</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Voltar ao painel
        </Link>
      </div>
    </main>
  );
}

export const instant = false;
