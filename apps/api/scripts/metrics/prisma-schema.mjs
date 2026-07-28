#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const prisma = path.join(ROOT, "prisma/schema.prisma");
if (!fs.existsSync(prisma)) {
  console.log(JSON.stringify({ error: "schema.prisma not found", prisma }, null, 2));
  process.exit(0);
}

const text = fs.readFileSync(prisma, "utf8");

const modelRe = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
const fieldRe = /^\s*(\w+)\s+([^\s]+)\s*(.*)$/gm;
const indexRe = /^\s*@@(index|unique|map)\((.*)\)/gm;

const models = [];
let m;
while ((m = modelRe.exec(text))) {
  const name = m[1];
  const body = m[2];
  const fields = [];
  let f;
  while ((f = fieldRe.exec(body))) {
    const fieldName = f[1];
    const type = f[2];
    const rest = f[3]?.trim() ?? "";
    if (fieldName.startsWith("@@")) continue;
    fields.push({ name: fieldName, type, attrs: rest });
  }
  const indexes = [];
  let ix;
  while ((ix = indexRe.exec(body))) {
    indexes.push({ kind: ix[1], expr: ix[2].trim() });
  }
  models.push({ name, fields, indexes });
}

console.log(JSON.stringify({
  prisma: "prisma/schema.prisma",
  modelCount: models.length,
  models
}, null, 2));