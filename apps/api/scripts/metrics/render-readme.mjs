#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TEMPLATE = path.join(ROOT, "docs/templates/README.template.md");
const OUT = path.join(ROOT, "README.md");

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function write(p, c) {
  fs.writeFileSync(p, c, "utf8");
}

function block(lines) {
  return lines.map(l => `- ${l}`).join("\n");
}

// ✅ Fonte da verdade (centralizada)
const DATA = {
  PROD_URL: "https://production-manager-api.onrender.com",

  TECH_STACK: block([
    "Node.js 20 + TypeScript",
    "Fastify",
    "Prisma + PostgreSQL",
    "Zod",
    "Vitest"
  ]),

  PREREQS: block([
    "Node.js 20",
    "pnpm",
    "PostgreSQL ou DATABASE_URL"
  ]),

  ENV_REQUIRED: block([
    "DATABASE_URL",
    "OMIE_APP_KEY",
    "OMIE_APP_SECRET",
    "OMIE_BASE_URL"
  ]),

  ENV_OPTIONAL: block([
    "PORT (default 3333)",
    "CORS_ORIGIN",
    "ENABLE_STOCK_REFRESH_JOB",
    "STOCK_REFRESH_CRON",
    "OMIE_PRODUCT_SYNC_CRON"
  ]),

  SCRIPTS: block([
    "pnpm run dev",
    "pnpm run build",
    "pnpm run start",
    "pnpm metrics:update-docs",
    "pnpm docs:contract"
  ]),

  ARCH_OVERVIEW: block([
    "server.ts → bootstrap",
    "app.ts → Fastify + middlewares",
    "routes → HTTP",
    "services → regra de negócio",
    "repositories → Prisma",
    "jobs → cron"
  ]),

  ROUTES: block([
    "GET /v1/products (contrato público)",
    "GET /v1/products/:omieCode",
    "POST /v1/admin/omie/products/stock/refresh",
    "POST /v1/admin/omie/sync/products"
  ])
};

let tpl = read(TEMPLATE);

// ✅ substituição simples {{KEY}}
for (const [key, value] of Object.entries(DATA)) {
  tpl = tpl.replaceAll(`{{${key}}}`, value);
}

write(OUT, tpl);

console.log(JSON.stringify({
  ok: true,
  output: path.relative(ROOT, OUT)
}, null, 2));
``