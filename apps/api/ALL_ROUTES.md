# 🗺️ Production Manager API — Lista Completa de Rotas

> **Gerado em:** 2026-06-25
> **Fonte:** Código fonte do bootstrap + arquivos `.route.ts`
> **Módulos de integração:** 7

---

## 📋 Sumário

- [🏠 Meta / Health](#-meta--health)
- [🧩 Módulos de Integração](#-módulos-de-integração)
  - [1. product-structure](#1-product-structure)
  - [2. production-orders](#2-production-orders)
  - [3. sales-order-sync](#3-sales-order-sync)
  - [4. customer-sync](#4-customer-sync)
  - [5. product-catalog](#5-product-catalog)
  - [6. product-stock-fetch](#6-product-stock-fetch)
  - [7. product-manager](#7-product-manager)
- [🚀 Curl Commands — Todas as Rotas](#-curl-commands--todas-as-rotas)

---

## 🏠 Meta / Health

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/` | Root — nome + status da API |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Documentação OpenAPI simplificada |

---

## 🧩 Módulos de Integração

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

---

## 🚀 Curl Commands — Todas as Rotas

> Base URL: `http://localhost:3333`
> Use `-H "Content-Type: application/json"` em todos os POST. Parâmetros entre `<>` são placeholders.

---

### product-structure

```bash
# ── Commands ──
curl -s -X POST http://localhost:3333/v1/integration/product-structure/commands/sync -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","productCode":"<codigo>"}'
curl -s -X POST http://localhost:3333/v1/integration/product-structure/commands/sync-global -H "Content-Type: application/json" -d '{"externalRequestId":"opcional"}'
curl -s -X POST http://localhost:3333/v1/integration/product-structure/commands/apply -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","productCode":"<codigo>","structure":{"items":[{"componentCode":"<comp>","quantity":1}]}}'
curl -s -X POST http://localhost:3333/v1/integration/product-structure/commands/submit -H "Content-Type: application/json" -d '{}'
curl -s -X POST http://localhost:3333/v1/integration/product-structure/commands/delete -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","productCode":"<codigo>"}'

# ── Callbacks ──
curl -s -X POST http://localhost:3333/v1/integration/product-structure/callbacks/<externalRequestId>/confirm
curl -s -X POST http://localhost:3333/v1/integration/product-structure/callbacks/<externalRequestId>/fail

# ── Read-models ──
curl -s http://localhost:3333/v1/integration/product-structure/commands/<externalRequestId>
curl -s http://localhost:3333/v1/integration/product-structure/read/summary
curl -s "http://localhost:3333/v1/integration/product-structure/read/<productCode>/refresh"
curl -s "http://localhost:3333/v1/admin/read/products/production-readiness?view=summary"
```

---

### production-orders

```bash
# ── Commands ──
curl -s -X POST http://localhost:3333/v1/integration/production-orders/commands/create -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","productCode":"<codigo>","quantity":100}'
curl -s -X POST http://localhost:3333/v1/integration/production-orders/commands/update -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","omieCode":"<codigo>","quantity":200}'
curl -s -X POST http://localhost:3333/v1/integration/production-orders/commands/cancel -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","omieCode":"<codigo>"}'
curl -s -X POST http://localhost:3333/v1/integration/production-orders/commands/change-stage -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","omieCode":"<codigo>","stage":"<novo_estagio>"}'
curl -s -X POST http://localhost:3333/v1/integration/production-orders/commands/sync-global -H "Content-Type: application/json" -d '{"externalRequestId":"opcional"}'

# ── Callbacks ──
curl -s -X POST http://localhost:3333/v1/integration/production-orders/callbacks/<externalRequestId>/confirm
curl -s -X POST http://localhost:3333/v1/integration/production-orders/callbacks/<externalRequestId>/fail

# ── Read-models ──
curl -s http://localhost:3333/v1/integration/production-orders/commands/<externalRequestId>
curl -s http://localhost:3333/v1/integration/production-orders/read
curl -s http://localhost:3333/v1/integration/production-orders/read/<omieCode>
curl -s http://localhost:3333/v1/integration/production-orders/read/stats
curl -s http://localhost:3333/v1/integration/production-orders/read/queue
curl -s http://localhost:3333/v1/integration/production-orders/read/queue/failures
curl -s http://localhost:3333/v1/integration/production-orders/read/<omieCode>/refresh
```

---

### sales-order-sync

```bash
# ── Commands ──
curl -s -X POST http://localhost:3333/v1/integration/sales-order-sync/commands/sync-global -H "Content-Type: application/json" -d '{"externalRequestId":"opcional"}'

# ── Callbacks ──
curl -s -X POST http://localhost:3333/v1/integration/sales-order-sync/callbacks/<externalRequestId>/confirm
curl -s -X POST http://localhost:3333/v1/integration/sales-order-sync/callbacks/<externalRequestId>/fail

# ── Read-models (integration) ──
curl -s http://localhost:3333/v1/integration/sales-order-sync/commands/<externalRequestId>
curl -s http://localhost:3333/v1/integration/sales-order-sync/read/summary
curl -s http://localhost:3333/v1/integration/sales-order-sync/read/stats
curl -s http://localhost:3333/v1/integration/sales-order-sync/read/<omieId>
curl -s http://localhost:3333/v1/integration/sales-order-sync/read/open-items
curl -s http://localhost:3333/v1/integration/sales-order-sync/read/transitions
curl -s http://localhost:3333/v1/integration/sales-order-sync/read/<omieId>/transitions
curl -s http://localhost:3333/v1/integration/sales-order-sync/read/queue
curl -s http://localhost:3333/v1/integration/sales-order-sync/read/failures

# ── Read-models (admin) ──
curl -s http://localhost:3333/v1/admin/read/sales-orders
curl -s http://localhost:3333/v1/admin/read/sales-orders/stats
curl -s http://localhost:3333/v1/admin/read/sales-orders/<omieId>
curl -s http://localhost:3333/v1/admin/read/sales-orders/open-items
curl -s http://localhost:3333/v1/admin/read/sales-orders/transitions
curl -s http://localhost:3333/v1/admin/read/sales-orders/<omieId>/transitions
```

---

### customer-sync

```bash
# ── Commands ──
curl -s -X POST http://localhost:3333/v1/integration/customer-sync/commands/sync -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","customerCode":"<codigo>"}'
curl -s -X POST http://localhost:3333/v1/integration/customer-sync/commands/sync-global -H "Content-Type: application/json" -d '{"externalRequestId":"opcional"}'

# ── Read-models (integration) ──
curl -s http://localhost:3333/v1/integration/customer-sync/commands/<externalRequestId>
curl -s http://localhost:3333/v1/integration/customer-sync/read/summary
curl -s http://localhost:3333/v1/integration/customer-sync/read/last-sync
curl -s http://localhost:3333/v1/integration/customer-sync/read/sync-history
curl -s http://localhost:3333/v1/integration/customer-sync/read/sync-failures

# ── Read-models (admin) ──
curl -s http://localhost:3333/v1/admin/read/customers
curl -s http://localhost:3333/v1/admin/read/customers/<customerCode>
curl -s http://localhost:3333/v1/admin/read/customers/stats
```

---

### product-catalog

```bash
# ── Commands ──
curl -s -X POST http://localhost:3333/v1/integration/product-catalog/commands/sync -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","productCode":"<codigo>"}'
curl -s -X POST http://localhost:3333/v1/integration/product-catalog/commands/sync-global -H "Content-Type: application/json" -d '{"externalRequestId":"opcional"}'
curl -s -X POST http://localhost:3333/v1/admin/product-catalog/refresh-production-ready -H "Content-Type: application/json" -d '{}'

# ── Read-models (integration) ──
curl -s http://localhost:3333/v1/integration/product-catalog/commands/<externalRequestId>
curl -s http://localhost:3333/v1/integration/product-catalog/read/summary
curl -s http://localhost:3333/v1/integration/product-catalog/read/production-ready
curl -s http://localhost:3333/v1/integration/product-catalog/read/sync-history
curl -s http://localhost:3333/v1/integration/product-catalog/read/sync-failures
curl -s http://localhost:3333/v1/integration/product-catalog/read/last-sync

# ── Read-models (admin) ──
curl -s http://localhost:3333/v1/admin/read/products/catalog
curl -s http://localhost:3333/v1/admin/read/products/catalog/<productCode>
curl -s http://localhost:3333/v1/admin/read/products/catalog/stats
```

---

### product-stock-fetch

```bash
# ── Commands ──
curl -s -X POST http://localhost:3333/v1/integration/product-stock-fetch/commands/refresh -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","productId":"<codigo>"}'
curl -s -X POST http://localhost:3333/v1/integration/product-stock-fetch/commands/sync-global -H "Content-Type: application/json" -d '{"externalRequestId":"opcional"}'

# ── Read-models ──
curl -s "http://localhost:3333/v1/integration/product-stock-fetch/read/position?productId=<productId>"
```

---

### product-manager

```bash
# ── Commands ──
curl -s -X POST http://localhost:3333/v1/integration/product-manager/commands/create -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","name":"<nome>","code":"<codigo>"}'
curl -s -X POST http://localhost:3333/v1/integration/product-manager/commands/update -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","code":"<codigo>","name":"<novo_nome>"}'
curl -s -X POST http://localhost:3333/v1/integration/product-manager/commands/inactivate -H "Content-Type: application/json" -d '{"externalRequestId":"meu-id","code":"<codigo>"}'
```




