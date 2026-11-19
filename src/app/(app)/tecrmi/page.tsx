import { asc } from "drizzle-orm";
import { TecRmiWorkbench } from "@/components/forms/tecrmi-workbench";
import { PageHeader } from "@/components/ui";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";
import { isTecRmiConfigured } from "@/lib/tecrmi";

export default async function TecRmiPage() {
  const rows = await db.select().from(vehicles).orderBy(asc(vehicles.plate)).limit(200);
  const configured = isTecRmiConfigured();

  return (
    <>
      <PageHeader
        title="TecRMI — reparação e manutenção"
        description="Tempos de reparação, dados técnicos e planos de manutenção por viatura"
      />

      <div className={`mb-6 rounded-lg px-4 py-3 text-xs ${configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
        {configured
          ? "Fornecedor TecRMI configurado — os dados provêm do serviço licenciado."
          : "Sem credenciais TecRMI: valores de demonstração. O TecRMI exige licença própria da TecAlliance e é distinto do TecDoc."}
      </div>

      <TecRmiWorkbench
        vehicles={rows.map((vehicle) => ({
          id: vehicle.id,
          label: `${vehicle.plate} · ${[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ")}`,
          mileage: vehicle.mileage,
        }))}
      />
    </>
  );
}

export const instant = false;
