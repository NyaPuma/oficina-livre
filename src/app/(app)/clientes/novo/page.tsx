import { Card, PageHeader } from "@/components/ui";
import { CustomerForm } from "@/components/forms/customer-form";

export default function NewCustomerPage() {
  return (
    <>
      <PageHeader title="Novo cliente" description="Os campos com * são obrigatórios" />
      <Card className="max-w-3xl p-6">
        <CustomerForm />
      </Card>
    </>
  );
}

export const instant = false;
