#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const migDir = path.join(ROOT, "prisma/migrations");

if (!fs.existsSync(migDir)) {
  console.log(JSON.stringify({ migrations: 0, note: "no prisma/migrations folder" }, null, 2));
  process.exit(0);
}

const dirs = fs.readdirSync(migDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

const items = [];
for (const d of dirs) {
  const sqlPath = path.join(migDir, d, "migration.sql");
  const exists = fs.existsSync(sqlPath);
  const bytes = exists ? fs.statSync(sqlPath).size : 0;
  items.push({ name: d, hasSql: exists, bytes });
}

items.sort((a,b)=>b.name.localeCompare(a.name));

console.log(JSON.stringify({
  migrations: items.length,
  latest: items.slice(0, 10),
  missingSql: items.filter(x=>!x.hasSql).map(x=>x.name)
}, null, 2));