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
    else if (full.endsWith(".ts")) out.push(full);
  }
  return out;
}

const files = walk(START);
const exportRe = /\bexport\s+(async\s+)?function\s+(\w+)\b|\bexport\s+const\s+(\w+)\b|\bexport\s+\{\s*([^}]+)\}/g;

const perFile = [];
let total = 0;

for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  let count = 0;
  let m;
  while ((m = exportRe.exec(text))) count++;
  if (count > 0) {
    perFile.push({ file: path.relative(ROOT, f), exports: count });
    total += count;
  }
}

perFile.sort((a,b)=>b.exports-a.exports);

console.log(JSON.stringify({
  totalExports: total,
  filesWithExports: perFile.length,
  topFiles: perFile.slice(0, 30)
}, null, 2));