import { expect, test } from "@playwright/test";
import { login, selectFirstVehicle, suffix, validPlate } from "./helpers";

test("reserva online pública regista marcação", async ({ page }) => {
  const date = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await page.goto("/agendar");
  await page.locator('input[name="name"]').fill(`Reserva E2E ${suffix()}`);
  await page.locator('input[name="phone"]').fill("913333444");
  await page.locator('input[name="plate"]').fill(validPlate());
  await page.locator('input[name="date"]').fill(date);
  await page.locator('input[name="time"]').fill("10:30");
  await page.locator('textarea[name="description"]').fill("Revisão completa");
  await page.getByRole("button", { name: /Pedir marcação/ }).click();

  await expect(page.getByText(/Marcação registada/)).toBeVisible();
});

test("rececionista cria marcação na agenda", async ({ page }) => {
  await login(page);
  const date = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const local = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T11:00`;

  await page.goto("/agenda/novo");
  await selectFirstVehicle(page);
  await page.locator('input[name="startsAt"]').fill(local);
  const ramp = `Rampa E2E ${suffix()}`;
  await page.locator('input[name="ramp"]').fill(ramp);
  await page.getByRole("button", { name: /Marcar$/ }).click();

  await expect(page).toHaveURL(/\/agenda$/);
  await expect(page.getByText(ramp).first()).toBeVisible();
});
