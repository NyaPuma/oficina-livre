import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("pesquisa de peça pelo campo de código", async ({ page }) => {
  await login(page);
  await page.goto("/stock");

  await expect(page.getByText("Ler código de barras")).toBeVisible();
  await page.locator('input[placeholder*="Código, descrição"]').fill("FILTRO");
  await expect(page.getByText(/Filtro de óleo/).first()).toBeVisible();
});
