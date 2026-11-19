import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("emite fatura a partir de OS, regista pagamento e gera recibo", async ({ page }) => {
  await page.goto("/ordens/1");
  await page.getByRole("button", { name: /Emitir fatura/ }).click();

  await expect(page).toHaveURL(/\/faturacao\/\d+/);
  await expect(page.getByRole("heading", { name: /Fatura FT-/ })).toBeVisible();
  const id = page.url().split("/").at(-1)!;

  await page.getByRole("button", { name: /Registar pagamento/ }).click();
  await expect(page.getByText("paga", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Abrir recibo PDF")).toBeVisible();

  const receipt = await page.request.get(`/api/documents/recibo/${id}`);
  expect(receipt.status()).toBe(200);
  expect(receipt.headers()["content-type"]).toContain("application/pdf");

  await expect(page.getByText(/Fatura certificada \(AT\)/)).toBeVisible();
});
