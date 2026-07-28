#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd(); // rode a partir de apps/api
const OUT = path.join(ROOT, "metrics-report.json");

const scripts = [
  "tree.mjs",
  "loc.mjs",
  "sizes.mjs",
  "endpoints.mjs",
  "endpoints-drift.mjs",
  "prisma-schema.mjs",
  "migrations.mjs",
  "env-check.mjs",
  "exports.mjs",
  "render-readme.mjs",
  "render-api-contract.mjs",
  "render-reference.mjs",
  "render-md.mjs",
  "typedoc.mjs",
];

function run(script) {
  const p = path.join(ROOT, "scripts/metrics", script);
  try {
    const raw = execSync(`node "${p}"`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return JSON.parse(raw);
  } catch (e) {
    return {
      error: String(e?.message ?? e),
      stderr: e?.stderr ? e.stderr.toString("utf8") : undefined
    };
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  cwd: ROOT,
  results: {},
};

for (const s of scripts) {
  try {
    report.results[s] = run(s);
  } catch (e) {
    report.results[s] = { error: String(e?.message ?? e) };
  }
}

fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ok: true, outFile: OUT }, null, 2));
``