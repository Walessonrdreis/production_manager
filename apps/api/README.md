# Production Manager API

API do **Production Manager**: serviço backend para planejamento de produção, com integração ao ERP **Omie**.

**Produção:** https://production-manager-api.onrender.com

---

## 📌 Contrato público

- Endpoint base: `GET /v1/products`
- Chave externa: `omieCode`
- Retorna: produto + estoque atual
- Não chama Omie em tempo real

📄 Documentação:
- `docs/API_CONTRACT.md`
- `docs/REPO_STATUS.md`

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

---

## Scripts principais

- pnpm run dev
- pnpm run build
- pnpm run start
- pnpm metrics:update-docs
- pnpm docs:contract

---

## Arquitetura (Visão Geral)

- server.ts → bootstrap
- app.ts → Fastify + middlewares
- routes → HTTP
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