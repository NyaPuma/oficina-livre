import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("TecRMI calcula tempo de reparação em modo demonstração", async ({ page }) => {
  await login(page);
  await page.goto("/tecrmi");
  await expect(page.getByRole("heading", { name: /TecRMI/ })).toBeVisible();

  const input = page.locator('input[placeholder*="pastilhas"]').first();
  await input.fill("pastilhas de travão");
  await page.getByRole("button", { name: /Calcular/ }).click();

  await expect(page.getByText(/Demonstração/).first()).toBeVisible();
  await expect(page.getByText(/h$/).first()).toBeVisible();
});
