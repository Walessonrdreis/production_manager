# 📐 Template: Command-Cycle Module

> **Propósito:** Template canônico para módulos de integração **bidirecional** (sync + apply/delete no Omie).
>
> **Módulo de referência:** `product-structure` (único módulo com ciclo completo de comandos)

---

## 🧩 Visão Geral

Um módulo **Command-Cycle** **lê e escreve dados no Omie**, com um ciclo completo:

1. **Sync** → Lê dados do Omie e persiste no espelho local
2. **Apply** → Cria/altera dados no Omie e atualiza o espelho local
3. **Delete** → Exclui dados no Omie e atualiza o espelho local

Cada comando segue o padrão **Command Cycle**: ação → fetch pós-ação (ler estado real) → save mirror.

### Quando usar este template

- Estrutura de produtos (BOM/Malha): sync, criar, alterar, excluir
- Cadastros que exigem escrita bidirecional com o Omie
- Workflows que precisam de rascunho (draft) → submissão → confirmação

---

## 📁 Estrutura de Diretórios

```
{NOME_MODULO}/
├── README.md
├── CONTRATO_DE_USO.MD
├── index.ts
├── {NOME_MODULO}-integration-register.ts
├── application/
│   ├── dto/
│   │   ├── sync-{entidade}.dto.ts
│   │   ├── sync-all-{entidade}.dto.ts
│   │   ├── apply-{entidade}.dto.ts
│   │   └── delete-{entidade}.dto.ts
│   ├── mappers/
│   │   └── map-{entidade}-to-summary.ts
│   ├── ports/
│   │   ├── {entidade}-fetch.gateway.ts
│   │   ├── {entidade}-fetch-page.gateway.ts
│   │   ├── {entidade}-apply.gateway.ts
│   │   └── {entidade}-delete.gateway.ts
│   └── use-cases/
│       ├── sync-{entidade}.usecase.ts
│       ├── sync-all-{entidades}.usecase.ts
│       ├── apply-{entidade}.usecase.ts
│       ├── delete-{entidade}.usecase.ts
│       └── get-{entidade}-read-model.usecase.ts
├── infrastructure/
│   ├── db/
│   │   ├── {entidade}-integration.store.ts
│   │   └── {entidade}-command.store.ts
│   ├── gateways/
│   │   ├── fetch/
│   │   │   ├── real-{entidade}-fetch.gateway.ts
│   │   │   └── fake-{entidade}-fetch.gateway.ts
│   │   ├── fetch-page/
│   │   │   ├── real-{entidade}-fetch-page.gateway.ts
│   │   │   └── fake-{entidade}-fetch-page.gateway.ts
│   │   ├── apply/
│   │   │   ├── real-{entidade}-apply.gateway.ts
│   │   │   └── fake-{entidade}-apply.gateway.ts
│   │   └── delete/
│   │       ├── real-{entidade}-delete.gateway.ts
│   │       └── fake-{entidade}-delete.gateway.ts
│   └── jobs/
│       ├── {entidade}-jobs.register.ts
│       └── reconcile-{entidades}.job.ts
└── presentation/
    └── http/
        ├── routes.ts
        ├── openapi.ts
        └── routes/
            ├── Routes.md
            ├── index.ts
            ├── commands/
            │   ├── sync-{entidade}.route.ts
            │   ├── sync-all-{entidades}.route.ts
            │   ├── apply-{entidade}.route.ts
            │   ├── delete-{entidade}.route.ts
            │   └── submit-{entidade}.route.ts
            └── read/
                ├── get-{entidade}-read-model.route.ts
                ├── get-{entidade}-sync-status.route.ts
                └── get-{entidade}-summary.route.ts
```

---

## 📦 Register Pattern

O register deve seguir o padrão `create{NomeModulo}Integration()` — **fábrica** que retorna `{ name, register }` e ativa jobs.

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

> ⚠️ **Importante:** Diferente da implementação atual do `product-structure` (que usa `registerProductStructureIntegrationModule` e não chama jobs), o template **já inclui** a chamada de `register{NomeEntidade}Jobs(omieClient)` e usa o padrão `createXxxIntegration()`.

---

## 🔌 Ports/Gateways

Um módulo Command-Cycle tem **4 portas de gateway**:

| Porta | Função | Interface |
|-------|--------|-----------|
| `{entidade}-fetch` | Busca 1 entidade por código | `fetchBy{Chave}(chave): Promise<Result \| null>` |
| `{entidade}-fetch-page` | Busca página de entidades | `fetchPage(input): Promise<PageResult>` |
| `{entidade}-apply` | Cria/altera no Omie | `apply(chave, items): Promise<ApplyResult>` |
| `{entidade}-delete` | Exclui no Omie | `delete(chave): Promise<DeleteResult>` |

### `application/ports/{entidade}-fetch.gateway.ts`

```typescript
export type {Entidade}FetchResult = {
    {chave}: string;
    // ... campos mapeados do Omie
    hasStructure: boolean;
    items: Array<{ /* itens da estrutura */ }>;
    rawPayload?: unknown;
};

export interface {Entidade}FetchGateway {
    fetchBy{Chave}({chave}: string): Promise<{Entidade}FetchResult>;
}
```

### `application/ports/{entidade}-apply.gateway.ts`

```typescript
export type Apply{Entidade}Item = {
    componentCode: string;
    quantity: string | number;
    unit?: string;
    loss?: string | number;
};

export type Apply{Entidade}Result = {
    {chave}: string;
    applied: boolean;
    rawPayload?: unknown;
};

export interface {Entidade}ApplyGateway {
    apply({chave}: string, items: Apply{Entidade}Item[]): Promise<Apply{Entidade}Result>;
}
```

### `application/ports/{entidade}-delete.gateway.ts`

```typescript
export type Delete{Entidade}Result = {
    {chave}: string;
    deleted: boolean;
    rawPayload?: unknown;
};

export interface {Entidade}DeleteGateway {
    delete({chave}: string): Promise<Delete{Entidade}Result>;
}
```

---

## 🎯 Use-Cases

### Sync Individual (`sync-{entidade}.usecase.ts`)

Mesmo padrão do Sync-Only: fetch → commandStore.getOrCreateAccepted → store.save → markConfirmed.

### Sync Global (`sync-all-{entidades}.usecase.ts`)

Paginação incremental com `SyncStateStoreContract`, `fetchPageWithRetry` e idempotência via commandStore.

### Apply (`apply-{entidade}.usecase.ts`)

**Command Cycle:** Apply → Fetch (pós-apply) → Save mirror.

```typescript
export class Apply{Entidade}UseCase {
    constructor(
        private readonly applyGateway: {Entidade}ApplyGateway,
        private readonly fetchGateway: {Entidade}FetchGateway,
        private readonly store: {Entidade}IntegrationStore,
        private readonly commandStore: {Entidade}CommandStore,
        private readonly options: { noWrite?: boolean } = {}
    ) {}

    async execute(command: Apply{Entidade}Command) {
        if (this.options.noWrite) {
            await this.applyGateway.apply(command.{chave}, command.items);
            return { status: "ACCEPTED", externalRequestId: command.externalRequestId };
        }

        const { record, created } = await this.commandStore.getOrCreateAccepted({
            externalRequestId: command.externalRequestId,
            {chave}: command.{chave},
            commandType: "APPLY",
            source: command.source ?? "API2",
        });

        if (!created) return { status: record.status, externalRequestId: record.externalRequestId };

        try {
            // 1. Ação no Omie
            await this.applyGateway.apply(command.{chave}, command.items);

            // 2. Fetch pós-ação (ler estado real)
            const result = await this.fetchGateway.fetchBy{Chave}(command.{chave});

            // 3. Persistir espelho local
            await this.store.save(result);

            await this.commandStore.markConfirmed(command.externalRequestId);
            return { status: "CONFIRMED", externalRequestId: command.externalRequestId };
        } catch (err) {
            await this.commandStore.markFailed(command.externalRequestId, err);
            return { status: "FAILED", externalRequestId: command.externalRequestId };
        }
    }
}
```

### Delete (`delete-{entidade}.usecase.ts`)

**Command Cycle:** Delete → Fetch (pós-delete) → Save mirror.

```typescript
export class Delete{Entidade}UseCase {
    constructor(
        private readonly deleteGateway: {Entidade}DeleteGateway,
        private readonly fetchGateway: {Entidade}FetchGateway,
        private readonly store: {Entidade}IntegrationStore,
        private readonly commandStore: {Entidade}CommandStore,
        private readonly options: { noWrite?: boolean } = {}
    ) {}

    async execute(command: Delete{Entidade}Command) {
        // Mesmo padrão do Apply: delete → fetch → save → markConfirmed
    }
}
```

---

## 🗄️ Stores

### Integration Store (`infrastructure/db/{entidade}-integration.store.ts`)

```typescript
export class {Entidade}IntegrationStore {
    constructor(private readonly prisma: PrismaClient) {}

    async save(result: {Entidade}FetchResult): Promise<void> {
        // upsert no registro principal
        // deleteMany + create nos itens (substituição completa)
        await this.prisma.{entidade}.upsert({
            where: { {chave}: result.{chave} },
            update: { ... },
            create: { ... items: { create: result.items.map(...) } },
        });
    }

    async has{Chave}({chave}: string): Promise<boolean> { ... }
}
```

> **Padrão de save:** upsert no registro principal + `deleteMany: {}` + `create` nos itens para substituição completa da coleção.

### Command Store (`infrastructure/db/{entidade}-command.store.ts`)

Suporta múltiplos tipos de comando:

```typescript
export type CreateAcceptedCommandInput = {
    externalRequestId: string;
    {chave}: string;
    commandType: "SYNC" | "APPLY" | "DELETE";
    source?: "API2" | "JOB" | "ADMIN";
};
```

---

## 🧪 Gateways Concretos

### Real Gateways

Cada gateway real chama o endpoint Omie correspondente:

| Gateway | Endpoint Omie | Call |
|---------|---------------|------|
| Fetch | `{omie_endpoint}/` | `Consultar{Entidade}` |
| Fetch Page | `{omie_endpoint_page}/` | `Listar{Entidades}` |
| Apply | `{omie_endpoint}/` | `Incluir{Entidade}` ou `Alterar{Entidade}` |
| Delete | `{omie_endpoint}/` | `Excluir{Entidade}` |

> O **Apply Gateway** pode precisar de lógica para decidir entre Incluir/Alterar — primeiro consulta o estado atual e decide o método.

### Fake Gateways

Todos os fake gateways retornam dados simulados com `rawPayload: { fake: true, reason: "Fake gateway ativo" }`.

---

## ⏰ Jobs

### `infrastructure/jobs/{entidade}-jobs.register.ts`

```typescript
import cron from "node-cron";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { Reconcile{Entidades}Job } from "./reconcile-{entidades}.job";

export function register{NomeEntidade}Jobs(omieClient: OmieHttpClientPort) {
    const logger = getLogger("{entidade}:cron");

    if (!env.ENABLE_OMIE_{NOME_ENTIDADE_UCASE}_SYNC_JOB) {
        logger.info("{NomeEntidade} sync job is disabled");
        return;
    }

    const schedule = env.OMIE_{NOME_ENTIDADE_UCASE}_SYNC_CRON ?? "0 */12 * * *";

    cron.schedule(schedule, async () => {
        const runLogger = getLogger("{entidade}:cron:run");
        runLogger.info("Starting {NomeEntidade} sync job");
        try {
            await Reconcile{Entidades}Job.execute({ source: "JOB", omieClient });
            runLogger.info("Finished {NomeEntidade} sync job");
        } catch (error) {
            runLogger.error("{NomeEntidade} sync job failed", error);
        }
    });
}
```

### `infrastructure/jobs/reconcile-{entidades}.job.ts`

```typescript
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { SyncAll{Entidades}UseCase } from "../../application/use-cases/sync-all-{entidades}.usecase";
import { {Entidade}IntegrationStore } from "../db/{entidade}-integration.store";
import { {Entidade}CommandStore } from "../db/{entidade}-command.store";
import { Fake{Entidade}FetchPageGateway } from "../gateways/fetch-page/fake-{entidade}-fetch-page.gateway";
import { Real{Entidade}FetchPageGateway } from "../gateways/fetch-page/real-{entidade}-fetch-page.gateway";

type ExecuteInput = { source: "JOB"; omieClient: OmieHttpClientPort };

export class Reconcile{Entidades}Job {
    static async execute({ source, omieClient }: ExecuteInput): Promise<void> {
        const logger = getLogger("{entidade}:reconcile-job");
        const isFake = env.{NOME_MODULO_UCASE}_GATEWAY === "fake";

        const fetchPageGateway = isFake
            ? new Fake{Entidade}FetchPageGateway()
            : new Real{Entidade}FetchPageGateway(omieClient);

        const syncStateStore = new PrismaSyncStateStore(prisma.{entidade}SyncState, "GLOBAL");

        const useCase = new SyncAll{Entidades}UseCase(
            fetchPageGateway,
            new {Entidade}IntegrationStore(prisma),
            new {Entidade}CommandStore(prisma),
            syncStateStore,
            { noWrite: isFake }
        );

        const externalRequestId = `{entidade}-reconcile-${Date.now()}`;
        await useCase.execute({ externalRequestId, source: "JOB" });
    }
}
```

> **Método estático** — não precisa instanciar a classe. Reusa o `SyncAll{Entidades}UseCase` com `source: "JOB"`.

---

## 🌐 Env Vars

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{NOME_MODULO_UCASE}_GATEWAY` | Real/Fake | `fake` ou `real` |
| `ENABLE_OMIE_{NOME_ENTIDADE_UCASE}_SYNC_JOB` | Habilita job cron | `true` |
| `OMIE_{NOME_ENTIDADE_UCASE}_SYNC_CRON` | Cron schedule | `0 */12 * * *` |

---

## 🛣️ Rotas

### Comandos (POST)

| Rota | Descrição | Body | Schema | Comportamento |
|------|-----------|------|--------|---------------|
| `POST /v1/integration/{NOME_MODULO}/:{chave}/sync` | Sync de 1 entidade do Omie | `{ externalRequestId }` | Sim | Await |
| `POST /v1/integration/{NOME_MODULO}/sync-global` | Sync global (paginado) | `{ externalRequestId?, pageSize?, maxPages? }` | **Não** | Fire-and-forget |
| `POST /v1/integration/{NOME_MODULO}/:{chave}/apply` | Cria/altera no Omie | `{ externalRequestId, items: [{ componentCode, quantity, unit?, loss? }] }` | Sim | Await |
| `POST /v1/integration/{NOME_MODULO}/:{chave}/delete` | Exclui no Omie | `{ externalRequestId }` | Sim | Await |
| `POST /v1/integration/{NOME_MODULO}/:{chave}/submit` | **501 Not Implemented** (placeholder) | — | — | Always 501 |

> A rota `sync-global` **não tem schema** e usa `(request.body ?? {})` no handler.
> `sync-global` pode ser **fire-and-forget**: `void useCase.execute().catch(...)`.

### Read-Models (GET)

| Rota | Descrição | Query Params |
|------|-----------|-------------|
| `GET /v1/admin/read/{entidades}/production-readiness` | Readiness (ou read-model principal) | `view`, `q`, `activeOnly`, `structureStatus`, `onlyWithoutStructure`, `limit`, `offset`, `sort`, `order`, `since`, `includeItems` |
| `GET /v1/integration/{NOME_MODULO}/sync-status/:externalRequestId` | Status de comando (SYNC/APPLY/DELETE) | — |
| `GET /v1/integration/{NOME_MODULO}/summary` | Sumário de entidades | `onlyWithStructure`, `q`, `limit`, `offset` |

---

## 🎯 Padrões Obrigatórios

### 1. Command Cycle (Apply/Delete)

Apply e Delete seguem sempre o ciclo: **ação → fetch pós-ação → save mirror**.

Isso garante que o espelho local reflita o estado real do Omie após cada operação, incluindo validações e transformações que o Omie possa ter aplicado.

### 2. Múltiplos Tipos de Comando no CommandStore

O CommandStore deve suportar `SYNC`, `APPLY` e `DELETE` como `commandType`. A tabela Prisma deve ter:

```prisma
model {Entidade}Command {
    externalRequestId String   @unique
    {chave}           String
    commandType       String   // "SYNC" | "APPLY" | "DELETE"
    status            String   // "ACCEPTED" | "CONFIRMED" | "FAILED"
    source            String?  // "API2" | "JOB" | "ADMIN"
    executedAt        DateTime @default(now())
    completedAt       DateTime?
    lastError         Json?
}
```

### 3. Gateway com Decisão Inteligente (Apply)

O Apply Gateway real pode precisar de lógica para decidir entre criar ou alterar:

```typescript
// Consulta estado atual para decidir método
const current = await this.omieClient.post("produto/estrutura/", {
    call: "ConsultarEstrutura",
    param: [{ codProduto: productCode }],
});
const hasAny = Array.isArray(current?.itens) && current.itens.length > 0;
const call = hasAny ? "AlterarEstrutura" : "IncluirEstrutura";
```

### 4. Webhook Pattern (opcional, futuro)

Para módulos Command-Cycle, considere expor webhooks para notificar API 2 sobre mudanças de estado:
- `POST /v1/integration/{NOME_MODULO}/webhook` — callback quando estado muda

### 5. Rate Limiting no Sync Global

O sync global deve usar `fetchPageWithRetry` com backoff e `sleep(700)` entre páginas para evitar rate limiting do Omie.

---

## 📋 Checklist de Criação

- [ ] Estrutura de diretórios segue o template acima (4 portas de gateway)
- [ ] `index.ts` apenas re-exporta o register
- [ ] Register usa padrão `create{NomeModulo}Integration()` com `{ name, register }`
- [ ] Register **chama** `register{NomeEntidade}Jobs(omieClient)` (não esquecer!)
- [ ] 4 portas de gateway: fetch, fetch-page, apply, delete
- [ ] 2 gateways concretos (Real/Fake) para cada porta
- [ ] Apply usa **2 gateways** (apply + fetch) no mesmo use case
- [ ] Delete usa **2 gateways** (delete + fetch) no mesmo use case
- [ ] Integration store com upsert + deleteMany+create nos itens
- [ ] Command store suporta `SYNC | APPLY | DELETE`
- [ ] Use-cases aceitam `options.noWrite`
- [ ] Sync-global usa `(request.body ?? {})` sem schema
- [ ] Jobs usam `import { env }` não `process.env`
- [ ] Job usa classe estática `Reconcile{Entidades}Job.execute()`
- [ ] Env vars seguem convenção `ENABLE_OMIE_*` e `OMIE_*_CRON`
- [ ] Rotas de monitoramento (sync-status, summary) incluídas
- [ ] README.md com documentação, contrato de uso e arquitetura
- [ ] Endpoint `/submit` retorna 501 (placeholder)

---

## 📚 Referências

- Módulo de referência: `apps/api/src/modules/integration/product-structure/`
- Template geral: `docs/MODULE_TEMPLATE.md`
- Manual do projeto: `docs/PROJECT_MANUAL.md`
- Guia de nomenclatura: `docs/DOMAIN_NAMING_GUIDE.md`
- Template Sync-Only: `docs/TEMPLATE_SYNC_ONLY.md`
- Módulos Command-Cycle existentes: `product-structure`
