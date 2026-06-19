# Production Manager API

API do **Production Manager**: serviço backend para planejamento de produção, com integração ao ERP **Omie**.

**Produção:** https://production-manager-api.onrender.com

---

## 📌 Contrato público

- `GET /v1/products` — Lista produtos (espelho Omie)
- `GET /v1/products/:omieCode` — Produto + estoque
- `GET /v1/products/catalog/production-ready` — Catálogo pronto para consumo (API2)
- `GET /v1/products/catalog/summary` — Catálogo resumido
- `GET /v1/customers/summary` — Sumário de clientes ativos

📄 Documentação:
- `docs/API_CONTRACT.md`
- `docs/REPO_STATUS.md`
- `ROUTES.md` — Contrato técnico completo de todas as rotas

---

## 🧩 Módulos de Integração

| Módulo | Descrição | README |
|--------|-----------|--------|
| `product-catalog` | Catálogo de produtos (espelho Omie) + estoque + estrutura + production-ready | [`README`](src/modules/integration/product-catalog/README.md) |
| `sales-order-sync` | Pedidos de venda (espelho Omie) + itens + transições + open-items | [`README`](src/modules/integration/sales-order-sync/README.md) |
| `customer-sync` | Clientes (espelho Omie) | [`README`](src/modules/integration/customer-sync/README.md) |

---

## 📋 Endpoints por Módulo

### Product Catalog — Catálogo de Produtos

**Read-models (GET):**

| Rota | Descrição |
|------|-----------|
| `/v1/admin/read/products/catalog` | Catálogo completo (técnico) |
| `/v1/admin/read/products/catalog/:productCode` | Produto específico |
| `/v1/admin/read/products/catalog/stats` | Estatísticas do catálogo |
| `/v1/products/catalog/summary` | Catálogo resumido (API2) |
| `/v1/products/catalog/production-ready` | Catálogo pronto para produção (API2) |
| `/v1/integration/product-catalog/sync-status/:externalRequestId` | Status de sync |
| `/v1/integration/product-catalog/sync-history` | Histórico de comandos |
| `/v1/integration/product-catalog/sync-failures` | Falhas de sincronização |
| `/v1/integration/product-catalog/last-sync` | Último sync global |
| `/v1/admin/product-catalog/lock-status` | Status do lock de sync |

**Comandos (POST):**

| Rota | Descrição |
|------|-----------|
| `/v1/integration/product-catalog/:productCode/sync` | Sync de 1 produto |
| `/v1/integration/product-catalog/sync-global` | Sync global do catálogo |
| `/v1/admin/product-catalog/refresh-production-ready` | Refresh do read-model |
| `/v1/admin/product-catalog/release-lock` | Liberar lock manualmente |

---

### Sales Order Sync — Pedidos de Venda

**Read-models (GET):**

| Rota | Descrição |
|------|-----------|
| `/v1/admin/read/sales-orders` | Lista de pedidos (resumo) |
| `/v1/admin/read/sales-orders/stats` | Estatísticas dos pedidos |
| `/v1/admin/read/sales-orders/transitions` | Histórico de transições |
| `/v1/admin/read/sales-orders/:omieId/transitions` | Transições de 1 pedido |
| `/v1/admin/read/sales-orders/open-items` | Itens em aberto (picking) |
| `/v1/integration/sales-order-sync/sync-status/:externalRequestId` | Status de sync |

**Comandos (POST):**

| Rota | Descrição |
|------|-----------|
| `/v1/integration/sales-order-sync/sync-global` | Sync global de pedidos |

---

### Customer Sync — Clientes

**Read-models (GET):**

| Rota | Descrição |
|------|-----------|
| `/v1/admin/read/customers` | Lista/busca clientes |
| `/v1/admin/read/customers/:customerCode` | Cliente específico |
| `/v1/admin/read/customers/stats` | Estatísticas |
| `/v1/customers/summary` | Sumário (API2) |
| `/v1/integration/customer-sync/sync-status/:externalRequestId` | Status de sync |
| `/v1/integration/customer-sync/sync-history` | Histórico de comandos |
| `/v1/integration/customer-sync/sync-failures` | Falhas |
| `/v1/integration/customer-sync/last-sync` | Último sync global |

**Comandos (POST):**

| Rota | Descrição |
|------|-----------|
| `/v1/integration/customer-sync/:customerCode/sync` | Sync de 1 cliente |
| `/v1/integration/customer-sync/sync-global` | Sync global de clientes |

---

### Product Structure — Estrutura (BOM)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/admin/read/products/production-readiness` | Readiness de produção |
| POST | `/v1/integration/product-structure/:productCode/sync` | Sincronizar estrutura |
| POST | `/v1/integration/product-structure/:productCode/apply` | Aplicar estrutura |
| POST | `/v1/integration/product-structure/:productCode/delete` | Excluir estrutura |

---

## Tecnologias

- Node.js 20 + TypeScript
- Fastify
- Prisma + PostgreSQL
- Zod
- Vitest

---

## Como Rodar

### Pré-requisitos
- Node.js 20
- pnpm
- PostgreSQL ou DATABASE_URL

### Variáveis de Ambiente

Obrigatórias:
- DATABASE_URL
- OMIE_APP_KEY
- OMIE_APP_SECRET
- OMIE_BASE_URL

Opcionais:
- PORT (default 3333)
- CORS_ORIGIN
- ENABLE_STOCK_REFRESH_JOB
- STOCK_REFRESH_CRON
- OMIE_PRODUCT_SYNC_CRON
- PRODUCT_CATALOG_GATEWAY (fake|real)
- SALES_ORDER_SYNC_GATEWAY (fake|real)
- CUSTOMER_SYNC_GATEWAY (fake|real)

---

## Scripts principais

- `pnpm dev` — Desenvolvimento (tsx watch)
- `pnpm build` — Compilar TypeScript
- `pnpm start` — Produção
- `pnpm metrics:update-docs` — Atualizar métricas
- `pnpm docs:contract` — Gerar contrato

---

## Arquitetura (Visão Geral)

```
server.ts → bootstrap → app.ts (Fastify + middlewares)
├── routes → HTTP (Fastify routes)
├── modules → Módulos de integração (product-catalog, sales-order-sync, customer-sync)
│   ├── application/ → use-cases, ports, DTOs
│   ├── infrastructure/ → stores, gateways, jobs
│   └── presentation/ → rotas HTTP
├── services → regra de negócio
├── repositories → Prisma
└── jobs → cron
```

---

## Observações

- Endpoints públicos nunca chamam Omie
- Comandos de integração retornam `202 Accepted` (eventual-consistente)
- Read-models não executam efeitos colaterais
- Consulte `ROUTES.md` para o contrato técnico completo
- Consulte `src/modules/integration/*/README.md` para detalhes de cada módulo
- services → regra de negócio
- repositories → Prisma
- jobs → cron

---

## Rotas principais

- GET /v1/products (contrato público)
- GET /v1/products/:omieCode
- POST /v1/admin/omie/products/stock/refresh
- POST /v1/admin/omie/sync/products

---

## Observações

- Endpoints públicos nunca chamam Omie
- Estoque vem de cache (`ProductStock`)
- README gerado automaticamente
``