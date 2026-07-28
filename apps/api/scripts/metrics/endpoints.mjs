#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const START = path.join(ROOT, "src");
const IGNORE = new Set(["node_modules", ".git", "dist", "build", "coverage", ".pnpm", ".turbo", ".cache"]);

function walk(dir, out=[]) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(ts|js)$/.test(full)) out.push(full);
  }
  return out;
}

const re = /\b(app|router|fastify)\.(get|post|put|patch|delete)\s*\(\s*(['"`])([^'"`]+)\3/g;

const files = walk(START);
const endpoints = [];

for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  let m;
  while ((m = re.exec(text))) {
    endpoints.push({
      method: m[2].toUpperCase(),
      path: m[4],
      file: path.relative(ROOT, f),
    });
  }
}

const counts = endpoints.reduce((acc, e) => {
  acc[e.method] = (acc[e.method] ?? 0) + 1;
  acc.total += 1;
  return acc;
}, { total: 0 });

endpoints.sort((a,b)=>a.method.localeCompare(b.method) || a.path.localeCompare(b.path));

console.log(JSON.stringify({ counts, endpoints }, null, 2));