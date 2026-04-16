#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();

// Ajuste se seu index estiver em outro caminho:
const indexFile = path.join(ROOT, "src/routes/index.ts");

// Script que detecta endpoints via regex:
const scanFile = path.join(ROOT, "scripts/metrics/endpoints.mjs");

function runEndpointsScan() {
  const raw = execSync(`node "${scanFile}"`, { encoding: "utf8" });
  return JSON.parse(raw).endpoints;
}

function extractDocumentedRoutes(text) {
  // Procura "path: '...'" nos arrays do index
  const rePath = /\bpath:\s*(['"`])([^'"`]+)\1/g;
  const out = [];
  let m;
  while ((m = rePath.exec(text))) out.push(m[2]);
  return out;
}

const documented = fs.existsSync(indexFile)
  ? extractDocumentedRoutes(fs.readFileSync(indexFile, "utf8"))
  : [];

const detected = runEndpointsScan().map(e => e.path);

const docSet = new Set(documented);
const detSet = new Set(detected);

const onlyInDocs = [...docSet].filter(x => !detSet.has(x)).sort();
const onlyInCode = [...detSet].filter(x => !docSet.has(x)).sort();

console.log(JSON.stringify({
  indexFile: path.relative(ROOT, indexFile),
  documentedCount: documented.length,
  detectedCount: detected.length,
  onlyInDocs,
  onlyInCode
}, null, 2));