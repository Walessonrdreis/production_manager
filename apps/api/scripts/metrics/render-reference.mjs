#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd(); // rode a partir de apps/api
const SRC = path.join(ROOT, "src");
const OUT_DIR = path.join(ROOT, "docs", "reference");
const FILES_DIR = path.join(OUT_DIR, "files");

// Configurações (ajuste se quiser)
const MAX_FILES_PER_DIR = 200;       // evita explosão
const GENERATE_FILE_DOCS = true;     // gera docs/reference/files/*.md
const MAX_ENDPOINT_PREVIEW = 80;     // preview por pasta
const MAX_EXPORTS_PREVIEW = 80;
const MAX_IMPORTS_PREVIEW = 80;

// Ignorar
const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", ".pnpm", ".turbo", ".cache"]);

// Regexes úteis (heurísticas)
const reEndpoint = /\b(app|router|fastify)\.(get|post|put|patch|delete)\s*\(\s*(['"`])([^'"`]+)\3/g;
const reExport = /\bexport\s+(async\s+)?function\s+(\w+)\b|\bexport\s+const\s+(\w+)\b|\bexport\s+class\s+(\w+)\b|\bexport\s+\{\s*([^}]+)\}/g;
const reImport = /^\s*import\s+[^'"]+['"]\s*;?/gm;

// Helpers
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
function writeFile(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
}
function readFile(p) {
  return fs.readFileSync(p, "utf8");
}
function rel(p) {
  return path.relative(ROOT, p).replaceAll("\\", "/");
}
function isIgnored(fullPath) {
  const parts = fullPath.split(path.sep);
  return parts.some(part => IGNORE_DIRS.has(part));
}
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (isIgnored(full)) continue;
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
function mdLink(text, targetRelPath) {
  // targetRelPath é relativo ao arquivo que vai conter o link
  return `${targetRelPath}`;
}
function mdCodeBlock(s, lang = "") {
  return `\`\`\`${lang}\n${s}\n\`\`\``;
}
function mdList(items) {
  if (!items || items.length === 0) return "_(vazio)_";
  return items.map(x => `- ${x}`).join("\n");
}
function toSlugFileName(filePath) {
  // transforma src/routes/products.ts -> src_routes_products.ts.md
  return rel(filePath).replaceAll("/", "_") + ".md";
}
function guessRole(filePathRel) {
  const p = filePathRel;
  if (p.includes("src/routes/")) return "HTTP Routes";
  if (p.includes("src/controllers/")) return "Controllers (HTTP handlers)";
  if (p.includes("src/services/")) return "Services (Business logic)";
  if (p.includes("src/jobs/")) return "Jobs (Cron/Automation)";
  if (p.includes("src/repositories/")) return "Repositories (DB/Prisma access)";
  if (p.includes("src/integrations/")) return "Integrations (External APIs)";
  if (p.includes("src/contracts/")) return "Contracts (Public/API schemas)";
  if (p.includes("src/lib/")) return "Lib (Shared helpers)";
  if (p.includes("src/middlewares/")) return "Middlewares";
  if (p.includes("src/plugins/")) return "Plugins";
  if (p.includes("src/utils/")) return "Utils";
  if (p.endsWith("src/app.ts")) return "App bootstrap (Fastify setup)";
  if (p.endsWith("src/server.ts")) return "Entrypoint (listen)";
  return "Other";
}
function extractEndpoints(text) {
  const list = [];
  let m;
  while ((m = reEndpoint.exec(text))) {
    list.push({ method: m[2].toUpperCase(), path: m[4] });
  }
  return list;
}
function extractExports(text) {
  const list = [];
  let m;
  while ((m = reExport.exec(text))) {
    const fn = m[2] || m[3] || m[4];
    const named = m[5];
    if (fn) list.push(fn);
    else if (named) {
      // export { a, b as c }
      named.split(",").map(s => s.trim()).filter(Boolean).forEach(x => list.push(x));
    }
  }
  // Dedup mantendo ordem
  const seen = new Set();
  return list.filter(x => (seen.has(x) ? false : (seen.add(x), true)));
}
function extractImports(text) {
  const list = [];
  let m;
  while ((m = reImport.exec(text))) {
    list.push(m[1]);
  }
  // separar internos vs externos
  const internal = [];
  const external = [];
  for (const imp of list) {
    if (imp.startsWith(".") || imp.startsWith("/")) internal.push(imp);
    else external.push(imp);
  }
  return { internal, external };
}

function summarizeFile(filePath) {
  const text = readFile(filePath);
  const r = rel(filePath);
  const role = guessRole(r);
  const endpoints = (r.endsWith(".ts") || r.endsWith(".js")) ? extractEndpoints(text) : [];
  const exports = (r.endsWith(".ts") || r.endsWith(".js")) ? extractExports(text) : [];
  const imports = (r.endsWith(".ts") || r.endsWith(".js")) ? extractImports(text) : { internal: [], external: [] };
  const lines = text.split(/\r\n|\r|\n/).length;
  const bytes = Buffer.byteLength(text, "utf8");

  return {
    filePath,
    relPath: r,
    role,
    lines,
    bytes,
    endpoints,
    exports,
    imports
  };
}

function groupByTopFolder(filesSummary) {
  // agrupa por src/<folder>
  const groups = {};
  for (const f of filesSummary) {
    const parts = f.relPath.split("/");
    const key = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
    groups[key] ??= [];
    groups[key].push(f);
  }
  return groups;
}

function renderDirReadme(dirKey, files) {
  // dirKey ex: src/routes
  const role = guessRole(dirKey + "/x.ts");
  const totalFiles = files.length;
  const totalLines = files.reduce((a, b) => a + b.lines, 0);

  const endpointList = [];
  for (const f of files) {
    for (const e of f.endpoints) endpointList.push({ ...e, file: f.relPath });
  }

  const exportList = [];
  for (const f of files) {
    for (const ex of f.exports) exportList.push({ name: ex, file: f.relPath });
  }

  const topFilesByLines = [...files].sort((a, b) => b.lines - a.lines).slice(0, 15)
    .map(f => `\`${f.relPath}\` — **${f.lines}** linhas`);

  const endpointsPreview = endpointList.slice(0, MAX_ENDPOINT_PREVIEW)
    .map(e => `${e.method} \`${e.path}\`  _(em ${e.file})_`);
  const exportsPreview = exportList.slice(0, MAX_EXPORTS_PREVIEW)
    .map(e => `\`${e.name}\`  _(em ${e.file})_`);

  const md = [
    `# ${dirKey}`,
    "",
    `**Responsabilidade (inferida):** ${role}`,
    "",
    "## 📌 Resumo",
    "",
    `- **Arquivos**: ${totalFiles}`,
    `- **Linhas (aprox.)**: ${totalLines}`,
    "",
    "## 📄 Arquivos",
    "",
    mdList(files.slice(0, MAX_FILES_PER_DIR).map(f => `\`${f.relPath}\` — ${f.role} — ${f.lines} linhas`)),
    files.length > MAX_FILES_PER_DIR ? `\n_(mostrando ${MAX_FILES_PER_DIR} de ${files.length})_` : "",
    "",
    "## 🌐 Endpoints (detectados)",
    "",
    endpointList.length ? mdList(endpointsPreview) : "_(nenhum detectado)_",
    endpointList.length > MAX_ENDPOINT_PREVIEW ? `\n_(mostrando ${MAX_ENDPOINT_PREVIEW} de ${endpointList.length})_` : "",
    "",
    "## 📦 Exports (preview)",
    "",
    exportList.length ? mdList(exportsPreview) : "_(nenhum detectado)_",
    exportList.length > MAX_EXPORTS_PREVIEW ? `\n_(mostrando ${MAX_EXPORTS_PREVIEW} de ${exportList.length})_` : "",
    "",
    "## 🔝 Top arquivos (por linhas)",
    "",
    mdList(topFilesByLines),
    "",
  ].join("\n");

  return md;
}

function renderFileDoc(summary) {
  const fileName = toSlugFileName(summary.filePath);
  const fileOut = path.join(FILES_DIR, fileName);

  const endpoints = summary.endpoints.map(e => `${e.method} \`${e.path}\``);
  const exports = summary.exports.map(e => `\`${e}\``);

  const importsInt = summary.imports.internal.map(i => `\`${i}\``);
  const importsExt = summary.imports.external.map(i => `\`${i}\``);

  const md = [
    `# ${summary.relPath}`,
    "",
    `**Role (inferido):** ${summary.role}`,
    "",
    "## 📌 Metadados",
    "",
    `- **Linhas**: ${summary.lines}`,
    `- **Tamanho**: ${summary.bytes} bytes`,
    "",
    "## 🌐 Endpoints",
    "",
    endpoints.length ? mdList(endpoints) : "_(nenhum detectado)_",
    "",
    "## 📦 Exports",
    "",
    exports.length ? mdList(exports) : "_(nenhum detectado)_",
    "",
    "## 🔗 Imports internos",
    "",
    importsInt.length ? mdList(importsInt) : "_(nenhum)_",
    "",
    "## 🔗 Imports externos",
    "",
    importsExt.length ? mdList(importsExt) : "_(nenhum)_",
    "",
    "## 🧠 Observação",
    "",
    "> Este arquivo foi documentado via análise estática (sem LLM).",
    "> Para semântica completa, use TypeDoc/JSDoc em conjunto.",
    "",
  ].join("\n");

  writeFile(fileOut, md);
  return { outRel: rel(fileOut), name: fileName };
}

function renderIndex(groups, fileDocsIndex) {
  const keys = Object.keys(groups).sort();

  const sections = keys.map(k => {
    const outReadme = path.join(OUT_DIR, k, "README.md");
    const readmeRelFromIndex = path.relative(OUT_DIR, outReadme).replaceAll("\\", "/");
    const files = groups[k];
    const endpointsCount = files.reduce((acc, f) => acc + f.endpoints.length, 0);
    const totalLines = files.reduce((acc, f) => acc + f.lines, 0);
    return `- ${mdLink(`📁 ${k}`, readmeRelFromIndex)} — **${files.length}** arquivos, **${totalLines}** linhas, **${endpointsCount}** endpoints`;
  }).join("\n");

  const fileDocsNote = GENERATE_FILE_DOCS
    ? `- 📄 ${mdLink("docs por arquivo (files/)", "files/")}`
    : "- 📄 docs por arquivo desativadas";

  const md = [
    "# Reference — Production Manager API",
    "",
    "_Gerado automaticamente (catálogo estático do repositório)._",
    "",
    "## 📌 Como usar",
    "",
    "- Comece pelo **contrato público**: `GET /v1/products` (ver `docs/API_CONTRACT.md`)",
    "- Use esta reference para navegar por pastas e arquivos",
    "",
    "## 📁 Pastas (src/*)",
    "",
    sections || "_(nenhuma)_",
    "",
    "## 📄 Arquivos individuais",
    "",
    fileDocsNote,
    "",
    "## ℹ️ Notas",
    "",
    "- Esta reference é gerada por heurísticas (rotas, exports, imports).",
    "- Para semântica de funções/classes, use `pnpm docs:typedoc`.",
    "",
  ].join("\n");

  writeFile(path.join(OUT_DIR, "INDEX.md"), md);
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(JSON.stringify({ ok: false, error: "src folder not found", expected: rel(SRC) }, null, 2));
    process.exit(1);
  }

  ensureDir(OUT_DIR);
  if (GENERATE_FILE_DOCS) ensureDir(FILES_DIR);

  const files = walk(SRC).filter(f => f.endsWith(".ts") || f.endsWith(".js"));
  const summaries = files.map(summarizeFile);

  const groups = groupByTopFolder(summaries);

  // gerar README por pasta
  const keys = Object.keys(groups);
  for (const k of keys) {
    const outFolder = path.join(OUT_DIR, k);
    const md = renderDirReadme(k, groups[k]);
    writeFile(path.join(outFolder, "README.md"), md);
  }

  // gerar docs por arquivo (opcional)
  const fileDocsIndex = [];
  if (GENERATE_FILE_DOCS) {
    for (const s of summaries) {
      fileDocsIndex.push(renderFileDoc(s));
    }

    // index simples para files/
    const mdFiles = [
      "# files/ — Documentação por arquivo",
      "",
      "_Gerado automaticamente._",
      "",
      mdList(fileDocsIndex.slice(0, 300).map(x => mdLink(x.name, x.name))),
      fileDocsIndex.length > 300 ? `\n_(mostrando 300 de ${fileDocsIndex.length})_` : "",
      "",
    ].join("\n");

    writeFile(path.join(FILES_DIR, "INDEX.md"), mdFiles);
  }

  // gerar index geral
  renderIndex(groups, fileDocsIndex);

  console.log(JSON.stringify({
    ok: true,
    outDir: rel(OUT_DIR),
    generated: {
      index: "docs/reference/INDEX.md",
      perFolder: keys.length,
      perFile: GENERATE_FILE_DOCS ? summaries.length : 0
    }
  }, null, 2));
}

main();