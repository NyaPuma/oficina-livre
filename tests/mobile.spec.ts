import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("modo mecânico mantém dados visíveis quando a ligação cai", async ({ page, context }) => {
  await page.goto("/movel");
  await expect(page.getByText("As minhas reparações")).toBeVisible();
  await expect(page.getByText("Online", { exact: true })).toBeVisible();

  const firstOrder = page.locator("a[href^='/movel/ordens/']").first();
  await expect(firstOrder).toBeVisible();
  const orderNumber = (await firstOrder.innerText()).split("\n")[0];
  expect(orderNumber).toMatch(/OR-\d{4}-\d{4}/);

  await context.setOffline(true);
  await expect(page.getByText("Offline", { exact: true })).toBeVisible();
  await expect(page.getByText(orderNumber)).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByText("Online", { exact: true })).toBeVisible();

  await page.goto("/movel/ordens/1");
  await expect(page.getByRole("button", { name: /Guardar estado/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Guardar diagnóstico/ })).toBeVisible();
});
