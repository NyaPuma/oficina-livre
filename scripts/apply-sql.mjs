#!/usr/bin/env node
/** Aplica um ficheiro SQL usando apenas a DATABASE_URL (sem necessidade de psql). */
import { readFileSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import pg from "pg";

config();
const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/apply-sql.mjs <ficheiro.sql>");
  process.exit(1);
}

const sql = readFileSync(path.join(process.cwd(), file), "utf8");
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL ?? "postgres://oficina:oficina@localhost:5432/oficina_livre",
});

await client.connect();
try {
  await client.query(sql);
  console.log(`✅ SQL aplicado: ${file}`);
} finally {
  await client.end();
}
