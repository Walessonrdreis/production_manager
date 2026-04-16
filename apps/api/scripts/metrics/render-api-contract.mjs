#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd(); // rode a partir de apps/api
const OUT = path.join(ROOT, "docs", "API_CONTRACT.md");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function write(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, "utf8");
}

function now() {
  return new Date().toLocaleString("pt-BR", { hour12: false });
}

/**
 Fonte da verdade do contrato público (MVP)
 * - 1 endpoint público principal
 * - sem endpoints por campo
 */
const PUBLIC_PRODUCTS_CONTRACT = {
  endpoint: "GET /v1/products",
  description:
    "Catálogo público de produtos com estoque atual. Representa uma tabela lógica única para consumo externo (ex.: BizChat).",
  key: "omieCode",
  fields: [
    { name: "omieCode", type: "string", description: "Código único do produto (chave externa)." },
    { name: "description", type: "string", description: "Descrição do produto." },
    { name: "sku", type: "string | null", description: "SKU do produto, se existir." },
    { name: "stockQuantity", type: "string (decimal)", description: "Quantidade atual em estoque." },
    { name: "minimumStock", type: "string (decimal)", description: "Estoque mínimo configurado." },
    { name: "stockUpdatedAt", type: "ISO string | null", description: "Data/hora da última atualização do estoque." }
  ],
  rules: [
    "Este é o único endpoint público para produtos + estoque",
    "Campos são atributos do recurso, não endpoints separados",
    "Se não houver estoque, stockQuantity = \"0.0000\" e stockUpdatedAt = null",
    "Endpoints públicos não chamam a API do Omie em tempo real",
    "Chave externa sempre é omieCode"
  ],
  discover: [
    "Use ?describe=true para descobrir o schema via API (quando implementado)",
    "Use ?pretty=true para resposta formatada (quando habilitado)"
  ],
  examples: {
    request: "GET /v1/products?page=1&pageSize=50",
    response: {
      data: [
        {
          omieCode: "XTE",
          description: "Chá Tarde de Domingo",
          sku: null,
          stockQuantity: "42.0000",
          minimumStock: "10.0000",
          stockUpdatedAt: "2026-04-16T14:22:00.000Z"
        }
      ],
      meta: {
        page: 1,
        pageSize: 50,
        total: 1
      }
    }
  }
};

const md = [
  "# 📦 API Contract — Production Manager",
  "",
  `_Última atualização automática: **${now()}**_`,
  "",
  "---",
  "",
  "## 🎯 Objetivo",
  "",
  "Esta API expõe um **contrato público simples e estável** para consumo externo (ex.: BizChat).",
  "O consumidor **não precisa conhecer Omie, jobs, banco ou histórico**.",
  "",
  "---",
  "",
  "## ✅ Endpoint público",
  "",
  `### \`${PUBLIC_PRODUCTS_CONTRACT.endpoint}\``,
  "",
  PUBLIC_PRODUCTS_CONTRACT.description,
  "",
  `- **Chave externa**: \`${PUBLIC_PRODUCTS_CONTRACT.key}\``,
  "",
  "---",
  "",
  "## 🧾 Campos retornados",
  "",
  "| Campo | Tipo | Descrição |",
  "|------|------|-----------|",
  ...PUBLIC_PRODUCTS_CONTRACT.fields.map(
    f => `| \`${f.name}\` | ${f.type} | ${f.description} |`
  ),
  "",
  "---",
  "",
  "## 📐 Regras do contrato",
  "",
  ...PUBLIC_PRODUCTS_CONTRACT.rules.map(r => `- ${r}`),
  "",
  "---",
  "",
  "## 🔍 Descoberta (DX)",
  "",
  ...PUBLIC_PRODUCTS_CONTRACT.discover.map(d => `- ${d}`),
  "",
  "---",
  "",
  "## 🚫 O que **não** é endpoint",
  "",
  "- ❌ `/v1/products/stockQuantity`",
  "- ❌ `/v1/products/sku`",
  "- ❌ `/v1/products/minimumStock`",
  "",
  "> Campos são **atributos do recurso**, não endpoints separados.",
  "",
  "---",
  "",
  "## 🧪 Exemplo",
  "",
  "### Request",
  "",
  "```http",
  PUBLIC_PRODUCTS_CONTRACT.examples.request,
  "```",
  "",
  "### Response",
  "",
  "```json",
  JSON.stringify(PUBLIC_PRODUCTS_CONTRACT.examples.response, null, 2),
  "```",
  "",
  "---",
  "",
  "## 🧠 Observações finais",
  "",
  "- Este contrato é **estável** durante o ciclo do MVP",
  "- Mudanças devem ocorrer apenas com versionamento (`/v2`)",
  "- Para estado interno, use endpoints `/v1/admin/*`",
  "",
].join("\n");

write(OUT, md);

console.log(JSON.stringify({
  ok: true,
  output: path.relative(ROOT, OUT)
}, null, 2));
``