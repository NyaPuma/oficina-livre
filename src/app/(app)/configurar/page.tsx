import { SetupWizard } from "@/components/forms/setup-wizard";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getSetupStatus, SETUP_SECTIONS } from "@/lib/setup";

export default async function ConfigurarPage() {
  await requireRole("admin");
  const status = await getSetupStatus();

  return (
    <>
      <PageHeader
        title="Configuração inicial"
        description="Chaves, tokens e serviços da aplicação num só lugar"
      />
      <SetupWizard sections={SETUP_SECTIONS} initialStatus={status} />
    </>
  );
}

export const instant = false;
