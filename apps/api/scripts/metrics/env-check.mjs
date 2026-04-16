#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const example = path.join(ROOT, ".env.example");
const envFile = path.join(ROOT, ".env");

function parseEnv(text) {
  const keys = new Set();
  for (const line of text.split(/\r\n|\n|\r/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq > 0) keys.add(t.slice(0, eq).trim());
  }
  return keys;
}

const exKeys = fs.existsSync(example) ? parseEnv(fs.readFileSync(example,"utf8")) : new Set();
const envKeys = fs.existsSync(envFile) ? parseEnv(fs.readFileSync(envFile,"utf8")) : new Set(Object.keys(process.env));

const missing = [...exKeys].filter(k => !envKeys.has(k)).sort();
const extra = [...envKeys].filter(k => !exKeys.has(k)).sort();

console.log(JSON.stringify({
  example: fs.existsSync(example) ? ".env.example" : null,
  env: fs.existsSync(envFile) ? ".env" : "process.env",
  missing,
  extraCount: extra.length
}, null, 2));