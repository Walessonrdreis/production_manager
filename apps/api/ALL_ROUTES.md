# 🗺️ Production Manager API — Lista Completa de Rotas

> **Gerado em:** 2026-06-25
> **Fonte:** Código fonte do bootstrap + arquivos `.route.ts`
> **Módulos registrados:** 8 integração + 6 legado ativos

---

## 📋 Sumário

- [Meta / Health](#-meta--health)
- [Módulos de Integração (Novos)](#-módulos-de-integração-novos)
  - [1. product-structure](#1-product-structure)
  - [2. production-orders](#2-production-orders)
  - [3. sales-order-sync](#3-sales-order-sync)
  - [4. customer-sync](#4-customer-sync)
  - [5. product-catalog](#5-product-catalog)
  - [6. product-stock-fetch](#6-product-stock-fetch)
  - [7. product-manager](#7-product-manager)
  - [8. orders (stage20)](#8-orders-stage20)
- [Módulos Legado (Ativos)](#-módulos-legado-ativos)
  - [9. products (legado)](#9-products-legado)
  - [10. omie-sales-orders](#10-omie-sales-orders)
  - [11. omie-production-orders](#11-omie-production-orders)
  - [12. product-structure (legado)](#12-product-structure-legado)
  - [13. client](#13-client)
  - [14. sales-production-integration](#14-sales-production-integration)
- [Módulos Legado (Desativados)](#-módulos-legado-desativados)

---

## 🏠 Meta / Health

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/` | Root — nome + status da API |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Documentação OpenAPI simplificada |

---

## 🧩 Módulos de Integração (Novos)

### 1. product-structure

**Estrutura de produtos (BOM) — sincronização e gestão**

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/v1/integration/product-structure/commands/sync` | Sincronizar BOM de um produto via Omie |
| `POST` | `/v1/integration/product-structure/commands/sync-global` | Sincronização global de estruturas (paginada) |
| `POST` | `/v1/integration/product-structure/commands/apply` | Aplicar/criar/alterar estrutura no Omie |
| `POST` | `/v1/integration/product-structure/commands/submit` | Submeter estrutura (workflow) — **501 Not Implemented** |
| `POST` | `/v1/integration/product-structure/commands/delete` | Excluir estrutura no Omie |
| `GET` | `/v1/integration/product-structure/commands/:externalRequestId` | Tracking de comando |
| `GET` | `/v1/integration/product-structure/read/summary` | Sumário de estruturas espelhadas |
| `GET` | `/v1/integration/product-structure/read/:productCode/refresh` | Refresh síncrono (consulta Omie + atualiza espelho) |
| `POST` | `/v1/integration/product-structure/callbacks/:externalRequestId/confirm` | Callback confirmação (fake-only) |
| `POST` | `/v1/integration/product-structure/callbacks/:externalRequestId/fail` | Callback falha (fake-only) |
| `GET` | `/v1/admin/read/products/production-readiness` | Readiness de produtos para produção |

**11 rotas**

---

### 2. production-orders

**Ordens de produção — sincronização e gestão de OPs**

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/v1/integration/production-orders/commands/create` | Criar ordem de produção no Omie |
| `POST` | `/v1/integration/production-orders/commands/update` | Atualizar ordem de produção |
| `POST` | `/v1/integration/production-orders/commands/cancel` | Cancelar ordem de produção |
| `POST` | `/v1/integration/production-orders/commands/change-stage` | Mudar estágio da OP |
| `POST` | `/v1/integration/production-orders/commands/sync-global` | Sincronização global de OPs |
| `GET` | `/v1/integration/production-orders/commands/:externalRequestId` | Tracking de comando |
| `POST` | `/v1/integration/production-orders/callbacks/:externalRequestId/confirm` | Callback confirmação (fake-only) |
| `POST` | `/v1/integration/production-orders/callbacks/:externalRequestId/fail` | Callback falha (fake-only) |
| `GET` | `/v1/integration/production-orders/read` | Listar ordens de produção (read-model) |
| `GET` | `/v1/integration/production-orders/read/:omieCode` | Detalhe de uma OP |
| `GET` | `/v1/integration/production-orders/read/stats` | Estatísticas do espelho local |
| `GET` | `/v1/integration/production-orders/read/queue` | Status da fila de comandos |
| `GET` | `/v1/integration/production-orders/read/queue/failures` | Falhas da fila de comandos |
| `GET` | `/v1/integration/production-orders/read/:omieCode/refresh` | Refresh síncrono de uma OP |

**14 rotas**

---

### 3. sales-order-sync

**Pedidos de venda — sincronização bidirecional**

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/v1/integration/sales-order-sync/commands/sync-global` | Sincronização global de pedidos |
| `GET` | `/v1/integration/sales-order-sync/commands/:externalRequestId` | Status de comando |
| `POST` | `/v1/integration/sales-order-sync/callbacks/:externalRequestId/confirm` | Callback confirmação (fake-only) |
| `POST` | `/v1/integration/sales-order-sync/callbacks/:externalRequestId/fail` | Callback falha (fake-only) |

**Read-models (/v1/integration/sales-order-sync/read)**

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/v1/integration/sales-order-sync/read/summary` | Listar pedidos resumidos |
| `GET` | `/v1/integration/sales-order-sync/read/stats` | Estatísticas de pedidos |
| `GET` | `/v1/integration/sales-order-sync/read/:omieId` | Detalhe de um pedido |
| `GET` | `/v1/integration/sales-order-sync/read/open-items` | Itens de pedidos em aberto |
| `GET` | `/v1/integration/sales-order-sync/read/transitions` | Histórico de transições |
| `GET` | `/v1/integration/sales-order-sync/read/:omieId/transitions` | Transições de um pedido |
| `GET` | `/v1/integration/sales-order-sync/read/queue` | Comandos pendentes/processando |
| `GET` | `/v1/integration/sales-order-sync/read/failures` | Comandos com falha |

**Read-models (/v1/admin/read/sales-orders)** — mesmos dados, path alternativo

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/v1/admin/read/sales-orders` | Listar pedidos resumidos |
| `GET` | `/v1/admin/read/sales-orders/stats` | Estatísticas agregadas |
| `GET` | `/v1/admin/read/sales-orders/:omieId` | Detalhe de um pedido |
| `GET` | `/v1/admin/read/sales-orders/open-items` | Itens de pedidos em aberto |
| `GET` | `/v1/admin/read/sales-orders/transitions` | Histórico de transições |
| `GET` | `/v1/admin/read/sales-orders/:omieId/transitions` | Transições de um pedido |

**18 rotas** (10 integration + 6 admin)

---

### 4. customer-sync

**Clientes — sincronização Omie**

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/v1/integration/customer-sync/commands/sync` | Sincronizar um cliente específico |
| `POST` | `/v1/integration/customer-sync/commands/sync-global` | Sincronização global de clientes |
| `GET` | `/v1/integration/customer-sync/commands/:externalRequestId` | Status de comando |

**Read-models**

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/v1/integration/customer-sync/read/summary` | Sumário de clientes sincronizados |
| `GET` | `/v1/integration/customer-sync/read/last-sync` | Última sincronização global |
| `GET` | `/v1/integration/customer-sync/read/sync-history` | Histórico de sincronizações |
| `GET` | `/v1/integration/customer-sync/read/sync-failures` | Falhas de sincronização |
| `GET` | `/v1/admin/read/customers` | Listar clientes (read-model) |
| `GET` | `/v1/admin/read/customers/:customerCode` | Detalhe de um cliente |
| `GET` | `/v1/admin/read/customers/stats` | Estatísticas de clientes |

**10 rotas**

---

### 5. product-catalog

**Catálogo de produtos — espelho Omie**

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/v1/integration/product-catalog/commands/sync` | Sincronizar um produto do catálogo |
| `POST` | `/v1/integration/product-catalog/commands/sync-global` | Sincronização global do catálogo |
| `POST` | `/v1/admin/product-catalog/refresh-production-ready` | Refresh da view production-ready |
| `GET` | `/v1/integration/product-catalog/commands/:externalRequestId` | Status de comando |
| `GET` | `/v1/admin/read/products/catalog` | Catálogo de produtos (read-model) |
| `GET` | `/v1/admin/read/products/catalog/:productCode` | Detalhe de produto no catálogo |
| `GET` | `/v1/admin/read/products/catalog/stats` | Estatísticas do catálogo |
| `GET` | `/v1/integration/product-catalog/read/summary` | Sumário do catálogo (integration) |
| `GET` | `/v1/integration/product-catalog/read/production-ready` | Produtos prontos para produção |
| `GET` | `/v1/integration/product-catalog/read/sync-history` | Histórico de sincronizações |
| `GET` | `/v1/integration/product-catalog/read/sync-failures` | Falhas de sincronização |
| `GET` | `/v1/integration/product-catalog/read/last-sync` | Última sincronização global |

**12 rotas**

---

### 6. product-stock-fetch

**Estoque — consulta e sincronização**

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/v1/integration/product-stock-fetch/commands/refresh` | Refresh de estoque de um produto |
| `POST` | `/v1/integration/product-stock-fetch/commands/sync-global` | Sincronização global de estoque |
| `GET` | `/v1/integration/product-stock-fetch/read/position?productId=` | Posição de estoque (query param) |

**3 rotas**

---

### 7. product-manager

**Gestão de produtos — criar/atualizar/inativar no Omie**

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/v1/integration/product-manager/commands/create` | Criar produto no Omie |
| `POST` | `/v1/integration/product-manager/commands/update` | Atualizar produto no Omie |
| `POST` | `/v1/integration/product-manager/commands/inactivate` | Inativar produto no Omie |

**3 rotas**

---

### 8. orders (stage20)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/v1/integration/orders/stage20` | Obter pedidos stage 20 |

**1 rota**

---

## 🔧 Módulos Legado (Ativos)

### 9. products (legado)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/v1/products` | Lista pública de produtos |
| `GET` | `/v1/products/:omieCode` | Detalhe público por código Omie |
| `GET` | `/v1/products/stock` | **(deprecated)** Redireciona para `/v1/products` |
| `POST` | `/v1/admin/managed-products` | Criar produto gerenciado |
| `POST` | `/v1/admin/managed-products/bulk` | Criar produtos em lote |
| `GET` | `/v1/admin/managed-products` | Listar produtos gerenciados |
| `GET` | `/v1/admin/managed-products/:id` | Detalhe de produto gerenciado |
| `PATCH` | `/v1/admin/managed-products/:id` | Atualizar produto gerenciado |
| `DELETE` | `/v1/admin/managed-products/:id` | Excluir produto gerenciado |
| `GET` | `/v1/admin/managed-products/:id/stock` | Estoque do produto gerenciado |
| `GET` | `/v1/admin/managed-products/:id/stock/history` | Histórico de estoque |
| `GET` | `/v1/admin/omie/sync/products` | Info sincronização Omie |
| `POST` | `/v1/admin/omie/sync/products` | Sincronizar produtos do Omie |
| `GET` | `/v1/admin/omie/products` | Catálogo Omie enriquecido |
| `GET` | `/v1/admin/omie/categories` | Categorias/famílias Omie |
| `GET` | `/v1/admin/omie/products/search` | Search/autocomplete Omie |
| `GET` | `/v1/admin/omie/products/:id` | Detalhe por UUID |
| `GET` | `/v1/admin/omie/products/by-code/:omieCode` | Detalhe por código Omie |
| `GET` | `/v1/admin/omie/products/:id/stock` | Estoque por UUID |
| `GET` | `/v1/admin/omie/products/by-code/:omieCode/stock` | Estoque por código Omie |
| `GET` | `/v1/admin/omie/stock` | Info do estoque persistido |
| `POST` | `/v1/admin/omie/products/stock/refresh` | Refresh/persistência do estoque |
| `GET` | `/v1/admin/read/products` | Listagem de produtos + visão estrutura |
| `GET` | `/v1/admin/read/products/:omieCode/structure` | Estrutura (BOM) de um produto |

---

### 10. omie-sales-orders

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/v1/admin/orders` | Lista geral de pedidos |
| `GET` | `/v1/admin/orders/stage20` | Pedidos stage 20 |
| `GET` | `/v1/admin/orders/stage20/totals` | Totais stage 20 |
| `GET` | `/v1/admin/orders/stage20/totals/detailed` | Totais detalhados stage 20 |
| `POST` | `/v1/admin/omie/orders/stage20/sync` | Sincronizar stage 20 |
| `GET` | `/v1/admin/omie/orders/stage20/sync` | Info sincronização stage 20 |
| `GET` | `/v1/admin/omie/orders/stage20/ping` | Ping Omie |
| `POST` | `/v1/admin/orders/backfill-client-names` | Backfill manual de nomes de clientes |

---

### 11. omie-production-orders

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/v1/admin/omie/production-orders` | Listar OPs |
| `GET` | `/v1/admin/omie/production-orders/:omieCode` | Detalhe por código Omie |
| `GET` | `/v1/admin/omie/production-orders/product/:productCode` | Busca por código do produto |
| `GET` | `/v1/admin/omie/production-orders/product-integration/:integrationCode` | Busca por código de integração |
| `GET` | `/v1/admin/omie/production-orders/stats` | Estatísticas |
| `GET` | `/v1/admin/omie/production-orders/stats/active` | Contagem de ativas |
| `GET` | `/v1/admin/omie/production-orders/stats/completed` | Contagem de concluídas |
| `POST` | `/v1/admin/omie/production-orders/sync` | Sincronizar OPs |
| `GET` | `/v1/admin/omie/production-orders/sync` | Info sincronização |
| `GET` | `/v1/admin/omie/production-orders/ping` | Ping Omie |

---

### 12. product-structure (legado)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/v1/admin/product-structures` | Listar estruturas persistidas |
| `GET` | `/v1/admin/product-structures/:codProduto` | Detalhe de estrutura por código |
| `POST` | `/v1/admin/omie/product-structures/sync` | Sincronizar estrutura pelo Omie |
| `POST` | `/v1/admin/omie/product-structures/sync-job-tick` | Tick de job de sincronização |

---

### 13. client

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/v1/clients` | Listar clientes |
| `GET` | `/v1/clients/:omieClientCode` | Detalhe de cliente |
| `POST` | `/v1/admin/omie/clients/sync` | Sincronizar clientes do Omie |
| `POST` | `/v1/admin/omie/clients/sync-missing` | Sincronizar clientes faltantes |

---

### 14. sales-production-integration

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `POST` | `/api/integration/sales-to-production` | Integrar pedido → fila de produção |
| `GET` | `/api/integration/sales-to-production/statistics` | Estatísticas da integração |

---

## 🔕 Módulos Legado (Desativados)

> Estas rotas **existem no código** mas estão **comentadas no bootstrap**. Não estão ativas.

### sectors
| Método | Caminho |
|--------|---------|
| `POST` | `/v1/admin/sectors` |
| `GET` | `/v1/admin/sectors` |
| `PATCH` | `/v1/admin/sectors/:id` |
| `DELETE` | `/v1/admin/sectors/:id` |

### plans
| Método | Caminho |
|--------|---------|
| `POST` | `/v1/admin/plans` |
| `GET` | `/v1/admin/plans` |
| `GET` | `/v1/admin/plans/:id` |
| `POST` | `/v1/admin/plans/:id/items` |
| `GET` | `/v1/admin/plans/:id/by-sector` |
| `GET` | `/v1/admin/plans/:id/export.csv` |

### internal-production-orders
| Método | Caminho |
|--------|---------|
| `POST` | `/v1/internal-production-orders` |
| `GET` | `/v1/internal-production-orders` |
| `GET` | `/v1/internal-production-orders/:id` |
| `PATCH` | `/v1/internal-production-orders/:id` |
| `POST` | `/v1/internal-production-orders/:id/start` |
| `POST` | `/v1/internal-production-orders/:id/complete` |
| `DELETE` | `/v1/internal-production-orders/:id` |

### trello-integration
| Método | Caminho |
|--------|---------|
| `GET` | `/v1/trello/webhook` |
| `POST` | `/v1/trello/webhook` |

### outros (1 rota cada)
| Método | Caminho | Módulo |
|--------|---------|--------|
| `GET` | `/v1/orders` | orders-view |
| `GET` | `/admin/orders/stage20/enriched` | orders-enriched |
| `POST` | `/api/sync/stock` | sync |
| `POST` | `/api/sync/orders` | sync |
| `GET` | `/api/sync/status` | sync |
| `GET` | `/api/alerts/stock` | stock-alerts |
| `POST` | `/api/production/queue/add` | production-queue |

---

## 📊 Resumo Final

| Categoria | Qtde Rotas | Status |
|-----------|-----------:|--------|
| Meta / Health | 3 | ✅ Ativo |
| **Integração (7 módulos + 1)** | **~71** | ✅ Ativo |
| Legado ativos (6 módulos) | ~44 | ✅ Ativo |
| Legado desativados (7 módulos) | ~22 | 🔕 Comentados |
| **Total (aproximado)** | **~140** | |

> ⚠️ Algumas rotas `deprecated` (ex: `/v1/products/stock`, `/v1/sectors/*`, `/v1/plans/*`) existem como redirecionamento para os novos paths canônicos, mas não foram listadas individualmente aqui.
