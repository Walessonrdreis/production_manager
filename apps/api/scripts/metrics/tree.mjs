#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET = "src";
const MAX_DEPTH = 4;
const IGNORE = new Set(["node_modules", ".git", "dist", "build", ".pnpm", ".cache"]);

function walk(dir, depth = 0) {
  if (depth > MAX_DEPTH) return [];
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !IGNORE.has(e.name));

  const out = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    out.push({ type: e.isDirectory() ? "dir" : "file", path: path.relative(ROOT, full) });
    if (e.isDirectory()) out.push(...walk(full, depth + 1));
  }
  return out;
}

console.log(JSON.stringify({
  target: TARGET,
  tree: walk(path.join(ROOT, TARGET))
}, null, 2));