import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("cria diagnóstico digital e cliente confirma receção", async ({ page, context }) => {
  await login(page);
  await page.goto("/ordens/1/diagnostico");

  const createButton = page.getByRole("button", { name: /Criar diagnóstico digital/ });
  if (await createButton.isVisible()) {
    await createButton.click();
  }
  await expect(page.getByText("Itens inspecionados")).toBeVisible();

  await page.getByRole("button", { name: /Partilhar relatório|Reenviar relatório/ }).click();
  const publicLink = page.locator("a", { hasText: "Abrir link público" });
  await expect(publicLink).toBeVisible();
  const href = await publicLink.getAttribute("href");
  expect(href).toMatch(/^\/diagnostico\/[a-f0-9]+$/);

  const publicPage = await context.newPage();
  await publicPage.goto(href!);
  await expect(publicPage.getByRole("heading", { name: "Relatório de diagnóstico" })).toBeVisible();

  const nameInput = publicPage.locator('input[name="name"]');
  if (await nameInput.isVisible()) {
    await nameInput.fill("Cliente E2E");
    await publicPage.getByRole("button", { name: /Confirmar receção do diagnóstico/ }).click();
  }
  await expect(publicPage.getByText(/Receção confirmada/i)).toBeVisible();
  await publicPage.close();
});
