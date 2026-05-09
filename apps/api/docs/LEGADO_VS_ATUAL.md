# Legado (`src/legacy`) vs API atual (`apps/api`) — resumo comparativo

## Objetivo

Este documento descreve o que existe em `apps/api/src/legacy` (código preservado do legado) e como isso se compara com a API atual em produção (arquitetura modular em `apps/api/src`), com foco em:

- estrutura e responsabilidades
- boot/rotas/jobs/syncs
- onde procurar a “verdade” hoje
- como usar o legado como referência sem reativá-lo como runtime principal

---

## O que é o `src/legacy`

`apps/api/src/legacy` é uma **cópia preservada** do backend anterior (estilo “monólito por pastas”), mantida para:

- preservar contratos e edge cases já validados em produção
- servir de referência de comportamento durante a refatoração
- permitir comparação rápida (rotas, payloads, regras, paginação, locks)

Não é o “padrão alvo” para novas implementações: o alvo é `src/modules/*` (com `src/bootstrap/*`, `src/shared/*` e `src/infra/*`).

---

## Foto de alto nível (lado a lado)

| Aspecto | Legado (`src/legacy`) | Atual (arquitetura modular) |
|---|---|---|
| Organização | Rotas/serviços/repositórios em pastas “técnicas” | Domínios em `src/modules/*` (application / infrastructure / presentation) |
| Boot | `legacy/buildApp()` monta Fastify e registra `appRoutes` | `bootstrap/buildApp()` monta Fastify, decora `prisma`/`omieClient`, registra módulos e inicializa jobs por flags |
| Rotas | `legacy/routes/*` | `modules/*/presentation/http/*.routes.ts` + índice em `bootstrap/routes.ts` |
| Jobs | `legacy/jobs/*` chamando `legacy/services/*` | `modules/*/infrastructure/jobs/*` chamando use cases do módulo |
| Integrações (Omie) | `legacy/integrations/omie/*` | `shared/integrations/omie/*` com `omieClient` decorado no Fastify |
| Persistência | Repos/serviços acessam Prisma/DB de forma direta | Repos em `infrastructure/db` + use cases orquestram escrita/leitura |
| Lock de execução | `jobLock.service.ts` + padrões no core/serviços | lock por tabela (ex.: `sync_lock`) e erro `SYNC_IN_PROGRESS` em use cases/repos |
| Compatibilidade | Contrato e aliases implementados diretamente nas rotas do legado | Contratos preservados com rotas “deprecated/alias”, mantendo payloads |

---

## Estrutura: onde fica o quê

### Legado (preservado)

Principais entradas/áreas:

- App/boot legado: [legacy/app.ts](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/legacy/app.ts)
- Rotas legadas: [legacy/routes](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/legacy/routes)
- Jobs legados: [legacy/jobs](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/legacy/jobs)
- “Core” de sync (referência forte): [legacy/core](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/legacy/core)
- Serviços/regras: [legacy/services](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/legacy/services)
- Repositórios: [legacy/repositories](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/legacy/repositories)

### Atual (funcionando hoje)

Principais entradas/áreas:

- Entrada do processo: [server.ts](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/server.ts)
- Montagem do Fastify + jobs: [bootstrap/app.ts](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/bootstrap/app.ts)
- Registro de rotas/módulos: [bootstrap/routes.ts](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/bootstrap/routes.ts)
- Módulos por domínio: [src/modules](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/modules)
- Infra comum (Prisma): `src/infra/*`
- Shared (erros/logger/http/integrações): `src/shared/*`

---

## Boot e registro de rotas

### Legado

- `legacy/buildApp()` registra `appRoutes` e inicia jobs “no final” do boot.
- Registro de rotas no legado é **centralizado** em [legacy/routes/index.ts](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/legacy/routes/index.ts):
  - define `/`, `/health`, `/v1` (índice)
  - registra rotas específicas com `app.register(omieRoutes)`, `productsRoutes`, `sectorRoutes`, `productSectorRoutes`, `plansRoutes`

### Atual

- `buildApp()` em [bootstrap/app.ts](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/bootstrap/app.ts) monta Fastify e:
  - decora `prisma`
  - decora `omieClient` (uso obrigatório antes das rotas)
  - registra rotas via `registerRoutes(app)` (que registra módulos)
  - inicia jobs **condicionados por flags/env** e **após** o registro de rotas
- Índice `/v1` no atual continua exibindo listas (public/admin/deprecated) em [bootstrap/routes.ts](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/bootstrap/routes.ts)

Implicação prática:

- o legado era “um conjunto de rotas + serviços”
- o atual é “um conjunto de módulos registrados”, cada um com seus handlers/use cases/repos

---

## Jobs e syncs

### No legado

Padrão:

- job do cron chama um `service` diretamente
- exemplo: [legacy/jobs/stockRefresh.job.ts](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/legacy/jobs/stockRefresh.job.ts) chama `runStockRefresh()` em `legacy/services/stockRefresh.service.ts`

Características:

- agendamento via `node-cron`
- controle local de concorrência (`inFlight`)
- controle global via lock/serviço (ex.: `jobLock.service.ts` / meta `skippedLocked`)

### No atual

Padrão:

- job do cron chama **use case do módulo**
- exemplo: [stock-refresh.job.ts](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/modules/products/infrastructure/jobs/stock-refresh.job.ts) chama `useCases.refreshStock.execute()`
- exemplo: [omie-product-sync.job.ts](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/src/modules/products/infrastructure/jobs/omie-product-sync.job.ts) chama `useCases.syncOmieProducts.execute(...)`

Características:

- agendamento via `node-cron`
- controle local (`inFlight`)
- controle global no DB via lock e erro `SYNC_IN_PROGRESS` (padrão atual)
- jobs iniciados no boot por flags (ex.: `ENABLE_STOCK_REFRESH_JOB`, `ENABLE_OMIE_PRODUCT_SYNC_JOB`, etc.)

Checklist de “está funcionando hoje” (sinal mínimo):

- log `job scheduled` no startup
- execuções com `started`/`finished`
- DB com `updated_at/lastRefreshAt` avançando

---

## Integração Omie

### Legado

- Integrações em `legacy/integrations/omie/*` (client/adapters/cache)
- Rotas Omie no legado tendem a compor respostas e também disparar syncs em endpoints admin

### Atual

- `omieClient` é decorado no Fastify no bootstrap (dependência padrão dos módulos)
- Integrações ficam em `src/shared/integrations/omie/*` e os módulos consomem via `request.server.omieClient` (ou padrão equivalente)

Implicação:

- no atual, a integração deve ficar “shared” e o comportamento deve morar em `application/use-cases` do módulo, não em route handler.

---

## Contratos HTTP e compatibilidade

Pontos em comum (devem permanecer verdadeiros):

- o contrato público principal é `GET /v1/products` (catálogo + estoque), conforme [API_CONTRACT.md](file:///c:/Users/Dell/Documents/trae_projects/production_manager/apps/api/docs/API_CONTRACT.md)
- endpoints admin existem para operação interna (`/v1/admin/*`)

No legado, existiam rotas e aliases para padronização:

- `/v1/omie/*` → `/v1/admin/omie/*`
- `/v1/admin/products*` → `/v1/admin/managed-products*`
- `/v1/sectors*` → `/v1/admin/sectors*`
- `/v1/plans*` → `/v1/admin/plans*`

No atual, esse conceito foi mantido via rotas “deprecated/alias” na camada de apresentação (sem quebrar payloads).

---

## Mapa de equivalências (legado → atual)

Use este mapa para localizar “onde reimplementar” quando algo existir no legado, mas não estiver atualizando no atual.

### Sync de produtos Omie

- Legado:
  - core/regras: `legacy/core/SyncOmieProductsService.ts`
  - job: `legacy/jobs/omieProductSync.job.ts`
  - endpoint/admin: rotas Omie em `legacy/routes/omie.ts`
- Atual:
  - módulo: `src/modules/products`
  - job: `modules/products/infrastructure/jobs/omie-product-sync.job.ts`
  - lock: `modules/products/infrastructure/db/sync-lock.repo.prisma.ts` (erro `SYNC_IN_PROGRESS`)

### Refresh de estoque (snapshot persistido)

- Legado:
  - job: `legacy/jobs/stockRefresh.job.ts`
  - service: `legacy/services/stockRefresh.service.ts`
- Atual:
  - módulo: `src/modules/products`
  - job: `modules/products/infrastructure/jobs/stock-refresh.job.ts`
  - endpoint/admin: `POST /v1/admin/omie/products/stock/refresh` (camada de rotas do módulo products)

### Pedidos (stage 20) — sync

- Legado:
  - core/regras: `legacy/core/SyncOmieStage20OrdersService.ts`
  - job: `legacy/jobs/omieOrdersStage20.job.ts`
  - endpoints: `legacy/routes/omie.ts`
- Atual:
  - módulo: `src/modules/omie-orders`
  - job: `modules/omie-orders/infrastructure/jobs/omie-orders-stage20.job.ts`
  - lock: `modules/omie-orders/infrastructure/db/sync-lock.repo.prisma.ts` (erro `SYNC_IN_PROGRESS`)

### Setores / Planos / Product-Sector

- Legado:
  - rotas: `legacy/routes/sectors.ts`, `legacy/routes/plans.ts`, `legacy/routes/product-sector.ts`
  - services/repos: `legacy/services/*` e `legacy/repositories/*`
- Atual:
  - módulos: `src/modules/sectors`, `src/modules/plans`, `src/modules/product-sector`

Observação importante:

- nem todo módulo precisa de job; porém, se no legado havia rotina “ativa” alimentando tabela e no atual a tabela está congelada, há sinal de reimplementação faltante (job ou endpoint admin manual).

---

## Diferenças que explicam “dados congelados”

### 1) Jobs no legado eram mais “diretos”

- um job chamava um serviço e isso atualizava tabelas imediatamente
- se o job rodava, havia escrita

### 2) No atual, jobs dependem de flags/env e de wiring por módulo

Se o módulo está registrado, mas:

- o job não é iniciado no bootstrap (ou flag está desligada)
- o endpoint admin existe, mas ninguém dispara
- a escrita não foi reimplementada no use case/repo

…então as leituras continuam “ok”, mas os dados congelam.

### 3) Módulos “derivados” podem não ter job por design

Exemplos típicos de derivação:

- views/agregações/enriquecimentos que dependem de tabelas “base” estarem atualizadas

Se as tabelas base congelam, o derivado também congela mesmo que “leia certo”.

---

## Como usar este comparativo no dia a dia

### Quando investigar no legado

Investigar no legado quando você precisar de:

- regra de seleção (filtros) e paginação já testados em produção
- shape de payload que precisa ser idêntico
- detalhes de lock/backoff e critérios de “skip”

### Onde implementar no atual

Implementar no atual sempre em:

- `src/modules/<dominio>/application/use-cases/*` (orquestração)
- `src/modules/<dominio>/infrastructure/db/*` (persistência)
- `src/modules/<dominio>/infrastructure/jobs/*` (cron)
- `src/modules/<dominio>/presentation/http/*` (endpoint admin/manual)

### O que evitar

- reativar `src/legacy` como caminho principal de execução
- duplicar lógica de escrita em rotas (handler) no atual
- acoplar sync pesado a endpoints públicos

