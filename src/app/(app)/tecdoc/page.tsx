import { Database } from "lucide-react";
import { TecDocSearch } from "@/components/forms/tecdoc-search";
import { Card, PageHeader } from "@/components/ui";

export default function TecDocPage() {
  const configured = Boolean(process.env.TECDOC_API_URL);

  return (
    <>
      <PageHeader title="TecDoc / catálogo de peças" description="Pesquisa de referências e importação para o stock" />
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-medium flex items-center gap-2"><Database size={16} /> {configured ? "Fornecedor TecDoc configurado" : "Modo demonstração"}</p>
        <p className="mt-1">
          {configured
            ? "As pesquisas são enviadas para o endpoint configurado em TECDOC_API_URL."
            : "O TecDoc é um serviço comercial. Sem TECDOC_API_URL e credenciais válidas, é usado um catálogo local de demonstração — não são dados reais do TecDoc."}
        </p>
      </div>
      <Card className="max-w-5xl p-6">
        <TecDocSearch />
      </Card>
    </>
  );
}

export const instant = false;
