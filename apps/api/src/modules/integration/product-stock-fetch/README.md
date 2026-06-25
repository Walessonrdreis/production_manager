# Módulo de Integração: product-stock-fetch

**Propósito**: Consulta a posição de estoque de produtos no Omie e persiste localmente.

**Ownership**: API 1 (exclusivo)

---

## 📋 Rotas

### Commands

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/v1/integration/product-stock-fetch/commands/refresh` | Atualiza estoque de um produto (202 Accepted) |
| POST | `/v1/integration/product-stock-fetch/commands/sync-global` | Sync completo de todos os estoques (202 Accepted) |

### Read

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/integration/product-stock-fetch/read/position?productId=...` | Consulta posição de estoque no Omie |

---

## 🔧 Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PRODUCT_STOCK_FETCH_GATEWAY` | `fake` | `fake` ou `real` |
| `ENABLE_OMIE_PRODUCT_STOCK_FETCH_REFRESH_JOB` | `false` | Habilita job automático |
| `PRODUCT_STOCK_FETCH_REFRESH_CRON` | `*/30 * * * *` | Cron do job de refresh |

---

## 🏗️ Arquitetura

```
product-stock-fetch/
├── application/
│   ├── ports/              → ProductStockFetchGateway (interface)
│   ├── dto/                → Tipos de request/response
│   ├── mappers/            → Mapeamento defensivo de dados Omie
│   └── use-cases/          → GetProductStockPositionUseCase
│                             RefreshProductStockUseCase (com idempotência)
├── infrastructure/
│   ├── db/                 → ProductStockCommandStore / ProductStockIntegrationStore
│   ├── gateways/           → RealProductStockFetchGateway / FakeProductStockFetchGateway
│   └── jobs/               → RefreshProductStockJob
└── presentation/
    └── http/
        ├── routes/         → refresh-product-stock.route.ts
        │                     get-product-stock-position.route.ts
        └── routes.ts       → Registro central
```
