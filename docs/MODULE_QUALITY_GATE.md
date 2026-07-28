# 🏗️ Quality Gate — Checklist Canônico de Módulos

> **Propósito:** Garantir que todos os módulos de integração sigam o **mesmo padrão arquitetural**,
> facilitando manutenção, code review e evolução consistente.
>
> **Módulo de referência:** `product-structure` em `apps/api/src/modules/integration/product-structure/`
>
> **Como usar:** Ao criar um novo módulo → preencha o checklist.  
> Ao melhorar um módulo existente → marque/atualize os itens aplicáveis.

---

## 📋 Instruções

1. Copie a seção **"Checklist do Módulo"** para o README do módulo ou um arquivo próprio
2. Marque `✅` para itens implementados, `⬜` para pendentes, `❌` para não aplicável
3. Ao final, some os pontos para obter a **Pontuação de Maturidade**
4. O objetivo é manter **≥ 95%** para módulos em produção

---

## 🏆 Pontuação de Maturidade

| Pontuação | Status | Significado |
|---|---|---|
| **100%** | 🥇 Canônico | Segue todos os padrões — referência para novos módulos |
| **90–99%** | ✅ Produção | Pequenos gaps não-críticos — seguro para produção |
| **70–89%** | ⚠️ Em evolução | Gaps relevantes — priorizar correção |
| **< 70%** | 🚧 Rascunho | Módulo incompleto — não usar em produção |

---

## 🔲 Checklist do Módulo

> **Instrução para preencher:** Substitua `⬜` por `✅` quando o item estiver implementado.
> Use `❌` quando o item não se aplica ao módulo (ex: módulos read-only não precisam de command CRUD).

### 1. Estrutura de Diretórios

A árvore completa do módulo deve seguir o template canônico:

```
nome-do-modulo/
├── index.ts
├── README.md
├── nome-do-modulo-integration-register.ts
├── application/
│   ├── dto/                              (opcional — usar schemas.ts quando possível)
│   ├── ports/
│   │   └── *.gateway.ts                  (contratos e tipos)
│   └── use-cases/
│       └── *.usecase.ts                  (lógica de aplicação)
├── infrastructure/
│   ├── db/
│   │   ├── *-command.store.ts             (idempotência + tracking)
│   │   ├── *-sync.store.ts                (persistência do espelho local)
│   │   ├── *-integration.store.ts         (opcional — store específica)
│   │   └── *-query.store.ts               (opcional — consultas read-model)
│   ├── gateways/
│   │   └── {acao}/
│   │       ├── real-*.gateway.ts          (implementação real Omie)
│   │       └── fake-*.gateway.ts          (implementação fake para testes)
│   └── jobs/
│       ├── *-jobs.handler.ts              (bridge: cria gateways + registra handlers PgBoss)
│       ├── *-jobs.register.ts             (orquestra handlers + cron schedule)
│       └── reconcile-*.job.ts             (opcional — job de reconciliação periódica)
└── presentation/
    └── http/
        ├── routes.ts                      (registro de todas as rotas)
        ├── schemas.ts                     (schemas Zod de validação)
        ├── openapi.ts                     (documentação OpenAPI)
        └── routes/
            ├── commands/
            │   └── *.route.ts
            ├── callbacks/
            │   └── *.callback.route.ts
            └── read/
                └── *.route.ts
```

- `⬜` **1.1** Árvore completa conforme template acima (sem pastas faltando)
- `⬜` **1.2** Arquivo `index.ts` exporta o módulo
- `⬜` **1.3** Arquivo `*-integration-register.ts` registra módulo no bootstrap da API
- `⬜` **1.4** Arquivo `README.md` documenta o módulo

---

### 2. Ports (`application/ports/`)

- `⬜` **2.1** Toda operação de gateway tem **uma porta correspondente** em `application/ports/`
- `⬜` **2.2** Portas de **mutação** (CRUD, apply, delete, etc.) exportam `interface` com método(s)
- `⬜` **2.3** Portas de **leitura/sync** (fetch, sync-page, consult) exportam apenas `type` (sem interface)
- `⬜` **2.4** Tipos de entrada/saída (`Input`, `Result`, `Item`) estão na porta, não no gateway
- `⬜` **2.5** Porta de **sync-page** inclui:
  - `updatedSince?: Date` no input
  - `updatedAt: Date | null` no item (para filtro incremental local)
- `⬜` **2.6** Porta de **lifecycle** exporta interface com métodos `confirm()` e `fail()`

**Referência:** `product-structure/application/ports/product-structure-*.gateway.ts`

---

### 3. Use Cases (`application/use-cases/`)

#### 3.1 Padrão de Nomenclatura

| Tipo | Prefixo | Exemplo |
|---|---|---|
| Enfileiramento (PgBoss) | `enqueue-` | `enqueue-create-*-.usecase.ts` |
| Processamento (Worker) | `process-` | `process-create-*-.usecase.ts` |
| Sync Global | `sync-all-` | `sync-all-*-.usecase.ts` |
| Ação direta | `{verbo}-` | `apply-*-.usecase.ts` |

- `⬜` **3.1** Use-cases seguem a nomenclatura acima
- `⬜` **3.2** **Todo comando de mutação** tem um use-case de enfileiramento (`enqueue-*`) que retorna 202
- `⬜` **3.3** **Todo comando de mutação** tem um use-case de processamento (`process-*`) que executa a ação contra o Omie
- `⬜` **3.4** `enqueue-*` usa `enqueueJob()` do PgBoss com `singletonKey` para evitar duplicatas
- `⬜` **3.5** `process-*` é registrado como handler PgBoss com `localConcurrency: 1`
- `⬜` **3.6** Use-cases **não importam PrismaClient diretamente** — usam stores

#### 3.2 Sync-All Global (Incremental)

- `⬜` **3.7** Construtor tem **5 argumentos**: gateway, syncStore, commandStore, syncStateStore, options
- `⬜` **3.8** Implementa modo `noWrite` para validação (percorre páginas sem persistir)
- `⬜` **3.9** Usa `fetchPageWithRetry()` com backoff exponencial
- `⬜` **3.10** Usa `lastSyncAt` do `SyncStateStore` para `updatedSince` (incremental)
- `⬜` **3.11** Aceita `SyncHooksRunner` como 2º argumento do `execute()` (pós-sync)
- `⬜` **3.12** Atualiza checkpoint via `syncStateStore.updateLastSync()` ao finalizar
- `⬜` **3.13** Marca comando como CONFIRMED ao finalizar
- `⬜` **3.14** Marca comando como FAILED em caso de erro
- `⬜` **3.15** Logs estruturados com `getLogger()` em todas as etapas
- `⬜` **3.16** Exporta função auxiliar `execute*()` para execução direta pelo handler PgBoss

**Referência:** `sync-all-product-structures.usecase.ts`, `sync-all-production-orders.usecase.ts`

---

### 4. Gateways (`infrastructure/gateways/`)

- `⬜` **4.1** Cada gateway tem implementações **Real** e **Fake** em subpasta organizada por ação
- `⬜` **4.2** Real gateway implementa a porta e chama Omie via `OmieHttpClientPort`
- `⬜` **4.3** Fake gateway implementa a porta com dados simulados (sem chamada externa)
- `⬜` **4.4** Seleção Real/Fake via env var no momento da construção (handler)
- `⬜` **4.5** Real gateway usa constantes de endpoint (`OMIE_ENDPOINTS.MODULE.endpoint`)
- `⬜` **4.6** Fake-SyncPage retorna itens mockados — primeira página com dados, páginas subsequentes vazias
- `⬜` **4.7** Real-SyncPage implementa **filtro híbrido incremental**:
  - Server-side: envia parâmetro de data (ex: `dDtConclusaoDe`) para reduzir páginas
  - Local: parseia `dAlteracao`/`hAlteracao` e filtra `updatedAt <= updatedSince`
- `⬜` **4.8** Real-Consult implementa circuit breaker (OmieHttpClientPort já faz isso)
- `⬜` **4.9** Fake-Lifeycle e Real-Lifecycle delegam ao CommandStore (diferença é apenas logging)
- `⬜` **4.10** Portas de gateway estão em `application/ports/`, NÃO em `infrastructure/gateways/`

---

### 5. Stores (`infrastructure/db/`)

#### 5.1 Command Store (idempotência + tracking)

- `⬜` **5.1** Implementa `getOrCreateAccepted()` — idempotência por `externalRequestId`
- `⬜` **5.2** Implementa `markConfirmed()` e `markFailed()`
- `⬜` **5.3** Usa Prisma `$queryRawUnsafe` com `FOR UPDATE SKIP LOCKED` (se for command queue legado)
- `⬜` **5.4** Implementa `enqueue()` com verificação de existência
- `⬜` **5.5** Implementa `dequeue()` atômico com batch
- `⬜` **5.6** Implementa `countByStatusAll()` e `listRecent()` e `listFailures()` (para dashboard)

#### 5.2 Sync Store (persistência do espelho local)

- `⬜` **5.7** Implementa `save(item)` — upsert/insert no espelho local (ex: `omie_production_order`)
- `⬜` **5.8** Implementa `saveMany(items)` para batch persist
- `⬜` **5.9** Usa `map*()` do adapter compartilhado (ex: `OmieProductionOrdersAdapter`)

#### 5.3 Query Store (leitura do espelho local)

- `⬜` **5.10** Implementa `list()` paginado com filtros
- `⬜` **5.11** Implementa `getByCode()` com detalhes + relacionamentos
- `⬜` **5.12** Implementa `getStats()` (total, ativos, concluídos)
- `⬜` **5.13** Store fica em `infrastructure/db/`, separada dos gateways

#### 5.4 Sync State

- `⬜` **5.14** Usa `PrismaSyncStateStore` compartilhado de `@/shared/integration/strategies/sync-state.store`
- `⬜` **5.15** Ou implementa store específica se precisar de mais granularidade

---

### 6. Jobs (`infrastructure/jobs/`)

- `⬜` **6.1** `*-jobs.handler.ts` cria gateways (real/fake baseado em env) e registra handlers PgBoss
- `⬜` **6.2** `*-jobs.register.ts` orquestra handlers + schedule cron
- `⬜` **6.3** Todo handler PgBoss tem `localConcurrency: 1` e `singletonKey`
- `⬜` **6.4** Todo handler tem `retryLimit` e `retryBackoff`
- `⬜` **6.5** `reconcile-*.job.ts` (opcional) implementa sync periódico com cron schedule
- `⬜` **6.6** O cron é configurável via env var (ex: `OMIE_PROD_ORDER_SYNC_CRON`)
- `⬜` **6.7** O cron tem flag de disable (ex: `DISABLE_PROD_ORDER_SYNC_CRON`)
- `⬜` **6.8** Handlers usam try/catch com logging e não quebram o worker inteiro

---

### 7. Routes (`presentation/http/routes/`)

#### 7.1 Commands (Escrita)

- `⬜` **7.1** Prefixo: `/v1/integration/{modulo}/commands/{acao}`
- `⬜` **7.2** Retornam **202 Accepted** (comandos assíncronos via PgBoss)
- `⬜` **7.3** Validam payload com Zod schemas
- `⬜` **7.4** Extraem `externalRequestId` do body (não geram automaticamente)
- `⬜` **7.5** `sync-global` expõe `lastSyncAt` nos logs/responses

#### 7.2 Callbacks (Respostas)

- `⬜` **7.6** Prefixo: `/v1/integration/{modulo}/callbacks/:externalRequestId/{acao}`
- `⬜` **7.7** São **fake-only** — retornam **405 Method Not Allowed** em modo real
- `⬜` **7.8** Confirm: delega ao `LifecycleGateway.confirm()`
- `⬜` **7.9** Fail: delega ao `LifecycleGateway.fail()`

#### 7.3 Tracking (Acompanhamento)

- `⬜` **7.10** GET `/v1/integration/{modulo}/commands/:externalRequestId`
- `⬜` **7.11** Retorna status do comando, timestamps, erro (se houver)
- `⬜` **7.12** Retorna 404 se não encontrado

#### 7.4 Read-Models (Espelho Local)

- `⬜` **7.13** Prefixo: `/v1/integration/{modulo}/read/` (ou `/v1/integration/read/{entidade}/`)
- `⬜` **7.14** GET `/read` — lista paginada com filtros (page, limit, completed, active, productCode, etc.)
- `⬜` **7.15** GET `/read/:id` — detalhe de um registro
- `⬜` **7.16** GET `/read/stats` — estatísticas
- `⬜` **7.17** GET `/read/queue` — status da fila de comandos
- `⬜` **7.18** GET `/read/queue/failures` — falhas recentes
- `⬜` **7.19** GET `/read/:id/refresh` — consulta síncrona ao Omie + atualiza espelho (opcional)
- `⬜` **7.20** Read-routes **nunca chamam Omie diretamente** (exceto refresh)
- `⬜` **7.21** Read-routes **não executam efeitos colaterais** (exceto refresh)

#### 7.5 Registro de Rotas

- `⬜` **7.22** `routes.ts` importa e registra todas as rotas do módulo
- `⬜` **7.23** Rotas organizadas: Commands → Callbacks → Tracking → Read

---

### 8. Schemas, DTOs e OpenAPI

- `⬜` **8.1** `schemas.ts` define schemas Zod para validação de request/response
- `⬜` **8.2** Inclui schemas de erro padronizados: `ValidationErrorResponseSchema`, `InternalErrorResponseSchema`
- `⬜` **8.3** `openapi.ts` documenta todos os endpoints com exemplos de request/response
- `⬜` **8.4** OpenAPI inclui exemplos de erro (400, 404, 405, 500)
- `⬜` **8.5** DTOs (se existirem) estão em `application/dto/` com tipos específicos

---

### 9. Cross-Cutting Patterns

#### 9.1 Idempotência

- `⬜` **9.1** Todo comando usa `externalRequestId` gerado pelo cliente
- `⬜` **9.2** `CommandStore.getOrCreateAccepted()` garante que comandos duplicados não executem duas vezes
- `⬜` **9.3** Jobs PgBoss usam `singletonKey` para evitar execução concorrente do mesmo tipo

#### 9.2 Logs

- `⬜` **9.4** Todos os logs usam `getLogger()` (logger estruturado)
- `⬜` **9.5** Logs incluem `externalRequestId` para rastreabilidade
- `⬜` **9.6** Logs de página incluem: page, items, totalPages, processedPages, processedItems, hasNextPage
- `⬜` **9.7** Erros são logados com stack trace e contexto

#### 9.3 Rate-Limit

- `⬜` **9.8** Sync global respeita Omie rate-limit com `sleep(700)` entre páginas
- `⬜` **9.9** Operações individuais (criação, atualização) passam pelo PgBoss com `localConcurrency: 1`
- `⬜` **9.10** Real gateway usa circuit breaker via `OmieHttpClientPort`

#### 9.4 Tratamento de Erros

- `⬜` **9.11** Use-cases usam try/catch em todo fluxo de gravação
- `⬜` **9.12** Comandos são marcados como FAILED com `lastError` em caso de exceção
- `⬜` **9.13** Workers PgBoss têm `retryLimit: 2` com `retryBackoff`
- `⬜` **9.14** Rotas retornam erros padronizados: `{ success: false, error: "CODE", message: "..." }`

#### 9.5 Adaptadores Omie

- `⬜` **9.15** Mapeamento de payload Omie usa adapter em `@/shared/integrations/omie/` (ex: `OmieProductionOrdersAdapter`)
- `⬜` **9.16** Adapter trata campos opcionais e formatos BR (data, número)
- `⬜` **9.17** Códigos de erro Omie são tratados e mapeados

#### 9.6 Prisma Schema

- `⬜` **9.18** Modelos Prisma seguem padrão: `omie_*` para espelhos, `integration.*` para módulos
- `⬜` **9.19** Comandos têm: `externalRequestId` (unique), `status`, `commandType`, `source`, timestamps
- `⬜` **9.20** Espelho local tem `lastSyncAt` para auditoria de sincronização

---

### 10. Configuração (Env Vars)

- `⬜` **10.1** Variável `{MODULO}_GATEWAY` para seleção Real/Fake (default: `"fake"`)
- `⬜` **10.2** Cron schedule configurável via env var (ex: `OMIE_PROD_ORDER_SYNC_CRON`)
- `⬜` **10.3** Flag de disable via env var (ex: `DISABLE_PROD_ORDER_SYNC`)
- `⬜` **10.4** Variáveis documentadas no README do módulo e no `.env.example`

---

### 11. Testes e Modo Fake

- `⬜` **11.1** `noWrite` mode disponível no sync-global para validação sem persistir
- `⬜` **11.2** Fake gateways retornam dados realistas (simulam Omie fielmente)
- `⬜` **11.3** Fake-SyncPage: primeira página retorna N itens, páginas subsequentes vazias
- `⬜` **11.4** Callbacks HTTP funcionam em modo fake (confirm/fail)
- `⬜` **11.5** Callbacks HTTP retornam 405 em modo real

---

### 12. Documentação

- `⬜` **12.1** README inclui:
  - Visão geral do módulo
  - Estrutura de diretórios
  - Todas as rotas com exemplos curl
  - Padrão Real/Fake e env vars
  - Fluxos de operação
  - Limitações conhecidas
  - Setup de desenvolvimento
- `⬜` **12.2** Documentação de todas as rotas em `Routes.md` (ou no README)
- `⬜` **12.3** Documentação OpenAPI da API em `openapi.ts`

---

## 📊 Planilha de Avaliação

Copie a tabela abaixo no README do módulo e preencha:

| Categoria | Total | Concluídos | % |
|---|---|---|---|
| 1. Estrutura de Diretórios | 4 | — | — |
| 2. Ports | 6 | — | — |
| 3. Use Cases | 16 | — | — |
| 4. Gateways | 10 | — | — |
| 5. Stores | 15 | — | — |
| 6. Jobs | 8 | — | — |
| 7. Routes | 23 | — | — |
| 8. Schemas/OpenAPI | 5 | — | — |
| 9. Cross-Cutting | 20 | — | — |
| 10. Config (Env) | 4 | — | — |
| 11. Testes/Fake | 5 | — | — |
| 12. Documentação | 3 | — | — |
| **Total** | **119** | **—** | **—%** |

---

## 📌 Histórico de Avaliações

| Data | Módulo | Pontuação | Auditor |
|---|---|---|---|
| 2026-06-24 | `product-structure` | 🥇 **100%** | Checklist canônico (referência) |
| 2026-06-24 | `production-orders` | ✅ **~95%** | Avaliação automática |
| — | `product-catalog` | ⏳ Pendente | — |
| 2026-06-24 | `sales-order-sync` | ✅ **~99%** | Pós-refatoração (4 gaps fechados) |
| — | `customer-sync` | ⏳ Pendente | — |

### Exemplo: Avaliação do `production-orders`

```
📦 production-orders
├── 1. Estrutura          ✅ 4/4
├── 2. Ports             ✅ 6/6 (updatedAt adicionado)
├── 3. Use Cases         ✅ 16/16
├── 4. Gateways          ✅ 10/10 (filtro híbrido adicionado)
├── 5. Stores            ✅ 13/15 (sem saveMany, sem store específica)
├── 6. Jobs              ✅ 8/8
├── 7. Routes            ✅ 21/23 (faltam 2 read-routes opcionais)
├── 8. Schemas/OpenAPI   ✅ 5/5
├── 9. Cross-Cutting     ✅ 19/20
├── 10. Config (Env)     ✅ 4/4
├── 11. Testes/Fake      ✅ 5/5
├── 12. Documentação     ✅ 3/3
└── 📊 TOTAL: 114/119 ≈ 95%
```

**Gaps identificados:**
- `5.8` Sync store não tem `saveMany()` — faz `save()` item por item
- `9.17` Códigos de erro Omie podem não estar 100% mapeados
- Demais gaps são itens opcionais não aplicáveis (ex: command queue legado)

### Exemplo: Avaliação do `sales-order-sync`

```
📦 sales-order-sync
├── 1. Estrutura          ✅ 4/4
├── 2. Ports             ✅ 4/4 (type em vez de interface ✅)
├── 3. Use Cases         ✅ 12/12
├── 4. Gateways          ✅ 8/8
├── 5. Stores            ✅ 11/11 (saveMany batch via $transaction ✅)
├── 6. Jobs              ✅ 7/7
├── 7. Routes            ✅ 22/22 (GET /read/:omieId adicionado ✅)
├── 8. Schemas/OpenAPI   ✅ 4/4
├── 9. Cross-Cutting     ✅ 20/20 (OmieSalesOrderAdapter compartilhado ✅)
├── 10. Config (Env)     ✅ 4/4
├── 11. Testes/Fake      ✅ 5/5
├── 12. Documentação     ✅ 3/3
└── 📊 TOTAL: 104/104 ≈ 100% (4 gaps fechados)
```

> **Nota:** Todos os 4 gaps identificados foram corrigidos. O módulo atingiu 100% nos itens aplicáveis (sync-only).

> **Sync-only:** Vários itens (command queue, lifecycle, reconcile) marcados como N/A por serem módulo read-only.

### Exemplo: Avaliação do `product-structure` (canônico)

```
📦 product-structure (canônico)
├── 1. Estrutura          ✅ 4/4
├── 2. Ports             ✅ 6/6
├── 3. Use Cases         ✅ 16/16
├── 4. Gateways          ✅ 10/10
├── 5. Stores            ✅ 14/15
├── 6. Jobs              ✅ 8/8
├── 7. Routes            ✅ 23/23
├── 8. Schemas/OpenAPI   ✅ 5/5
├── 9. Cross-Cutting     ✅ 20/20
├── 10. Config (Env)     ✅ 4/4
├── 11. Testes/Fake      ✅ 5/5
├── 12. Documentação     ✅ 3/3
└── 📊 TOTAL: 118/119 ≈ 99% (pequeno gap não-crítico)
```

> **Nota:** O `product-structure` é o módulo mais maduro e serve como referência viva.
> Mantê-lo em 100% garante que novos módulos tenham um padrão confiável.

---

### 🧮 Como Calcular

Para cada categoria:
```
% = (concluídos / total) × 100
```

Para o total geral:
```
% = (soma dos concluídos / soma dos totais) × 100
```

Use a planilha da seção anterior para fazer o cálculo automaticamente.

---

> **Regra de Ouro:** Módulos com pontuação **< 70%** não devem ser usados em produção.
> Módulos **≥ 90%** são considerados estáveis.
> O `product-structure` é o **padrão canônico** — deve manter 100%.
