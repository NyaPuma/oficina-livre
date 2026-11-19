#!/usr/bin/env node
/** Mede o tempo de resposta das páginas principais com a sessão de administrador. */
import { chromium } from "@playwright/test";

const base = process.env.BENCH_URL ?? "http://localhost:3000";
const routes = [
  "/",
  "/clientes?q=STRESS",
  "/ordens",
  "/relatorios",
  "/faturacao",
  "/stock",
  "/agenda",
  "/api/export/dados",
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/login`);
await page.locator('input[name="email"]').fill(process.env.SEED_ADMIN_EMAIL ?? "admin@oficinalivre.local");
await page.locator('input[name="password"]').fill(process.env.SEED_ADMIN_PASSWORD ?? "admin123");
await page.locator('form button[type="submit"]').click();
await page.waitForURL(/\/$/);

console.log("\n⏱️  Tempos de resposta (ms)\n");
for (const route of routes) {
  const times = [];
  for (let i = 0; i < 3; i += 1) {
    const start = performance.now();
    const response = await page.request.get(`${base}${route}`);
    await response.body();
    times.push(Math.round(performance.now() - start));
    if (!response.ok()) console.warn(`  ⚠️ ${route} -> ${response.status()}`);
  }
  console.log(`  ${route.padEnd(24)} ${times.join(" / ")}`);
}
await browser.close();
