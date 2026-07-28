# 📐 Template: Sync-Only Module

> **Propósito:** Template canônico para módulos de integração **somente leitura** (sync de dados do Omie → espelho local).
>
> **Módulo de referência:** `customer-sync` (o mais completo e alinhado com `PROJECT_MANUAL.md`)

---

## 🧩 Visão Geral

Um módulo **Sync-Only** **lê dados do Omie e persiste localmente**, mas **nunca escreve de volta no Omie**. Ele expõe:

- **Comandos POST** → disparam sync de 1 item ou sync global (paginado/incremental)
- **Read-models GET** → consultam o espelho local (nunca chamam Omie)
- **Rotas de monitoramento** → status, histórico, falhas, último sync

### Quando usar este template

- Sincronização de dados mestres: clientes, produtos, tabelas de referência
- Sincronização de movimentos: pedidos, notas fiscais (apenas leitura)
- Qualquer entidade cuja **fonte de verdade é o Omie** e não precisa de escrita bidirecional

---

## 📁 Estrutura de Diretórios

```
{NOME_MODULO}/
├── README.md
├── index.ts
├── {NOME_MODULO}-integration-register.ts
├── application/
│   ├── dto/
│   │   ├── sync-{entidade}.dto.ts
│   │   ├── sync-all-{entidades}.dto.ts
│   │   ├── get-{entidade}-read-model.dto.ts
│   │   └── get-{entidade}-stats.dto.ts
│   ├── mappers/
│   │   └── map-omie-{entidade}-to-summary.ts
│   ├── ports/
│   │   ├── {entidade}-fetch.gateway.ts
│   │   └── {entidade}-fetch-page.gateway.ts
│   ├── use-cases/
│   │   ├── sync-{entidade}.usecase.ts
│   │   ├── sync-all-{entidades}.usecase.ts
│   │   ├── get-{entidade}-read-model.usecase.ts
│   │   ├── get-{entidade}-summary.usecase.ts
│   │   └── get-{entidade}-stats.usecase.ts
│   └── utils/
│       └── query.utils.ts
├── infrastructure/
│   ├── db/
│   │   ├── index.ts
│   │   ├── omie-{entidade}.store.ts
│   │   ├── {entidade}-command.store.ts
│   │   ├── fake-omie-{entidade}.store.ts
│   │   ├── fake-{entidade}-command.store.ts
│   │   └── fake-stores.singletons.ts
│   ├── gateways/
│   │   ├── {entidade}-fetch/
│   │   │   ├── real-{entidade}-fetch.gateway.ts
│   │   │   └── fake-{entidade}-fetch.gateway.ts
│   │   └── {entidade}-fetch-page/
│   │       ├── real-{entidade}-fetch-page.gateway.ts
│   │       └── fake-{entidade}-fetch-page.gateway.ts
│   └── jobs/
│       └── {entidade}-jobs.register.ts
└── presentation/
    └── http/
        ├── index.ts
        ├── routes.ts
        └── routes/
            ├── Routes.md
            ├── commands/
            │   ├── sync-{entidade}.route.ts
            │   └── sync-all-{entidades}.route.ts
            └── read/
                ├── get-{entidade}-read-model.route.ts
                ├── get-{entidade}-stats.route.ts
                ├── get-{entidade}-summary.route.ts
                ├── get-{entidade}-last-sync.route.ts
                ├── get-{entidade}-sync-history.route.ts
                ├── get-{entidade}-sync-failures.route.ts
                └── get-{entidade}-sync-status.route.ts
```

---

## 📦 Register Pattern

O register deve seguir o padrão `create{NomeModulo}Integration()` — uma **fábrica** que retorna `{ name, register }`.

### `{NOME_MODULO}-integration-register.ts`

```typescript
import type { FastifyInstance } from "fastify";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { {entidade}IntegrationRoutes } from "./presentation/http/routes";
import { register{NomeEntidade}Jobs } from "./infrastructure/jobs/{entidade}-jobs.register";

export function create{NomeModulo}Integration() {
    return {
        name: "{NOME_MODULO}-integration",
        register: (app: FastifyInstance) => {
            app.register({entidade}IntegrationRoutes);

            const omieClient = (app as any).omieClient as OmieHttpClientPort;
            if (omieClient) {
                register{NomeEntidade}Jobs(omieClient);
            }
        },
    };
}
```

### `index.ts`

```typescript
export { create{NomeModulo}Integration } from "./{NOME_MODULO}-integration-register";
```

> **Regra:** O `index.ts` **apenas re-exporta** a função de registro. Nunca coloque lógica aqui.

---

## 🔌 Ports/Gateways

Um módulo Sync-Only tem **exatamente 2 portas de gateway**:

1. **`{entidade}-fetch.gateway.ts`** — Busca 1 entidade por código
2. **`{entidade}-fetch-page.gateway.ts`** — Busca página de entidades

### `application/ports/{entidade}-fetch.gateway.ts`

```typescript
export type External{Entidade} = {
    {chave}: string;
    // ... campos mapeados do Omie
    rawPayload: any;
};

export interface {Entidade}FetchGateway {
    fetchBy{Chave}({chave}: string): Promise<External{Entidade} | null>;
}
```

### `application/ports/{entidade}-fetch-page.gateway.ts`

```typescript
import type { External{Entidade} } from "./{entidade}-fetch.gateway";

export type {Entidade}FetchPageInput = {
    page: number;
    pageSize: number;
    updatedSince?: Date;
};

export type {Entidade}FetchPageResult = {
    items: External{Entidade}[];
    totalPages: number;
    currentPage: number;
    totalRecords: number;
    hasNext: boolean;
};

export interface {Entidade}FetchPageGateway {
    fetchPage(input: {Entidade}FetchPageInput): Promise<{Entidade}FetchPageResult>;
}
```

---

## 🎯 Use-Cases

### Sync Individual (`sync-{entidade}.usecase.ts`)

```typescript
// Contratos usando Pick<> das stores reais
export type IntegrationStoreContract = Pick<Omie{Entidade}Store, "upsertFromExternal">;
export type CommandStoreContract = Pick<
    {Entidade}CommandStore,
    "getOrCreateAccepted" | "markConfirmed" | "markFailed"
>;

export type Sync{Entidade}Command = {
    externalRequestId: string;
    {chave}: string;
    source?: "API2" | "JOB" | "ADMIN";
};

export class Sync{Entidade}UseCase {
    constructor(
        private readonly fetchGateway: {Entidade}FetchGateway,
        private readonly integrationStore: IntegrationStoreContract,
        private readonly commandStore: CommandStoreContract,
        private readonly options: { noWrite?: boolean } = {}
    ) {}

    async execute(command: Sync{Entidade}Command) {
        if (this.options.noWrite) {
            await this.fetchGateway.fetchBy{Chave}(command.{chave});
            return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId };
        }

        const { record, created } = await this.commandStore.getOrCreateAccepted({
            externalRequestId: command.externalRequestId,
            {chave}: command.{chave},
            commandType: "SYNC",
            source: command.source ?? "API2",
        });

        if (!created) {
            return { status: record.status, externalRequestId: command.externalRequestId };
        }

        try {
            const external = await this.fetchGateway.fetchBy{Chave}(command.{chave});
            if (!external) throw new Error(`Não encontrado no Omie: ${command.{chave}}`);
            await this.integrationStore.upsertFromExternal(/* mapeamento */);
            await this.commandStore.markConfirmed(command.externalRequestId);
            return { status: "ACCEPTED", externalRequestId: command.externalRequestId };
        } catch (error) {
            await this.commandStore.markFailed(command.externalRequestId, error);
            throw error;
        }
    }
}
```

### Sync Global (`sync-all-{entidades}.usecase.ts`)

```typescript
export class SyncAll{Entidades}UseCase {
    constructor(
        private readonly fetchPageGateway: {Entidade}FetchPageGateway,
        private readonly integrationStore: IntegrationStoreContract,
        private readonly commandStore: CommandStoreContract,
        private readonly stateStore: SyncStateStoreContract,
        private readonly options: { noWrite?: boolean } = {}
    ) {}

    async execute(command: SyncAll{Entidades}Command) {
        // 1. Idempotência via commandStore.getOrCreateAccepted
        // 2. Paginação incremental via stateStore.getState() (updatedSince)
        // 3. fetchPageWithRetry + sleep(700) entre páginas
        // 4. upsertFromExternal para cada item
        // 5. stateStore.updateLastSync() + commandStore.markConfirmed()
    }
}
```

---

## 🗄️ Stores

### Integration Store (`infrastructure/db/omie-{entidade}.store.ts`)

Store real que persiste no banco via Prisma. Métodos principais:

```typescript
export class Omie{Entidade}Store {
    async list(params: ListParams): Promise<{ summary?: ...; data?: ...; meta?: ... }>
    async findBy{Chave}({chave}: string, options?: { includeRaw?: boolean }): Promise<Record | null>
    async upsertFromExternal(input: UpsertInput): Promise<Record>
    async getStats(): Promise<{ total: number; active: number; inactive: number; ... }>
}
```

### Command Store (`infrastructure/db/{entidade}-command.store.ts`)

Store de tracking de comandos (idempotência):

```typescript
export class {Entidade}CommandStore {
    async findByExternalRequestId(externalRequestId: string): Promise<Record | null>
    async getOrCreateAccepted(input: CreateAcceptedCommandInput): Promise<{ record; created: boolean }>
    async markConfirmed(externalRequestId: string): Promise<void>
    async markFailed(externalRequestId: string, error: unknown): Promise<void>
    async listRecent(limit = 20): Promise<Record[]>
    async listFailures(limit = 20): Promise<Record[]>
}
```

### Fake Stores (`infrastructure/db/fake-*.store.ts`)

- **`FakeOmie{Entidade}Store`** → implementação in-memory (`Map`) com dados mockados pré-populados
- **`Fake{Entidade}CommandStore`** → implementação in-memory (`Map`) do command store
- **`fake-stores.singletons.ts`** → exporta instâncias singleton compartilhadas entre rotas

```typescript
export const fakeOmie{Entidade}Store = new FakeOmie{Entidade}Store();
export const fake{Entidade}CommandStore = new Fake{Entidade}CommandStore();
```

---

## 🧪 Gateways Concretos

### Real Gateway (`infrastructure/gateways/{entidade}-fetch/real-{entidade}-fetch.gateway.ts`)

```typescript
export class Real{Entidade}FetchGateway implements {Entidade}FetchGateway {
    constructor(private readonly omieClient: OmieHttpClientPort) {}

    async fetchBy{Chave}({chave}: string): Promise<External{Entidade} | null> {
        const response = await this.omieClient.post<any>("{omie_endpoint}", {
            call: "{omie_call}",
            param: [{ {omie_param}: Number({chave}) }],
        });
        if (!response) return null;
        // Mapeamento defensivo dos campos do Omie
        return { ... };
    }
}
```

### Fake Gateway (`infrastructure/gateways/{entidade}-fetch/fake-{entidade}-fetch.gateway.ts`)

```typescript
export class Fake{Entidade}FetchGateway implements {Entidade}FetchGateway {
    async fetchBy{Chave}({chave}: string): Promise<External{Entidade} | null> {
        return {
            {chave},
            // dados fixos simulados
            rawPayload: { fake: true, {chave}, reason: "Fake gateway ativo" },
        };
    }
}
```

---

## ⏰ Jobs

### `infrastructure/jobs/{entidade}-jobs.register.ts`

```typescript
import cron from "node-cron";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { SyncAll{Entidades}UseCase } from "../application/use-cases/sync-all-{entidades}.usecase";
import { Omie{Entidade}Store } from "../db/omie-{entidade}.store";
import { {Entidade}CommandStore } from "../db/{entidade}-command.store";
import { Fake{Entidade}FetchPageGateway } from "../gateways/{entidade}-fetch-page/fake-{entidade}-fetch-page.gateway";
import { Real{Entidade}FetchPageGateway } from "../gateways/{entidade}-fetch-page/real-{entidade}-fetch-page.gateway";

function buildJobExternalRequestId() {
    return `{entidade}-sync-job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function register{NomeEntidade}Jobs(omieClient: OmieHttpClientPort) {
    const logger = getLogger("{entidade}:cron");

    if (!env.ENABLE_OMIE_{NOME_ENTIDADE_UCASE}_SYNC_JOB) {
        logger.info("{NomeEntidade} sync job is disabled");
        return;
    }

    const schedule = env.OMIE_{NOME_ENTIDADE_UCASE}_SYNC_CRON ?? "0 */12 * * *";

    cron.schedule(schedule, async () => {
        const runLogger = getLogger("{entidade}:cron:run");
        try {
            const useFake = env.{NOME_MODULO_UCASE}_GATEWAY === "fake";
            const fetchPageGateway = useFake
                ? new Fake{Entidade}FetchPageGateway()
                : new Real{Entidade}FetchPageGateway(omieClient);

            const useCase = new SyncAll{Entidades}UseCase(
                fetchPageGateway,
                new Omie{Entidade}Store(),
                new {Entidade}CommandStore(),
                new PrismaSyncStateStore(prisma.{entidade}SyncState, "global"),
                { noWrite: useFake },
            );

            await useCase.execute({
                externalRequestId: buildJobExternalRequestId(),
                pageSize: 100,
                maxPages: 1000,
                source: "JOB",
            });

            runLogger.info("Global {entidade}-sync completed");
        } catch (error) {
            runLogger.error("Global {entidade}-sync failed", error as any);
        }
    });
}
```

> **Regra:** Use `import { env } from "@/config"` — **nunca** `process.env` diretamente.

---

## 🌐 Env Vars

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{NOME_MODULO_UCASE}_GATEWAY` | Real/Fake | `fake` ou `real` |
| `ENABLE_OMIE_{NOME_ENTIDADE_UCASE}_SYNC_JOB` | Habilita job cron | `true` |
| `OMIE_{NOME_ENTIDADE_UCASE}_SYNC_CRON` | Cron schedule | `0 */12 * * *` |

**Convenção de nomenclatura:**
- Gateway: `{MODULO}_GATEWAY` (nome do módulo, não da entidade)
- Job enable: `ENABLE_OMIE_{ENTIDADE}_SYNC_JOB` (prefixo `ENABLE_OMIE_`)
- Job cron: `OMIE_{ENTIDADE}_SYNC_CRON` (prefixo `OMIE_`)

---

## 🛣️ Rotas

### Comandos (POST)

| Rota | Descrição | Body | Schema |
|------|-----------|------|--------|
| `POST /v1/integration/{NOME_MODULO}/:{chave}/sync` | Sync de 1 entidade | `{ externalRequestId }` | Sim |
| `POST /v1/integration/{NOME_MODULO}/sync-global` | Sync global (paginado) | `{ externalRequestId?, pageSize?, maxPages? }` | **Não** |

> A rota `sync-global` **não tem schema** para permitir chamadas sem `Content-Type` e sem body.
> O handler usa `(request.body ?? {})` para tratar body vazio.

### Read-Models (GET)

| Rota | Descrição | Query Params |
|------|-----------|-------------|
| `GET /v1/admin/read/{entidades}` | Lista paginada | `q`, `activeOnly`, `limit`, `offset`, `sort`, `order`, `since`, `fields`, `includeRaw` |
| `GET /v1/admin/read/{entidades}/:{chave}` | 1 entidade específica | `includeRaw` |
| `GET /v1/admin/read/{entidades}/stats` | Estatísticas | — |
| `GET /v1/{entidades}/summary` | Sumário (via API 2) | — |
| `GET /v1/integration/{NOME_MODULO}/sync-status/:externalRequestId` | Status de comando | — |
| `GET /v1/integration/{NOME_MODULO}/sync-history` | Histórico | `limit` |
| `GET /v1/integration/{NOME_MODULO}/sync-failures` | Falhas | `limit` |
| `GET /v1/integration/{NOME_MODULO}/last-sync` | Último sync global | — |

---

## 🎯 Padrões Obrigatórios

### 1. Gateway Selection em Rotas

Toda rota deve decidir `real` vs `fake` no momento da chamada:

```typescript
const useFake = env.{NOME_MODULO_UCASE}_GATEWAY === "fake";
const fetchGateway = useFake
    ? new Fake{Entidade}FetchGateway()
    : new Real{Entidade}FetchGateway(omieClient);
```

### 2. No-Write Mode no Fake

Todos os use-cases devem aceitar `options.noWrite` — quando `true`, o use-case **não persiste nada**, apenas lê do gateway.

### 3. Idempotência via CommandStore

Sempre usar `commandStore.getOrCreateAccepted()` antes de executar. Se o comando já existe (mesmo `externalRequestId`), retornar status sem reexecutar.

### 4. Resposta 202 Accepted

Comandos sempre retornam HTTP 202 com corpo `{ success: true, data: { status: "ACCEPTED", externalRequestId, ... } }`.

### 5. Response Envelope

```typescript
reply.code(202).send({
    success: true,
    data: { status: "ACCEPTED", externalRequestId, ... }
});
```

### 6. Read-models sem side effects

Read-models **nunca chamam Omie** e **nunca escrevem no banco**. Consultam apenas o espelho local.

### 7. Sync-global sem schema

```typescript
app.post("/v1/integration/{NOME_MODULO}/sync-global", async (request, reply) => {
    const body = (request.body as RequestDTO | undefined) ?? {};
    // ...
});
```

### 8. Fire-and-Forget no Sync Global (opcional)

Se o sync global for muito pesado, usar fire-and-forget:

```typescript
void useCase.execute({ ... }).catch((error) => {
    logger.error("sync-global failed", error);
});
```

### 9. Singleton Fake Stores

Fake stores devem ser singletons compartilhados entre todas as rotas:

```typescript
// fake-stores.singletons.ts
export const fakeOmie{Entidade}Store = new FakeOmie{Entidade}Store();
export const fake{Entidade}CommandStore = new Fake{Entidade}CommandStore();
```

### 10. Use Pick<> para contratos

Use-cases devem definir contratos via `Pick<>` das stores reais, não acoplando diretamente:

```typescript
export type IntegrationStoreContract = Pick<Omie{Entidade}Store, "upsertFromExternal">;
export type CommandStoreContract = Pick<{Entidade}CommandStore, "getOrCreateAccepted" | "markConfirmed" | "markFailed">;
```

---

## 📋 Checklist de Criação

- [ ] Estrutura de diretórios segue o template acima
- [ ] `index.ts` apenas re-exporta o register
- [ ] Register usa padrão `create{NomeModulo}Integration()` com `{ name, register }`
- [ ] Register chama `register{NomeEntidade}Jobs(omieClient)` se omieClient disponível
- [ ] 2 portas de gateway: fetch e fetch-page
- [ ] 2 gateways concretos (Real/Fake) para cada porta
- [ ] Integration store com upsert + list + findByCode + getStats
- [ ] Command store com getOrCreateAccepted + markConfirmed + markFailed
- [ ] Fake stores como singletons
- [ ] Use-cases aceitam `options.noWrite`
- [ ] Use-cases usam `Pick<>` para contratos
- [ ] Sync-global usa `(request.body ?? {})` sem schema
- [ ] Jobs usam `import { env }` não `process.env`
- [ ] Env vars seguem convenção `ENABLE_OMIE_*` e `OMIE_*_CRON`
- [ ] Rotas de monitoramento (status, history, failures, last-sync) incluídas
- [ ] README.md com documentação de rotas e exemplos curl

---

## 📚 Referências

- Módulo de referência: `apps/api/src/modules/integration/customer-sync/`
- Template geral: `docs/MODULE_TEMPLATE.md`
- Manual do projeto: `docs/PROJECT_MANUAL.md`
- Guia de nomenclatura: `docs/DOMAIN_NAMING_GUIDE.md`
- Módulos Sync-Only existentes: `customer-sync`, `product-catalog`, `product-stock-fetch`, `sales-order-sync`
