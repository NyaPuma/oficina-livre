import { expect, test } from "@playwright/test";
import { login, suffix, validPlate } from "./helpers";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("cria cliente e adiciona viatura", async ({ page }) => {
  const name = `Cliente E2E ${suffix()}`;
  const plate = validPlate();

  await page.goto("/clientes/novo");
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="nif"]').fill("999888777");
  await page.locator('input[name="phone"]').fill("912345678");
  await page.locator('input[name="email"]').fill(`e2e${suffix()}@exemplo.pt`);
  await page.getByRole("button", { name: /Guardar cliente/ }).click();

  await expect(page).toHaveURL(/\/clientes\/\d+/);
  await expect(page.getByText("Cliente criado com sucesso")).toBeVisible();
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();

  const vehicleForm = page.locator("form").filter({ hasText: "Adicionar viatura" });
  await vehicleForm.locator('input[name="plate"]').fill(plate);
  await vehicleForm.locator('input[name="brand"]').fill("Seat");
  await vehicleForm.locator('input[name="model"]').fill("Ibiza");
  await vehicleForm.getByRole("button", { name: /Adicionar viatura/ }).click();

  await expect(page.getByText(plate).first()).toBeVisible();
});
