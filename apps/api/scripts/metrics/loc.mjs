#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const START = path.join(ROOT, "src");
const IGNORE = new Set(["node_modules", ".git", "dist", "build", ".pnpm", ".cache"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(ts|js|json|prisma|md)$/.test(full)) out.push(full);
  }
  return out;
}

function lines(file) {
  return fs.readFileSync(file, "utf8").split(/\r\n|\n|\r/).length;
}

const files = walk(START);
const report = files.map(f => ({
  file: path.relative(ROOT, f),
  lines: lines(f),
}));

report.sort((a, b) => b.lines - a.lines);

console.log(JSON.stringify({
  totalFiles: report.length,
  totalLines: report.reduce((a, b) => a + b.lines, 0),
  topFiles: report.slice(0, 20)
}, null, 2));