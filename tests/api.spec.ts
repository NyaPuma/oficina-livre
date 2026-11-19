import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("API pública exige chave", async ({ request }) => {
  const response = await request.get("/api/v1/clientes");
  expect(response.status()).toBe(401);
});

test("job de lembretes exige segredo", async ({ request }) => {
  const response = await request.get("/api/cron/reminders");
  expect(response.status()).toBe(401);
});

test("exportação JSON exige sessão e devolve dados", async ({ page }) => {
  const before = await page.request.get("/api/export/dados", { maxRedirects: 0 });
  expect([307, 401]).toContain(before.status());

  await login(page);
  const response = await page.request.get("/api/export/dados");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty("customers");
  expect(body).toHaveProperty("version", 1);
});
