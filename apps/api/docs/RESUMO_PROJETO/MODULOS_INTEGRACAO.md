# 📦 Módulos de Integração — API 1

> **Propósito:** Documento consolidado de todos os módulos de integração em `apps/api/src/modules/integration/`.
> Este arquivo serve como **referência rápida** para qualquer agente/chat entender o ecossistema sem precisar ler módulo por módulo.

---

## 📋 Sumário

| Módulo | Tipo | Rotas | Comandos | Read-Models | Sync Global | Gateway |
|--------|------|-------|----------|-------------|-------------|---------|
| [customer-sync](#1️⃣-customer-sync) | 🔄 Sync-Only | 9 | 2 | 7 | ✅ | Fake/Real |
| [product-catalog](#2️⃣-product-catalog) | 🔄 Sync-Only | 14 | 3 | 11 | ✅ | Fake/Real |
| [product-stock-fetch](#3️⃣-product-stock-fetch) | 🔄 Sync-Only | 3 | 2 | 1 | ✅ | Fake/Real |
| [product-structure](#4️⃣-product-structure) | ⚙️ Command-Cycle | 8 | 5 | 3 | ✅ | Fake/Real |
| [production-orders](#5️⃣-production-orders) | ⚙️ Command-Cycle | 4 | 2 (1 fake-only) | 1 | ❌ | Fake/Real |
| [sales-order-sync](#6️⃣-sales-order-sync) | 🔄 Sync-Only | 7 | 1 | 6 | ✅ | Fake/Real |

---

> **Legenda:** 🔄 Sync-Only = apenas leitura do Omie (modelo: `customer-sync`) · ⚙️ Command-Cycle = leitura + escrita no Omie (modelo: `product-structure`)
> Templates canônicos: [`docs/TEMPLATE_SYNC_ONLY.md`](../../../../docs/TEMPLATE_SYNC_ONLY.md) · [`docs/TEMPLATE_COMMAND_CYCLE.md`](../../../../docs/TEMPLATE_COMMAND_CYCLE.md)

---

## 🔧 Padrões Gerais (Todos os Módulos)

### 🚦 Gateway Fake/Real
Cada módulo tem uma env var `{MODULO}_GATEWAY=fake|real` que controla se as chamadas vão para o Omie real ou usam dados fictícios.

```env
PRODUCT_STRUCTURE_GATEWAY=fake|real
CUSTOMER_SYNC_GATEWAY=fake|real
PRODUCT_CATALOG_GATEWAY=fake|real
PRODUCT_STOCK_FETCH_GATEWAY=fake|real
SALES_ORDER_SYNC_GATEWAY=fake|real
PRODUCTION_ORDER_GATEWAY=fake|real
```

### 📤 Comandos (POST) — Sempre com efeito colateral
- **Idempotentes** por `externalRequestId`
- Campo `externalRequestId` obrigatório (exceto `sync-global` que gera automático)
- Retornam **202 Accepted** quando aceitos
- Comandos executam **assíncronos** (fire-and-forget com `void useCase.execute()`)

### 📥 Read-Models (GET) — Somente leitura
- **Nunca chamam Omie** (exceto `product-stock-fetch/position` que é exceção documentada)
- **Nunca escrevem no banco**
- Consomem espelhos locais (tabelas Prisma)

### 🧪 Estrutura de Diretórios (Padrão Canônico)
```
modulo/
├── index.ts
├── modulo-integration-register.ts
├── README.md
├── application/
│   ├── dto/                    → Tipos de request/response
│   ├── mappers/                → Mapeamento defensivo de dados Omie
│   ├── ports/                  → Interfaces (gateways)
│   └── use-cases/              → Casos de uso
├── infrastructure/
│   ├── db/                     → Stores (acesso a banco)
│   ├── gateways/               → FakeGateway / RealGateway
│   └── jobs/                   → Jobs cron
└── presentation/
    └── http/
        ├── routes/
        │   ├── commands/       → Rotas POST
        │   └── read/           → Rotas GET
        └── index.ts (ou routes.ts)
```

### 📄 Rotas sem schema e Content-Type
- Rotas `sync-global` (todos os módulos) **não têm schema** — o handler usa `(request.body ?? {})`
- Isso permite chamadas **sem header `Content-Type` e sem body**
- Demais comandos têm `schema { body: { required: [...] } }` para validar campos obrigatórios

---

## 1️⃣ customer-sync

**🧩 Arquétipo:** 🔄 Sync-Only (modelo canônico)

**Propósito:** Sincronização de clientes entre Omie ERP e o banco local (`omie_customer`).

**Gateway:** `CUSTOMER_SYNC_GATEWAY=fake|real`

**Total de rotas: 9** (2 comandos + 7 read-models)

### Comandos (POST)

| Rota | Descrição | Body |
|------|-----------|------|
| `POST /v1/integration/customer-sync/:customerCode/sync` | Sincroniza 1 cliente do Omie | `{ externalRequestId }` |
| `POST /v1/integration/customer-sync/sync-global` | Sincroniza **todos** os clientes (paginado) | `{ externalRequestId?, pageSize?, maxPages? }` |

### Read-Models (GET)

| Rota | Descrição | Query |
|------|-----------|-------|
| `GET /v1/admin/read/customers` | Lista/busca clientes paginado | `q`, `activeOnly`, `limit`, `offset`, `sort`, `order`, `since`, `fields`, `includeRaw` |
| `GET /v1/admin/read/customers/:customerCode` | Busca 1 cliente por código | `includeRaw` |
| `GET /v1/admin/read/customers/stats` | Estatísticas (total, active, inactive) | — |
| `GET /v1/customers/summary` | Sumário de clientes ativos (para API 2) | — |
| `GET /v1/integration/customer-sync/sync-status/:externalRequestId` | Status de um comando | — |
| `GET /v1/integration/customer-sync/sync-history` | Histórico de comandos | `limit` |
| `GET /v1/integration/customer-sync/sync-failures` | Falhas de sincronização | `limit` |
| `GET /v1/integration/customer-sync/last-sync` | Último sync global | — |

---

## 2️⃣ product-catalog

**🧩 Arquétipo:** 🔄 Sync-Only

**Propósito:** Manter o espelho local do catálogo de produtos do Omie (`omie_product`), estoque (`product_stock`), consolidar dados com estrutura de produtos, OPs e pedidos aprovados, e expor **read-model `production-ready`** para API 2.

**Gateway:** `PRODUCT_CATALOG_GATEWAY=fake|real`

**Dependências:** Depende de `product-stock-fetch`, `product-structure` e `sales-order-sync` para popular o read-model `production-ready`.

**Total de rotas: 14** (3 comandos + 11 read-models)

### Comandos (POST)

| Rota | Descrição | Body |
|------|-----------|------|
| `POST /v1/integration/product-catalog/:productCode/sync` | Sync 1 produto do Omie | `{ externalRequestId }` |
| `POST /v1/integration/product-catalog/sync-global` | Sync global do catálogo (paginado) | `{ externalRequestId?, pageSize?, maxPages? }` |
| `POST /v1/admin/product-catalog/refresh-production-ready` | Recalcula read-model `production-ready` | — |

### Read-Models (GET)

| Rota | Descrição | Query |
|------|-----------|-------|
| `GET /v1/admin/read/products/catalog` | Catálogo completo paginado | `q`, `activeOnly`, `view`, `limit`, `offset`, `sort`, `order`, `since`, `productCodes`, `sku`, `fields`, `includeRaw` |
| `GET /v1/admin/read/products/catalog/:productCode` | Produto específico | `includeRaw` |
| `GET /v1/admin/read/products/catalog/stats` | Estatísticas do catálogo | — |
| `GET /v1/products/catalog/summary` | Catálogo resumido (API 2) | — |
| `GET /v1/products/catalog/production-ready` | Catálogo operacional (principal API 2) | `q`, `onlyActive`, `onlyInStock`, `minStock`, `limit`, `offset`, `sort`, `order`, `withAvailability` |
| `GET /v1/integration/product-catalog/sync-status/:externalRequestId` | Status de comando | — |
| `GET /v1/integration/product-catalog/sync-history` | Histórico de comandos | `limit` |
| `GET /v1/integration/product-catalog/sync-failures` | Falhas de sync | `limit` |
| `GET /v1/integration/product-catalog/last-sync` | Último sync global | — |
| `GET /v1/admin/product-catalog/lock-status` | Status do lock de sync global | — |
| `POST /v1/admin/product-catalog/release-lock` | Libera lock manualmente | — |

### 🎯 Status do production-ready

Cada produto pode ter um destes status:

| Status | Significado |
|--------|-------------|
| `INACTIVE` | Produto inativo |
| `NO_STRUCTURE` | Ativo, sem BOM (estrutura) |
| `NO_STOCK` | Com estrutura, sem disponibilidade |
| `NO_STOCK_WITH_DEMAND` | Sem disponibilidade, com pedido etapa 20 |
| `READY_WITH_DEMAND` | Disponível, com estrutura e com demanda |
| `READY` | Disponível, com estrutura, sem demanda |

---

## 3️⃣ product-stock-fetch

**🧩 Arquétipo:** 🔄 Sync-Only

**Propósito:** Consultar posição de estoque de produtos no Omie e persistir localmente.

**Gateway:** `PRODUCT_STOCK_FETCH_GATEWAY=fake|real`

**Dependências:** Após `sync-global`, dispara `RefreshProductCatalogProductionReadyUseCase` do módulo **product-catalog**.

**Total de rotas: 3** (2 comandos + 1 read)

### Comandos (POST)

| Rota | Descrição | Body |
|------|-----------|------|
| `POST /v1/integration/product-stock-fetch/refresh` | Atualiza estoque de 1 produto | `{ externalRequestId, productId }` |
| `POST /v1/integration/product-stock-fetch/sync-global` | Sync global de estoque (incremental) | `{ externalRequestId?, pageSize?, maxPages? }` |

### Read-Models (GET)

| Rota | Descrição | Query |
|------|-----------|-------|
| `GET /v1/integration/product-stock-fetch/position?productId=...` | ⚠️ **Chama Omie diretamente** (exceção) | `productId` (obrigatório) |

> ⚠️ **Exceção arquitetural:** Esta rota GET consulta o Omie em tempo real. Não é um read-model tradicional — é um endpoint de integração que expõe consulta externa.

---

## 4️⃣ product-structure

**🧩 Arquétipo:** ⚙️ Command-Cycle (modelo canônico)

**Propósito:** Capacidade externa de **Estrutura de Produto (BOM/Malha)**, cuja fonte de verdade é o Omie. **Módulo canônico de referência** para novos módulos.

**Tipo:** **A — Módulo de Integração Externa** (fala com Omie, dados não nascem no domínio)

**Gateway:** `PRODUCT_STRUCTURE_GATEWAY=fake|real`

**Gateways internos:** 5 gateways diferentes (fetch, fetch-page, apply, delete)

**Total de rotas: 8** (5 comandos + 3 read-models)

### Comandos (POST)

| Rota | Descrição | Body |
|------|-----------|------|
| `POST /v1/integration/product-structure/:productCode/sync` | Sincroniza estrutura (BOM) de 1 produto | `{ externalRequestId }` |
| `POST /v1/integration/product-structure/sync-global` | Sync em lote de todas as estruturas | `{ externalRequestId?, pageSize?, maxPages? }` |
| `POST /v1/integration/product-structure/:productCode/apply` | **Cria/altera** estrutura no Omie | `{ externalRequestId, structure: { items: [{ componentCode, quantity, unit?, loss? }] } }` |
| `POST /v1/integration/product-structure/:productCode/delete` | **Exclui** estrutura no Omie | `{ externalRequestId }` |
| `POST /v1/integration/product-structure/:productCode/submit` | **⚠️ 501 Not Implemented** — reservado para workflow de drafts | — |

### Read-Models (GET)

| Rota | Descrição | Query |
|------|-----------|-------|
| `GET /v1/admin/read/products/production-readiness` | Readiness de produtos para produção | `view`, `q`, `activeOnly`, `structureStatus`, `onlyWithoutStructure`, `limit`, `offset`, `sort`, `order`, `since`, `includeItems` |
| `GET /v1/integration/product-structure/sync-status/:externalRequestId` | Status de comando (SYNC/APPLY/DELETE) | — |
| `GET /v1/integration/product-structure/summary` | Sumário de produtos com estrutura | `onlyWithStructure`, `q`, `limit`, `offset` |

---

## 5️⃣ production-orders

**🧩 Arquétipo:** ⚙️ Command-Cycle

**Propósito:** Gerenciar integração de **ordens de produção** com Omie. Segue Clean Architecture.

**Gateway:** `PRODUCTION_ORDER_GATEWAY=fake|real`

**Fake-only endpoints:** `/confirm` e `/fail` — retornam **405** se gateway for `real`.

**Total de rotas: 4** (2 comandos + 1 status + 2 fake-only contadas)

### Comandos (POST)

| Rota | Descrição | Body |
|------|-----------|------|
| `POST /v1/integration/production-order` | Cria ordem de produção | `{ productId, quantity, externalRequestId, scheduledDate?, notes? }` |
| `POST /v1/integration/production-order/:externalRequestId/confirm` | **🔴 Fake Only** — Confirma ordem (405 se real) | Opcional |
| `POST /v1/integration/production-order/:externalRequestId/fail` | **🔴 Fake Only** — Falha ordem (405 se real) | `{ code, message }` |

### Read-Models (GET)

| Rota | Descrição |
|------|-----------|
| `GET /v1/integration/production-order/:externalRequestId` | Consulta status de uma ordem |

### 🔄 Status possíveis
```
ACCEPTED → CONFIRMED | FAILED
```

---

## 6️⃣ sales-order-sync

**🧩 Arquétipo:** 🔄 Sync-Only

**Propósito:** Sincronizar pedidos de venda do Omie (`sales_order` / `sales_order_item`), traduzir payload externo, expor read-models de resumo, transições e itens em aberto.

**Gateway:** `SALES_ORDER_SYNC_GATEWAY=fake|real`

**Dependências (cascata):** Após `sync-global`:
1. Dispara `RefreshProductCatalogProductionReadyUseCase` do módulo **product-catalog**
2. Atualiza `SalesOrderSummaryReadModel`
3. Registra transições de etapa detectadas

**Total de rotas: 7** (1 comando + 6 read-models)

### Comandos (POST)

| Rota | Descrição | Body |
|------|-----------|------|
| `POST /v1/integration/sales-order-sync/sync-global` | Sync global de pedidos | `{ externalRequestId?, pageSize?, maxPages? }` |

### Read-Models (GET)

| Rota | Descrição | Query |
|------|-----------|-------|
| `GET /v1/admin/read/sales-orders` | Lista pedidos resumidos | `q`, `stage`, `customerOmieId`, `isCanceled`, `isClosed`, `activeOnly`, `limit`, `offset` |
| `GET /v1/admin/read/sales-orders/stats` | Estatísticas agregadas | — |
| `GET /v1/admin/read/sales-orders/transitions` | Histórico de transições de etapa | `salesOrderOmieId`, `toStage`, `limit`, `offset` |
| `GET /v1/admin/read/sales-orders/:omieId/transitions` | Transições de 1 pedido específico | — |
| `GET /v1/admin/read/sales-orders/open-items` | Itens em aberto (picking/expedição) | `q`, `limit`, `offset` |
| `GET /v1/integration/sales-order-sync/sync-status/:externalRequestId` | Status de comando de sync | — |

---

## 🔗 Dependências Entre Módulos

```
sync-global (product-stock-fetch)
  └── refresh production-ready (product-catalog)

sync-global (sales-order-sync)
  ├── refresh production-ready (product-catalog)
  └── refresh sales-order-summary (sales-order-sync)

production-ready (product-catalog) depende de:
  ├── product-stock-fetch (estoque)
  ├── product-structure (BOM)
  └── sales-order-sync (pedidos etapa 20)
```

---

## 🧠 Regras de Ouro (Lembretes para Agentes)

1. **Frontend nunca chama Omie ou API 1 diretamente** — API 2 chama API 1
2. **API 2 nunca chama Omie** — só API 1 fala com Omie via gateways
3. **Read-models não executam efeitos colaterais** — são apenas GET que consultam banco local
4. **Comandos sempre usam `externalRequestId`** para idempotência
5. **Comandos retornam 202 Accepted** — consistentes, nunca síncronos
6. **Rotas `sync-global` aceitam body vazio** — sem schema, sem exigência de `Content-Type`
7. **`product-structure` é o módulo de referência** — copiar estrutura dele para novos módulos
8. **Jobs cron** existem para `customer-sync`, `product-catalog`, `product-stock-fetch` e `sales-order-sync`
9. **Gateway Fake nunca escreve dados reais** — `noWrite: true` em todos os use-cases quando fake
10. **Toda rota POST tem schema de validação** — exceto `sync-global` que usa `?? {}` no handler

---

## 📄 Documentos Relacionados

- [`apps/api/ROUTES.md`](../../ROUTES.md) — Contrato canônico de todas as rotas da API 1
- [`apps/api/src/modules/integration/product-structure/README.md`](../src/modules/integration/product-structure/README.md) — Módulo canônico de referência
- [`apps/api/src/modules/integration/product-structure/CONTRATO_DE_USO.MD`](../src/modules/integration/product-structure/CONTRATO_DE_USO.MD) — Contrato de uso
- [`docs/TEMPLATE_SYNC_ONLY.md`](../../../../docs/TEMPLATE_SYNC_ONLY.md) — Template canônico para módulos Sync-Only (basado em `customer-sync`)
- [`docs/TEMPLATE_COMMAND_CYCLE.md`](../../../../docs/TEMPLATE_COMMAND_CYCLE.md) — Template canônico para módulos Command-Cycle (basado em `product-structure`)
- [`docs/MODULE_TEMPLATE.md`](../../../../docs/MODULE_TEMPLATE.md) — Template geral para novos módulos
- [`docs/PROJECT_MANUAL.md`](../../../../docs/PROJECT_MANUAL.md) — Manual completo do projeto
- [`docs/DOMAIN_NAMING_GUIDE.md`](../../../../docs/DOMAIN_NAMING_GUIDE.md) — Guia de nomenclatura
- [`docs/ARCHITECTURE_GUIDE.md`](../../../../docs/ARCHITECTURE_GUIDE.md) — Guia de arquitetura

---

> 📌 **Última atualização:** 2026-06-22
