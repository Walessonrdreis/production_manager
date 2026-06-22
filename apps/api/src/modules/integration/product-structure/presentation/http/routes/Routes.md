
# Product Structure — Routes

## � Total: 8 rotas (5 Comandos + 3 Read-models)

---

## 🚀 COMANDOS (POST) — Sempre com efeito colateral / Fake-Real

### 1. Sync individual
```
POST /v1/integration/product-structure/:productCode/sync
```
**Payload (obrigatório):**
```json
{ "externalRequestId": "string" }
```
**Resposta (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "externalRequestId": "string",
    "status": "ACCEPTED",
    "productCode": "string"
  }
}
```
**Descrição:** Sincroniza estrutura (BOM) de um único produto via Omie.

---

### 2. Sync global (bulk)
```
POST /v1/integration/product-structure/sync-global
```
**Payload (todos opcionais):**
```json
{
  "externalRequestId": "opcional - gerado automaticamente se omitido",
  "pageSize": 100,
  "maxPages": 1000
}
```
**Resposta (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "status": "ACCEPTED",
    "externalRequestId": "string",
    "resourceId": "__GLOBAL__"
  }
}
```
**Descrição:** Percorre todas as páginas de `ListarEstruturas` do Omie e atualiza o espelho local. Sincronização incremental com retry adaptativo. Idempotente por `externalRequestId`.

> ⚠️ **Curl exige body JSON** — mesmo vazio:
> ```bash
> curl -s -X POST http://localhost:3333/v1/integration/product-structure/sync-global \
>   -H "Content-Type: application/json" \
>   -d '{"externalRequestId":"meu-sync-001"}'
> ```

---

### 3. Aplicar estrutura
```
POST /v1/integration/product-structure/:productCode/apply
```
**Payload (obrigatório):**
```json
{
  "externalRequestId": "string",
  "structure": {
    "items": [
      {
        "componentCode": "string",
        "quantity": "number|string",
        "unit": "opcional",
        "loss": "number|string (opcional)"
      }
    ]
  }
}
```
**Resposta (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "externalRequestId": "string",
    "status": "ACCEPTED",
    "productCode": "string"
  }
}
```
**Descrição:** Cria ou altera estrutura no Omie (IncluirEstrutura / AlterarEstrutura) e sincroniza espelho local.

---

### 4. Excluir estrutura
```
POST /v1/integration/product-structure/:productCode/delete
```
**Payload (obrigatório):**
```json
{ "externalRequestId": "string" }
```
**Resposta (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "externalRequestId": "string",
    "status": "ACCEPTED",
    "productCode": "string"
  }
}
```
**Descrição:** Exclui estrutura do produto no Omie e atualiza espelho local.

---

### 5. Submeter (reservado)
```
POST /v1/integration/product-structure/:productCode/submit
```
**⚠️ 501 Not Implemented** — Use `/apply` no MVP.
```json
{
  "success": false,
  "error": "NOT_IMPLEMENTED",
  "message": "Use /apply para aplicar a estrutura no MVP. /submit será habilitado quando houver drafts/aprovação."
}
```

---

## 📘 READ-MODELS (GET) — Sem side effects / Sem Fake-Real

### 6. Production readiness
```
GET /v1/admin/read/products/production-readiness
```
**Descrição:** Read-model que indica se um produto está apto a gerar Ordem de Produção, baseado na existência de BOM (`product_structure.has_structure`).

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `view` | string | `summary` ou `data` |
| `q` | string | Busca por descrição ou código |
| `activeOnly` | boolean | `true` = apenas ativos (default: true) |
| `structureStatus` | string | `with` ou `without` |
| `onlyWithoutStructure` | boolean | `true` = só sem estrutura |
| `limit` | number | Máx. itens (default: 50, max: 200) |
| `offset` | number | Deslocamento |
| `sort` | string | `description`, `productCode`, `hasStructure` |
| `order` | string | `asc` ou `desc` |
| `since` | string | ISO date — filtra por `updated_at` |
| `includeItems` | boolean | Incluir itens da estrutura |

**Resposta (summary):**
```json
{
  "success": true,
  "summary": {
    "total": 1635,
    "withStructure": 356,
    "withoutStructure": 1279,
    "canCreateProductionOrder": 356,
    "blockedFromProduction": 1279
  }
}
```
**Resposta (data):**
```json
{
  "success": true,
  "data": [
    {
      "productCode": "100kg",
      "description": "100% cacau 1 Kg",
      "hasStructure": true,
      "canCreateProductionOrder": true
    }
  ]
}
```
> ⚠️ Apenas GET. Sem efeitos colaterais. Não chama Omie.

---

### 7. Sync Status
```
GET /v1/integration/product-structure/sync-status/:externalRequestId
```
**Descrição:** Retorna o status de um comando de integração (SYNC/APPLY/DELETE) pelo `externalRequestId`.

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "externalRequestId": "string",
    "productCode": "string",
    "commandType": "SYNC | APPLY | DELETE",
    "status": "ACCEPTED | CONFIRMED | FAILED",
    "source": "API2 | JOB | ADMIN",
    "executedAt": "datetime|null",
    "completedAt": "datetime|null",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "lastError": "object|null"
  }
}
```
**Resposta (404 — não encontrado):**
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Comando não encontrado"
}
```

---

### 8. Summary
```
GET /v1/integration/product-structure/summary
```
**Descrição:** Lista resumida de produtos com estrutura espelhada e estatísticas de comandos. Usa query params para filtrar.

| Parâmetro | Tipo | Default | Descrição |
|-----------|------|---------|-----------|
| `onlyWithStructure` | boolean | `false` | Apenas produtos com estrutura |
| `q` | string | — | Busca por código ou descrição |
| `limit` | number | 50 | Máx. itens (max: 500) |
| `offset` | number | 0 | Deslocamento |

**Resposta:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 356,
      "withStructure": 356,
      "withoutStructure": 0,
      "commands": { "accepted": 0, "confirmed": 1, "failed": 0 }
    },
    "meta": { "limit": 50, "offset": 0, "returned": 10 },
    "items": [
      {
        "productCode": "100kg",
        "description": "100% cacau 1 Kg",
        "hasStructure": true,
        "componentCount": 5,
        "lastSyncAt": "2026-06-22T13:23:33.505Z"
      }
    ]
  }
}
```
> ⚠️ Apenas leitura. Sem side effects. Sem Fake/Real.

---

## 🧭 Resumo

| # | Método | Rota | Descrição |
|---|--------|------|-----------|
| 1 | POST | `/v1/integration/product-structure/:productCode/sync` | Sync individual |
| 2 | POST | `/v1/integration/product-structure/sync-global` | Sync em lote |
| 3 | POST | `/v1/integration/product-structure/:productCode/apply` | Aplicar estrutura |
| 4 | POST | `/v1/integration/product-structure/:productCode/delete` | Excluir estrutura |
| 5 | POST | `/v1/integration/product-structure/:productCode/submit` | Submeter (501) |
| 6 | GET | `/v1/admin/read/products/production-readiness` | Production readiness |
| 7 | GET | `/v1/integration/product-structure/sync-status/:externalRequestId` | Status de comando |
| 8 | GET | `/v1/integration/product-structure/summary` | Sumário de estruturas |

---

## ✅ Regras do módulo

* Apenas POST
* Sempre com efeito colateral
* Sempre com `externalRequestId`
* Sempre com Fake/Real


## 🔗 index.ts (agregador)

O arquivo `index.ts`:

* Importa todas as rotas do módulo
* Registra as rotas no `FastifyInstance`
* Não contém lógica de negócio

## 🔌 routes.ts (ponto único de registro)

O arquivo `presentation/http/routes.ts`:

* Importa `routes/index.ts`
* É o único ponto usado pelo `*-integration-register.ts`
* Evita registro duplicado de rotas


## ⚠️ Regras que não podem ser quebradas

* Não criar rotas fora deste diretório
* Não misturar READ e COMMAND no mesmo arquivo
* Não registrar rotas diretamente no app fora do módulo
* Não criar rotas genéricas ou ambíguas


## 🔄 Relação com API 2

* A API 2 consome apenas rotas documentadas em `apps/api/ROUTES.md`
* Este README explica **como o módulo está organizado internamente**
* A API 2 não conhece Omie nem acessa banco diretamente


## ✅ Este padrão deve ser replicado em

* Produtos
* Estoque
* Ordens de Produção
* Ordens de Venda
* Demais módulos de integração


# ✅ 3) ROUTES.md — ENTRADAS DO MÓDULO

📍 **Caminho**

apps/api/ROUTES.md

### ✅ Adicionar

## Product Structure (BOM)

### Read‑Models
- `GET /v1/admin/read/products/production-readiness` — Readiness de produção
- `GET /v1/integration/product-structure/summary` — Sumário de estruturas espelhadas
- `GET /v1/integration/product-structure/sync-status/:externalRequestId` — Status de comando

### Comandos de Integração
- `POST /v1/integration/product-structure/:productCode/sync` — Sync individual
- `POST /v1/integration/product-structure/sync-global` — Sync em lote
- `POST /v1/integration/product-structure/:productCode/apply` — Aplicar estrutura
- `POST /v1/integration/product-structure/:productCode/delete` — Excluir estrutura

### Jobs
- Product Structure Sync (cron)
  - Controlado por `ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB`
  - Agenda via `OMIE_PRODUCT_STRUCTURE_SYNC_CRON`