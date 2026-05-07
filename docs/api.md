# API (backend) — resumo objetivo

Projeto backend em `apps/api`, implementado em Node.js + TypeScript, com servidor HTTP em Fastify e persistência via Prisma (PostgreSQL). O processo inicia em `src/server.ts`, monta a aplicação em `src/bootstrap/app.ts`, registra rotas em `src/bootstrap/routes.ts` e sobe o listener em `src/bootstrap/server.ts`.

## Stack

- Node.js + TypeScript
- Fastify (+ CORS)
- Prisma + PostgreSQL
- Zod + dotenv (validação e carregamento de variáveis de ambiente)
- node-cron (jobs agendados)
- Vitest (testes)
- tsup (build para `dist/`)

## Pontos de entrada

- `apps/api/src/server.ts`: entrypoint do processo (carrega `.env` e inicia o servidor)
- `apps/api/src/bootstrap/server.ts`: `startServer()` (build do app + `listen`)
- `apps/api/src/bootstrap/app.ts`: `buildApp()` (plugins, decorators, handler de erro, rotas, jobs)
- `apps/api/src/bootstrap/routes.ts`: registro de rotas (ex.: prefixo `/v1`)

## Estrutura de diretórios (visão geral)

```text
apps/api/
├─ src/
│  ├─ server.ts
│  ├─ bootstrap/
│  │  ├─ app.ts            (montagem Fastify, plugins, jobs)
│  │  ├─ server.ts         (listen)
│  │  └─ routes.ts         (registro de rotas)
│  ├─ config/
│  │  └─ env.ts            (schema/validação de env com Zod)
│  ├─ infra/               (infraestrutura: db/prisma, etc.)
│  ├─ modules/             (features por domínio)
│  ├─ shared/              (cross-cutting: errors, logger, http, integrações)
│  ├─ contracts/           (contratos/tipos compartilháveis)
│  └─ legacy/              (código legado preservado)
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ tests/                  (Vitest)
├─ scripts/                (utilitários de DX/geração/apoio)
├─ docs/                   (documentação interna / artefatos gerados)
├─ dist/                   (artefatos do build)
├─ package.json            (scripts e dependências)
├─ tsup.config.ts          (config do build)
└─ tsconfig*.json          (configs TypeScript)
```

## Módulos (src/modules)

Organização por domínio/feature. Em geral cada módulo agrupa rotas, schemas/validação, casos de uso e integrações do seu contexto.

- `products`: catálogo, estoque, “managed-products” e sincronização com Omie
- `omie-orders`: sincronização/persistência/consulta de pedidos (ex.: stage 20)
- `orders-enriched`: composição/enriquecimento de dados para consumo interno
- `orders-view`: visão agregada/leitura para listagem de pedidos
- `client`: sincronização/consulta de clientes Omie
- `sectors`: CRUD/casos de uso para setores
- `product-sector`: relação/setor padrão de produto
- `plans`: planos (inclui exportação CSV)

## Infra e compartilhados

- `src/infra`: camadas de infraestrutura (ex.: client Prisma)
- `src/shared`:
  - `errors`: exceções de domínio (ex.: `AppError`) e mapeamentos de erro
  - `http`: helpers/adapter de request/response e utilidades de endpoint
  - `integrations`: clientes para serviços externos (ex.: Omie)
  - `logger`: logging
  - `jobs`: utilitários para jobs (ex.: backoff/lock)

## Jobs (cron)

Jobs são inicializados durante o bootstrap do app (condicionados por flags/variáveis de ambiente) para tarefas como sincronização (produtos/pedidos/clientes) e refresh de estoque.

## Rodar, build e testes (scripts)

- `pnpm -C apps/api dev`: desenvolvimento (executa `src/server.ts`)
- `pnpm -C apps/api build`: build para `dist/`
- `pnpm -C apps/api start`: produção (inclui `prisma migrate deploy`)
- `pnpm -C apps/api test`: testes (Vitest)
- `pnpm -C apps/api db:migrate`: migrações (ambiente local)

## Variáveis de ambiente (alto nível)

Obrigatórias para execução completa (mínimo típico):

- `DATABASE_URL` (PostgreSQL)
- `OMIE_APP_KEY`, `OMIE_APP_SECRET`, `OMIE_BASE_URL` (integração Omie)
