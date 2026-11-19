import { expect, type Page } from "@playwright/test";

export const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@oficinalivre.local";
export const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Painel de operações", { exact: false }).or(page.getByText("A visão geral da oficina")).first()).toBeVisible();
}

export function suffix(): string {
  return Date.now().toString().slice(-6);
}

export function validPlate(): string {
  return `AA-${suffix().slice(0, 2)}-${suffix().slice(2, 4)}`;
}

/** Seleciona a primeira viatura associada ao cliente no formulário. */
export async function selectFirstVehicle(page: Page): Promise<void> {
  const customerSelect = page.locator('select[name="customerId"]').first();
  // Cliente de demonstração criado pelo seed, com a viatura 00-00-DD associada.
  await customerSelect.selectOption({ label: "Cliente Exemplo" });
  await expect(page.locator('select[name="vehicleId"]').first()).toBeEnabled();
  await page.locator('select[name="vehicleId"]').first().selectOption({ index: 1 });
}
