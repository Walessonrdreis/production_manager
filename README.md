# Production Manager

Monorepo para gestão de produção com integração Omie.

O projeto é dividido em:
- API em Fastify + TypeScript + Prisma
- Frontend em React + Vite + React Query
- Pacote compartilhado com contratos e schemas

## Visão Geral

O fluxo principal do sistema é:
- sincronizar produtos da Omie para o espelho local
- mapear produtos para setores de produção
- montar planos de produção
- adicionar itens aos planos com agrupamento por setor

## Estrutura do Repositório

```text
production_manager/
├─ apps/
│  ├─ api/        # Backend Fastify + Prisma
│  └─ web/        # Frontend React + Vite
├─ packages/
│  └─ shared/     # Contratos e schemas compartilhados
├─ docker-compose.yml
├─ package.json
└─ pnpm-workspace.yaml
```

## Stack

- Node.js
- pnpm workspace
- Fastify
- Prisma + PostgreSQL
- React
- Vite
- TanStack Query
- Zod
- Vitest

## Requisitos

Antes de iniciar, tenha instalado:
- Node.js 20+ recomendado
- pnpm
- Docker Desktop ou um PostgreSQL disponível

## Instalação

Na raiz do projeto:

```bash
pnpm install
```

## Banco de Dados

O repositório já possui um `docker-compose.yml` com PostgreSQL.

Para subir o banco:

```bash
docker compose up -d
```

Depois aplique as migrations no backend:

```bash
// Para aplicar as migrations em desenvolvimento:
pnpm --filter @production-manager/api run db:migrate:dev

// Para aplicar as migrations em produção:
pnpm --filter @production-manager/api run db:migrate:prod
```
Para gerar o Cliente Prisma
```bash
pnpm --filter api prisma:generate

```
Para abrir o Prisma Studio:

```bash
pnpm --filter @production-manager/api run db:studio
```
```bash
// Para criar arquivos rapidamente em duas etapas
 pnpm --filter @production-manager/api run create:file
```

## Variáveis de Ambiente

### Backend

Crie o arquivo `apps/api/.env`:

```env
PORT=3333
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/production_manager?schema=public"
OMIE_APP_KEY="sua_app_key"
OMIE_APP_SECRET="seu_app_secret"
OMIE_BASE_URL="https://app.omie.com.br/api/v1/"
CORS_ORIGIN="http://localhost:5174"
```

Observações:
- `DATABASE_URL` é obrigatória para Prisma e API
- `OMIE_APP_KEY`, `OMIE_APP_SECRET` e `OMIE_BASE_URL` são obrigatórias para a sincronização com a Omie
- `CORS_ORIGIN` deve apontar para a URL do frontend

### Frontend

O frontend funciona sem `.env` se a API estiver em `http://localhost:3333`.

Se quiser configurar explicitamente, crie `apps/web/.env`:

```env
VITE_API_BASE_URL="http://localhost:3333"
```

## Como Rodar

### Rodar tudo em modo desenvolvimento

Na raiz:

```bash
pnpm dev
```

Isso inicia:
- API em modo watch
- frontend com Vite

### Rodar só a API

```bash
pnpm --filter @production-manager/api run dev
```

### Rodar só o frontend

```bash
pnpm --filter @production-manager/web run dev
```

## URLs Padrão

- Frontend: `http://localhost:5173` ou a porta que o Vite escolher
- API: `http://localhost:3333`
- Health check: `http://localhost:3333/health`

## Scripts Disponíveis

### Raiz do monorepo

```bash
pnpm dev
pnpm build
pnpm test
pnpm lint
```

### Backend

```bash
pnpm --filter @production-manager/api run dev
pnpm --filter @production-manager/api run build
pnpm --filter @production-manager/api run start
pnpm --filter @production-manager/api run test
pnpm --filter @production-manager/api run db:migrate
pnpm --filter @production-manager/api run db:studio
```

### Frontend

```bash
pnpm --filter @production-manager/web run dev
pnpm --filter @production-manager/web run build
pnpm --filter @production-manager/web run preview
pnpm --filter @production-manager/web run lint
```

## Funcionalidades Atuais

### Frontend

Páginas principais:
- `/` sincronização Omie
- `/omie` catálogo local sincronizado da Omie
- `/products` produtos internos e setor padrão
- `/sectors` cadastro de setores
- `/plans` listagem e criação de planos
- `/plans/:id` detalhe do plano e agrupamento por setor

### Backend
#### API Pública (BizChat)

Contrato público estável (não chama Omie externamente):
- `GET /v1/products` (base)
- `GET /v1/products/:omieCode`

Exemplos:

```bash
curl "http://localhost:3333/v1/products?q=cor&page=1&pageSize=50"
curl "http://localhost:3333/v1/products/12345"
```

Resposta padrão (public): `{ data, meta }`

#### API Admin (interno)

Base: `/v1/admin/*`

Principais grupos:
- Omie (admin): `/v1/admin/omie/*`
- Produtos gerenciados: `/v1/admin/managed-products*`
- Setores: `/v1/admin/sectors*`
- Planos: `/v1/admin/plans*`

Observação de compatibilidade:
- Alguns endpoints antigos e/ou internos podem responder em formato "legacy" quando o header `X-Response-Format: legacy` é enviado.

#### Aliases Deprecated

Endpoints antigos continuam funcionando como aliases, mas retornam:
- `Deprecation: true`
- `Sunset: <ISO>` (configurável por `DEPRECATION_SUNSET`)

O backend também registra warning com `requestId` (header `X-Request-Id` opcional) para rastrear consumo de endpoints deprecated.

#### Descoberta e Debug

- `GET /v1` retorna um índice autoexplicativo com:
  - `publicEndpoints`
  - `adminEndpoints`
  - `deprecatedEndpoints` (inclui `replacement`)
- Para resposta JSON mais legível:
  - query `?pretty=true` ou header `X-Pretty: true`

## Regras de Uso

- use `pnpm` para todos os comandos do workspace
- mantenha os contratos compartilhados em `packages/shared`
- ao alterar payloads entre frontend e backend, atualize os schemas compartilhados
- não versione arquivos `.env`
- use `requestId` para rastrear chamadas críticas, principalmente sincronização Omie
- erros da API devem retornar JSON estruturado com `code`, `message`, `details` e `requestId`

## Fluxo Recomendado de Desenvolvimento

1. subir o banco
2. instalar dependências com `pnpm install`
3. criar `apps/api/.env`
4. rodar migrations
5. iniciar o monorepo com `pnpm dev`
6. validar o health check da API
7. testar a sincronização Omie pela tela inicial

## Testes e Validação

Para rodar os testes do backend:

```bash
pnpm --filter @production-manager/api run test
```

Para gerar build do workspace:

```bash
pnpm build
```

Para lint do workspace:

```bash
pnpm lint
```

## Troubleshooting

### Erro de ambiente inválido

Se a API falhar ao subir com erro de variáveis de ambiente:
- revise o arquivo `apps/api/.env`
- confirme `DATABASE_URL`, `OMIE_APP_KEY`, `OMIE_APP_SECRET`, `OMIE_BASE_URL` e `CORS_ORIGIN`

### Erro na sincronização Omie

Verifique:
- credenciais Omie válidas
- `OMIE_BASE_URL` correta
- conectividade de rede
- resposta da API com `requestId` para rastrear no backend

### Erro de conexão com banco

Confirme:
- PostgreSQL rodando
- porta `5432` disponível
- `DATABASE_URL` apontando para o banco correto

## Observações

- o backend usa Prisma com PostgreSQL
- o frontend consome a API via `VITE_API_BASE_URL`
- a sincronização Omie possui tratamento global de erros e `requestId`
- existe um lock de sincronização para evitar concorrência
