import { expect, test } from "@playwright/test";
import { login, selectFirstVehicle, suffix } from "./helpers";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("cria ordem de serviço, usa assistente e gera PDF", async ({ page }) => {
  await page.goto("/ordens/novo");
  await selectFirstVehicle(page);
  await page.locator("form select:not([name])").nth(1).selectOption({ index: 1 });
  await page.locator('input[name="complaint"]').fill(`Barulho no motor ${suffix()}`);
  await page.locator('input[name="odometer"]').fill("62000");
  await page.getByRole("button", { name: /Criar ordem de serviço/ }).click();

  await expect(page).toHaveURL(/\/ordens\/\d+/);
  await expect(page.getByRole("heading", { name: /Ordem de serviço OR-/ })).toBeVisible();
  const id = page.url().split("/").at(-1)!;

  await page.getByRole("button", { name: /Gerar sugestões/ }).click();
  await expect(page.getByText(/Sugestões baseadas em regras locais/)).toBeVisible();
  const assistant = page.locator("section").filter({ hasText: "Assistente de oficina" });
  await expect(assistant.getByText(/Próxima revisão estimada/)).toBeVisible();

  const statusSelect = page.locator('select[name="status"]').first();
  await statusSelect.selectOption("em_reparacao");
  await page.getByRole("button", { name: "Atualizar" }).click();
  await expect(page.getByText("Em reparação").first()).toBeVisible();

  const pdf = await page.request.get(`/api/documents/ordem/${id}`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
});
