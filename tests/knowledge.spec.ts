import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("biblioteca encontra artigos por sintoma e por código OBD", async ({ page }) => {
  await page.goto("/biblioteca");
  await expect(page.getByRole("heading", { name: "Biblioteca técnica" })).toBeVisible();

  const search = page.locator('input[name="query"]').first();
  await search.fill("barulho ao travar");
  await page.getByRole("button", { name: /Pesquisar/ }).click();
  await expect(page.getByText(/Barulho ao travar ou travagem menos eficaz/)).toBeVisible();

  await search.fill("P0300");
  await page.getByRole("button", { name: /Pesquisar/ }).click();
  await expect(page.getByText(/Código P0300/)).toBeVisible();
});

test("ordem de serviço permite consultar seguridad do veículo", async ({ page }) => {
  await page.goto("/ordens/1");
  await expect(page.getByText("Ajuda ao diagnóstico")).toBeVisible();

  const safety = page.locator("section").filter({ hasText: "Segurança do veículo" });
  await safety.getByRole("button", { name: /Verificar recalls e queixas/ }).click();
  await expect(safety.getByText(/Consulta concluída|Sem marca|Não encontrada/)).toBeVisible();
});
