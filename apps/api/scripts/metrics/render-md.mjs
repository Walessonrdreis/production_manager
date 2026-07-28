#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd(); // rode a partir de apps/api

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeText(p, s) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, s, "utf8");
}

function writeJson(p, obj) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}

function humanBytes(n) {
  const units = ["B","KB","MB","GB","TB"];
  let i = 0;
  let x = Number(n || 0);
  while (x >= 1024 && i < units.length - 1) { x /= 1024; i++; }
  return `${x.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function fmtInt(n) {
  const x = Number(n || 0);
  return x.toLocaleString("pt-BR");
}

function isoToLocal(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", { hour12: false });
  } catch {
    return String(iso);
  }
}

function pickResult(report, filename) {
  // report.results["tree.mjs"] etc.
  return report?.results?.[filename] ?? null;
}

function mdCodeBlock(text) {
  return ["```", text.trimEnd(), "```"].join("\n");
}

function mdList(items) {
  if (!items || items.length === 0) return "_(vazio)_";
  return items.map(x => `- ${x}`).join("\n");
}

function safe(obj, fallback) {
  return obj === undefined || obj === null ? fallback : obj;
}

function buildTreeSection(treeRes) {
  if (!treeRes?.tree) return "_(tree não disponível)_";
  // Mostrar apenas caminhos mais “humanos”
  const lines = treeRes.tree
    .slice(0, 200) // evita md gigante
    .map(i => i.type === "dir" ? `📁 ${i.path}` : `📄 ${i.path}`);
  const note = treeRes.tree.length > 200 ? `\n_(mostrando 200 de ${treeRes.tree.length})_` : "";
  return mdCodeBlock(lines.join("\n")) + note;
}

function buildLocSection(locRes) {
  if (!locRes) return "_(LOC não disponível)_";
  const totalFiles = safe(locRes.totalFiles, 0);
  const totalLines = safe(locRes.totalLines, 0);
  const top = Array.isArray(locRes.topFiles) ? locRes.topFiles : [];

  const topLines = top.slice(0, 15).map(f => `- \`${f.file}\` — **${fmtInt(f.lines)}** linhas`).join("\n") || "_(sem top files)_";

  return [
    `- **Arquivos analisados**: ${fmtInt(totalFiles)}`,
    `- **Linhas (aprox.)**: ${fmtInt(totalLines)}`,
    "",
    "### Top arquivos (por linhas)",
    topLines
  ].join("\n");
}

function buildSizesSection(sizesRes) {
  if (!sizesRes) return "_(sizes não disponível)_";
  const total = safe(sizesRes.totalBytes, 0);
  const folders = sizesRes.byFolder ? Object.entries(sizesRes.byFolder) : [];
  const topFolders = folders.slice(0, 10).map(([k, v]) => `- \`${k}\` — **${v.bytesHuman ?? humanBytes(v.bytes)}** (${fmtInt(v.files)} arquivos)`).join("\n") || "_(sem pastas)_";

  const topFiles = Array.isArray(sizesRes.topFiles)
    ? sizesRes.topFiles.slice(0, 10).map(f => `- \`${f.file}\` — **${f.bytesHuman ?? humanBytes(f.bytes)}**`).join("\n")
    : "_(sem arquivos)_";

  return [
    `- **Tamanho total (escopo)**: ${humanBytes(total)}`,
    "",
    "### Top pastas (por tamanho)",
    topFolders,
    "",
    "### Top arquivos (por tamanho)",
    topFiles
  ].join("\n");
}

function buildEndpointsSection(endRes) {
  if (!endRes) return "_(endpoints não disponível)_";
  const counts = endRes.counts ?? {};
  const total = safe(counts.total, 0);
  const lines = [
    `- **Total detectado (heurística)**: ${fmtInt(total)}`,
    `- **GET**: ${fmtInt(counts.GET ?? 0)}`,
    `- **POST**: ${fmtInt(counts.POST ?? 0)}`,
    `- **PUT**: ${fmtInt(counts.PUT ?? 0)}`,
    `- **PATCH**: ${fmtInt(counts.PATCH ?? 0)}`,
    `- **DELETE**: ${fmtInt(counts.DELETE ?? 0)}`
  ];

  // Mostrar lista resumida (evitar gigante)
  const eps = Array.isArray(endRes.endpoints) ? endRes.endpoints : [];
  const preview = eps.slice(0, 40).map(e => `${e.method} ${e.path}  (${e.file})`);
  const note = eps.length > 40 ? `\n_(mostrando 40 de ${eps.length})_` : "";

  return lines.join("\n") + "\n\n### Preview de endpoints\n" + mdCodeBlock(preview.join("\n")) + note;
}

function buildDriftSection(driftRes) {
  if (!driftRes) return "_(drift não disponível)_";
  const onlyInDocs = driftRes.onlyInDocs ?? [];
  const onlyInCode = driftRes.onlyInCode ?? [];

  return [
    `- **Documentados**: ${fmtInt(driftRes.documentedCount ?? 0)}`,
    `- **Detectados no código**: ${fmtInt(driftRes.detectedCount ?? 0)}`,
    "",
    "### Só nos docs (documentado, não detectado)",
    mdList(onlyInDocs.map(x => `\`${x}\``)),
    "",
    "### Só no código (detectado, não documentado)",
    mdList(onlyInCode.map(x => `\`${x}\``)),
  ].join("\n");
}

function buildPrismaSection(prismaRes) {
  if (!prismaRes) return "_(prisma schema não disponível)_";
  const modelCount = prismaRes.modelCount ?? 0;
  const models = Array.isArray(prismaRes.models) ? prismaRes.models : [];
  const modelLines = models.slice(0, 20).map(m => `- **${m.name}** (${m.fields?.length ?? 0} campos)`).join("\n") || "_(sem models)_";
  const note = models.length > 20 ? `\n_(mostrando 20 de ${models.length})_` : "";

  return [
    `- **Models**: ${fmtInt(modelCount)}`,
    "",
    "### Models (preview)",
    modelLines + note
  ].join("\n");
}

function buildMigrationsSection(migRes) {
  if (!migRes) return "_(migrations não disponível)_";
  const total = migRes.migrations ?? 0;
  const latest = Array.isArray(migRes.latest) ? migRes.latest : [];
  const missing = Array.isArray(migRes.missingSql) ? migRes.missingSql : [];

  const latestLines = latest.slice(0, 10).map(m => `- \`${m.name}\` ${m.hasSql ? "" : "**(sem migration.sql)**"} (${humanBytes(m.bytes ?? 0)})`).join("\n") || "_(sem migrations)_";

  return [
    `- **Total**: ${fmtInt(total)}`,
    "",
    "### Últimas migrations (preview)",
    latestLines,
    "",
    "### Pastas com SQL ausente (atenção)",
    missing.length ? mdList(missing.map(x => `\`${x}\``)) : "_(nenhuma)_"
  ].join("\n");
}

function buildEnvSection(envRes) {
  if (!envRes) return "_(env-check não disponível)_";
  const missing = envRes.missing ?? [];
  return [
    `- **Fonte**: ${envRes.env ?? "process.env"} (comparado com ${envRes.example ?? "N/A"})`,
    `- **Missing keys**: ${fmtInt(missing.length)}`,
    "",
    "### Missing (chaves esperadas e ausentes)",
    missing.length ? mdList(missing.map(x => `\`${x}\``)) : "_(nenhuma)_"
  ].join("\n");
}

function buildExportsSection(expRes) {
  if (!expRes) return "_(exports não disponível)_";
  const totalExports = expRes.totalExports ?? 0;
  const top = Array.isArray(expRes.topFiles) ? expRes.topFiles : [];
  const topLines = top.slice(0, 10).map(x => `- \`${x.file}\` — **${fmtInt(x.exports)} exports**`).join("\n") || "_(sem dados)_";
  return [
    `- **Total exports (heurística)**: ${fmtInt(totalExports)}`,
    "",
    "### Top arquivos (exports)",
    topLines
  ].join("\n");
}

// ---------- Main ----------
const args = new Set(process.argv.slice(2));
const inPath = path.join(ROOT, "metrics-report.json");
const outMd = path.join(ROOT, "docs", "REPO_STATUS.md");
const historyDir = path.join(ROOT, "docs", "history");

if (!fs.existsSync(inPath)) {
  console.error(JSON.stringify({ ok: false, error: "metrics-report.json not found", expected: inPath }, null, 2));
  process.exit(1);
}

const report = readJson(inPath);
const generatedAt = report.generatedAt ?? new Date().toISOString();

const treeRes = pickResult(report, "tree.mjs");
const locRes = pickResult(report, "loc.mjs");
const sizesRes = pickResult(report, "sizes.mjs");
const endpointsRes = pickResult(report, "endpoints.mjs");
const driftRes = pickResult(report, "endpoints-drift.mjs");
const prismaRes = pickResult(report, "prisma-schema.mjs");
const migRes = pickResult(report, "migrations.mjs");
const envRes = pickResult(report, "env-check.mjs");
const expRes = pickResult(report, "exports.mjs");

const md = [
  "# Production Manager API — Status do Repositório",
  "",
  `_Gerado automaticamente em **${isoToLocal(generatedAt)}**_`,
  "",
  "---",
  "",
  "## 📌 Visão rápida",
  "",
  "- Este arquivo é **atualizado automaticamente** (sobrescrito a cada execução).",
  "- O contrato público da API é centrado em **GET /v1/products**.",
  "- Para histórico técnico, veja `docs/history/*.metrics.json` (opcional).",
  "",
  "---",
  "",
  "## 📁 Estrutura (apps/api/src)",
  "",
  buildTreeSection(treeRes),
  "",
  "---",
  "",
  "## 📏 Linhas de código (LOC)",
  "",
  buildLocSection(locRes),
  "",
  "---",
  "",
  "## 💾 Tamanho por pasta/arquivo",
  "",
  buildSizesSection(sizesRes),
  "",
  "---",
  "",
  "## 🌐 Endpoints (detecção heurística)",
  "",
  buildEndpointsSection(endpointsRes),
  "",
  "---",
  "",
  "## 🔎 Drift (docs vs código)",
  "",
  buildDriftSection(driftRes),
  "",
  "---",
  "",
  "## 🧬 Prisma (schema)",
  "",
  buildPrismaSection(prismaRes),
  "",
  "---",
  "",
  "## 🧾 Migrations",
  "",
  buildMigrationsSection(migRes),
  "",
  "---",
  "",
  "## 🔐 Env (chaves esperadas)",
  "",
  buildEnvSection(envRes),
  "",
  "---",
  "",
  "## 📦 Exports (complexidade aproximada)",
  "",
  buildExportsSection(expRes),
  "",
].join("\n");

writeText(outMd, md);

// Snapshot histórico opcional
if (args.has("--history")) {
  ensureDir(historyDir);
  const stamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+$/, "");
  const histPath = path.join(historyDir, `${stamp}.metrics.json`);
  writeJson(histPath, report);
}

console.log(JSON.stringify({
  ok: true,
  input: "metrics-report.json",
  output: path.relative(ROOT, outMd),
  historySaved: args.has("--history")
}, null, 2));
``
