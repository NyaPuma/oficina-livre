import { expect, test } from "@playwright/test";
import { login, selectFirstVehicle } from "./helpers";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("cria orçamento e obtém aprovação digital pelo link público", async ({ page, context }) => {
  await page.goto("/orcamentos/novo");
  await selectFirstVehicle(page);

  // O editor de linhas tem dois selects sem name: tipo e_item.
  await page.locator("form select:not([name])").nth(1).selectOption({ index: 1 });
  await page.getByRole("button", { name: /Criar orçamento/ }).click();

  await expect(page).toHaveURL(/\/orcamentos\/\d+/);
  await expect(page.getByRole("heading", { name: /Orçamento OC-/ })).toBeVisible();

  await page.getByRole("button", { name: /Preparar aprovação digital|Reenviar para aprovação/ }).click();
  const publicLink = page.locator("a", { hasText: "Abrir link público de aprovação" });
  await expect(publicLink).toBeVisible();
  const href = await publicLink.getAttribute("href");
  expect(href).toMatch(/^\/orcamento\/[a-f0-9]+$/);

  const publicPage = await context.newPage();
  await publicPage.goto(href!);
  await expect(publicPage.getByRole("heading", { name: /Orçamento OC-/ })).toBeVisible();
  await publicPage.locator('input[name="name"]').fill("Cliente E2E");
  await publicPage.getByRole("button", { name: /Aprovar orçamento/ }).click();
  await expect(publicPage.getByText(/aprovado digitalmente/i)).toBeVisible();
  await publicPage.close();
});
