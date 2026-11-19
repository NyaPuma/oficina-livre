#!/usr/bin/env node
/**
 * Iniciador simples do Oficina Livre.
 *   npm run launch        -> prepara .env, BD, migrações, seed, build e arranca
 *   npm run setup         -> apenas prepara .env, BD e dados iniciais
 */
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");
const setupOnly = process.argv.includes("--setup-only");
const skipBuild = process.argv.includes("--no-build");

function log(message) {
  console.log(`\n🚀 ${message}`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    console.error(`\n❌ Falhou: ${command} ${args.join(" ")}`);
    process.exit(result.status ?? 1);
  }
}

function parseEnv(file) {
  const values = {};
  if (!existsSync(file)) return values;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    values[key] = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
  return values;
}

function ensureEnv() {
  if (!existsSync(envPath)) {
    if (!existsSync(examplePath)) {
      console.error("Não encontrei .env.example.");
      process.exit(1);
    }
    copyFileSync(examplePath, envPath);
    log("Ficheiro .env criado a partir do modelo.");
  }

  let content = readFileSync(envPath, "utf8");
  const generated = {};
  for (const key of ["SESSION_SECRET", "API_KEY", "CRON_SECRET"]) {
    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (!pattern.test(content)) {
      content += `\n${key}=${randomBytes(24).toString("hex")}\n`;
    } else if (!content.match(pattern)[0].split("=")[1]?.trim()) {
      const value = randomBytes(24).toString("hex");
      content = content.replace(pattern, `${key}=${value}`);
      generated[key] = value;
    }
  }
  writeFileSync(envPath, content, { mode: 0o600 });
  if (Object.keys(generated).length) log(`Segredos gerados: ${Object.keys(generated).join(", ")}`);

  const env = parseEnv(envPath);
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) process.env[key] = value;
  }
  return env;
}

function startDatabase() {
  try {
    const check = spawnSync("docker", ["compose", "ps", "--status", "running"], { cwd: root, encoding: "utf8" });
    if (check.status !== 0) {
      console.warn("⚠️ Docker/Compose não disponível — assumindo PostgreSQL externo.");
      return;
    }
    log("A arrancar PostgreSQL...");
    run("docker", ["compose", "up", "-d"]);
  } catch {
    console.warn("⚠️ Docker não encontrado — assumindo PostgreSQL externo.");
  }
}

function main() {
  log("Preparação do Oficina Livre");
  const env = ensureEnv();

  startDatabase();

  log("A aplicar migrações...");
  run("npx", ["drizzle-kit", "push", "--force"]);

  log("A criar dados iniciais...");
  run("npm", ["run", "db:seed"]);

  if (!setupOnly) {
    if (!skipBuild) {
      log("A compilar a aplicação...");
      run("npm", ["run", "build"]);
    }
    const port = env.PORT ?? "3000";
    log(`A arrancar em http://localhost:${port}`);
    console.log(`\n👤 Utilizador inicial: ${env.SEED_ADMIN_EMAIL ?? "admin@oficinalivre.local"}`);
    console.log(`🔑 Palavra-passe: ${env.SEED_ADMIN_PASSWORD ?? "admin123"}`);
    console.log("⚙️  Configurar APIs/tokens: /configurar (Administrador)\n");
    const child = spawn("npm", ["start"], { cwd: root, stdio: "inherit", env: process.env, shell: process.platform === "win32" });
    const shutdown = () => child.kill("SIGINT");
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    child.on("exit", (code) => process.exit(code ?? 0));
  } else {
    log("Preparação concluída. Execute npm run launch para arrancar.");
  }
}

main();
