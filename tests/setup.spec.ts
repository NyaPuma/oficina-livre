import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("assistente de configuração lista as secções e o estado", async ({ page }) => {
  await login(page);
  await page.goto("/configurar");
  await expect(page.getByRole("heading", { name: "Configuração inicial" })).toBeVisible();
  await expect(page.getByText("Pagamentos", { exact: true })).toBeVisible();
  await expect(page.getByText("Catálogos técnicos", { exact: true })).toBeVisible();

  const response = await page.request.get("/api/setup");
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { status: Record<string, boolean> };
  expect(body.status).toHaveProperty("STRIPE_SECRET_KEY");
  expect(body.status).toHaveProperty("TECRMI_API_KEY");
});
