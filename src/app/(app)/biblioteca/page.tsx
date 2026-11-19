import { BookOpen, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { KnowledgeSearch } from "@/components/forms/knowledge-search";
import { Card, PageHeader } from "@/components/ui";

export default function BibliotecaPage() {
  return (
    <>
      <PageHeader
        title="Biblioteca técnica"
        description="Sintomas, causas prováveis, diagnóstico e correcção — apoio ao mecânico"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="panel flex items-start gap-3 p-4">
          <BookOpen size={18} className="mt-0.5 shrink-0 text-brandstrong" />
          <div>
            <p className="text-sm font-semibold text-ink">Base local de conhecimento</p>
            <p className="mt-1 text-xs text-slate-500">
              Artigos genéricos por sistema e códigos OBD-II mais comuns. Funciona sem ligação a serviços externos.
            </p>
          </div>
        </div>
        <div className="panel flex items-start gap-3 p-4">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-ink">Recalls e queixas reais</p>
            <p className="mt-1 text-xs text-slate-500">
              Disponíveis em cada ordem de serviço, com dados gratuitos da NHTSA para marca/modelo/ano.
            </p>
            <Link href="/ordens" className="mt-1 inline-block text-xs text-slate-600 underline">Ir para ordens →</Link>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <KnowledgeSearch />
      </Card>

      <p className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <strong>Aviso:</strong> esta biblioteca é informação geral e não substitui o manual técnico do fabricante.
        Confirme sempre especificações, valores de torque, pinagens e procedimentos antes de intervir.
      </p>
    </>
  );
}

export const instant = false;
