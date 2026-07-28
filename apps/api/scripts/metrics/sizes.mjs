#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STARTS = ["src", "prisma", "test", "scripts"].map(p => path.join(ROOT, p));
const IGNORE = new Set(["node_modules", ".git", "dist", "build", "coverage", ".pnpm", ".turbo", ".cache"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function human(n) {
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let x = n;
  while (x >= 1024 && i < u.length - 1) { x /= 1024; i++; }
  return `${x.toFixed(i === 0 ? 0 : 2)} ${u[i]}`;
}

// ✅ FIX: não usar flatMap(walk), e sim flatMap(d => walk(d))
const files = STARTS.flatMap(d => walk(d));

let total = 0;
const byFolder = {};
const byFile = [];

for (const f of files) {
  const rel = path.relative(ROOT, f);
  const bytes = fs.statSync(f).size;
  total += bytes;

  const top = rel.split(path.sep).slice(0, 2).join(path.sep); // ex: src/routes
  byFolder[top] ??= { bytes: 0, files: 0 };
  byFolder[top].bytes += bytes;
  byFolder[top].files += 1;

  byFile.push({ file: rel, bytes });
}

byFile.sort((a, b) => b.bytes - a.bytes);

console.log(JSON.stringify({
  totalBytes: total,
  totalBytesHuman: human(total),
  byFolder: Object.fromEntries(
    Object.entries(byFolder)
      .sort((a, b) => b[1].bytes - a[1].bytes)
      .map(([k, v]) => [k, { ...v, bytesHuman: human(v.bytes) }])
  ),
  topFiles: byFile.slice(0, 30).map(x => ({ ...x, bytesHuman: human(x.bytes) })),
}, null, 2));