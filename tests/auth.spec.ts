import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("visitante é redirecionado para o login", async ({ page }) => {
  await page.goto("/clientes");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Iniciar sessão" })).toBeVisible();
});

test("administrador consegue entrar e terminar sessão", async ({ page }) => {
  await login(page);
  await expect(page.getByText("Administrador", { exact: true }).first()).toBeVisible();

  await page.locator('button[title="Terminar sessão"]').click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Iniciar sessão" })).toBeVisible();
});
