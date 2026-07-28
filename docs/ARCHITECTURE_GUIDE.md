# 🏗️ GUIA DE ARQUITETURA - PRODUCTION MANAGER

## 1. ARQUITETURA CANÔNICA (PADRÃO IMUTÁVEL)

### 1.1 Estrutura de Pastas Obrigatória

```
apps/api/src/
├── shared/infra/job-queue/          # Shared infra — Job Queue Centralizada (PgBoss)
│   ├── index.ts                     # Barrel exports
│   ├── pgboss-queue.ts              # Singleton PgBoss, enqueue, stop
│   └── integration.worker.ts        # Worker único, registra handlers, startWorker
├── modules/integration/{nome-modulo}/
├── application/                    # Regras de negócio puras
│   ├── ports/                     # Interfaces (Ports)
│   │   ├── {entidade}-{ação}.gateway.ts
│   │   └── {entidade}-{outra-ação}.gateway.ts
│   └── use-cases/                 # Casos de uso
│       ├── {verbo}-{entidade}.usecase.ts
│       └── {outro-verbo}-{entidade}.usecase.ts
├── infrastructure/                # Implementações concretas
│   ├── db/                        # Repositórios/Stores
│   │   ├── {entidade}-{tipo}.store.ts
│   │   └── {outra-entidade}-{tipo}.store.ts
│   ├── gateways/                  # Gateways organizados por ação
│   │   ├── {ação}/
│   │   │   ├── fake-{entidade}-{ação}.gateway.ts
│   │   │   └── real-{entidade}-{ação}.gateway.ts
│   │   └── {outra-ação}/
│   │       ├── fake-{entidade}-{outra-ação}.gateway.ts
│   │       └── real-{entidade}-{outra-ação}.gateway.ts
│   └── jobs/                      # Jobs agendados
│       ├── {nome-modulo}-jobs.register.ts
│       └── {verbo}-{entidade}.job.ts
└── presentation/                  # Interface HTTP
    └── http/
        ├── routes.ts              # Registro principal
        └── routes/                # Rotas organizadas
            ├── commands/          # Comandos (alteram estado)
            │   ├── {verbo}-{entidade}.route.ts
            │   └── {outro-verbo}-{entidade}.route.ts
            └── read/              # Consultas (não alteram estado)
                └── get-{entidade}-{modelo}.route.ts
```

---

## 2. CLEAN ARCHITECTURE E PORTS & ADAPTERS

### 2.1 Princípios Fundamentais

#### **Dependência Invertida:**
- **Camadas internas** (application) NÃO dependem de camadas externas
- **Camadas externas** (infrastructure) dependem de camadas internas
- **Interfaces** (ports) definem contratos, implementações são detalhes

#### **Separação de Concerns:**
- **Application:** Regras de negócio puras (sem infraestrutura)
- **Infrastructure:** Implementações concretas (DB, HTTP, etc.)
- **Presentation:** Interface com usuário (HTTP, CLI, etc.)

### 2.2 Camadas da Arquitetura

#### **CAMADA APPLICATION (Núcleo)**
```typescript
// Regras de negócio puras - sem dependências externas
export class ApplyProductStructureUseCase {
  constructor(
    private readonly applyGateway: ProductStructureApplyGateway,  // Port
    private readonly fetchGateway: ProductStructureFetchGateway,  // Port
    private readonly store: ProductStructureIntegrationStore     // Port
  ) {}

  async execute(command: ApplyProductStructureCommand) {
    // Lógica de negócio usando apenas ports
  }
}
```

#### **CAMADA INFRASTRUCTURE (Implementações)**
```typescript
// Implementações concretas - dependem de ports
export class RealProductStructureApplyGateway implements ProductStructureApplyGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) {}  // Port

  async apply(productCode: string, items: ApplyProductStructureItem[]) {
    // Implementação real com Omie
  }
}
```

#### **CAMADA PRESENTATION (Interface)**
```typescript
// Interface HTTP - depende de application
export async function registerApplyProductStructureRoute(app: FastifyInstance) {
  app.post("/v1/integration/product-structure/:productCode/apply", async (request, reply) => {
    // Chama use case da application
    await applyProductStructureUseCase.execute(command);
  });
}
```

---

## 3. PADRÃO REAL/FAKE PARA GATEWAYS

### 3.1 Princípio do Padrão

```
Módulos de integração externa (Tipo A) DEVEM usar:
- RealGateway → Produção (chama Omie)
- FakeGateway → Dev/Test (simula comportamento)
```

### 3.2 Configuração via Environment
```typescript
// .env
PRODUCT_STRUCTURE_GATEWAY=fake    // Desenvolvimento
PRODUCT_STRUCTURE_GATEWAY=real    // Produção
```

### 3.3 Implementação Real
```typescript
// infrastructure/gateways/fetch/real-product-structure-fetch.gateway.ts
export class RealProductStructureFetchGateway implements ProductStructureFetchGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async fetchByProductCode(productCode: string): Promise<ProductStructureFetchResult> {
    const response = await this.omieClient.post<any>("produto/estrutura/", {
      call: "ConsultarEstrutura",
      param: [{ codProduto: productCode }],
    });

    return {
      productCode,
      hasStructure: response?.itens?.length > 0,
      items: response.itens.map((item: any) => ({
        componentCode: item.codProdMalha,
        quantity: item.quantProdMalha,
      }))
    };
  }
}
```

### 3.4 Implementação Fake
```typescript
// infrastructure/gateways/fetch/fake-product-structure-fetch.gateway.ts
export class FakeProductStructureFetchGateway implements ProductStructureFetchGateway {
  async fetchByProductCode(productCode: string): Promise<ProductStructureFetchResult> {
    return {
      productCode,
      hasStructure: false,
      items: [],
      rawPayload: { fake: true, reason: "Fake gateway ativo" }
    };
  }
}
```

**⚠️ IMPORTANTE: Fake Gateway ≠ Mock de teste**
- **Fake Gateway**: Implementação funcional completa para desenvolvimento e execução local. Simula comportamento real sem dependências externas.
- **Mock de teste**: Implementação mínima apenas para testes unitários, usando frameworks como Jest.
- **Uso correto**: Use Fake Gateways para desenvolvimento local e testes de integração. Use Mocks apenas para testes unitários isolados.

### 3.5 Factory Pattern para Seleção
```typescript
// infrastructure/gateways/fetch/index.ts
export function createProductStructureFetchGateway(omieClient: OmieHttpClientPort) {
  const gatewayType = process.env.PRODUCT_STRUCTURE_GATEWAY || "fake";
  
  if (gatewayType === "real") {
    return new RealProductStructureFetchGateway(omieClient);
  }
  
  return new FakeProductStructureFetchGateway();
}
```

---

## 4. SISTEMA DE JOBS AGENDADOS

### 4.1 Arquitetura de Jobs

```
infrastructure/jobs/
├── {nome-modulo}-jobs.register.ts    # Registro e configuração
├── {verbo}-{entidade}.job.ts         # Job de sincronização/reconciliação
└── process-{entidade}-queue.job.ts   # Queue Processor (fila de comandos)
```

#### Tipos de Jobs:
| Tipo | Descrição | Exemplo |
|------|-----------|--------|
| **Sincronização** | Traz dados do Omie para espelho local | `sync-all-production-orders.job.ts` |
| **Reconciliação** | Detecta e corrige divergências | `reconcile-product-structures.job.ts` |
| **Queue Processor** | ⚠️ **LEGADO** — Consome fila de comandos com rate-limit (substituído por PgBoss) | `process-production-order-queue.job.ts` |

### 4.2 Job Register (Configuração)
```typescript
// infrastructure/jobs/product-structure-jobs.register.ts
import cron from "node-cron";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { ReconcileProductStructuresJob } from "./reconcile-product-structures.job";

export function registerProductStructureJobs(omieClient: OmieHttpClientPort) {
  const logger = getLogger("product-structure:cron");

  // Controle por environment
  if (process.env.ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB !== "true") {
    logger.info("Product Structure sync job is disabled");
    return;
  }

  const schedule = process.env.OMIE_PRODUCT_STRUCTURE_SYNC_CRON ?? "0 */12 * * *";

  cron.schedule(schedule, async () => {
    const runLogger = getLogger("product-structure:cron:run");
    
    try {
      await ReconcileProductStructuresJob.execute({
        source: "JOB",
        omieClient,
      });
    } catch (error) {
      runLogger.error("Job failed", error);
    }
  });
}
```

### 4.3 Job Implementation
```typescript
// infrastructure/jobs/reconcile-product-structures.job.ts
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

export class ReconcileProductStructuresJob {
  static async execute(options: { source: string; omieClient: OmieHttpClientPort }) {
    const logger = getLogger("ReconcileProductStructuresJob");
    
    // 1. Verificar lock para evitar concorrência
    // 2. Executar lógica de reconciliação
    // 3. Persistir resultados
    // 4. Liberar lock
  }
}
```

### 4.4 Controle por Environment
```typescript
// Variáveis de controle no .env
ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB=true
OMIE_PRODUCT_STRUCTURE_SYNC_CRON="0 */12 * * *"
ENABLE_OMIE_STOCK_REFRESH_JOB=false
STOCK_REFRESH_CRON="*/30 * * * *"

// Queue Processor (fila de comandos) — ⚠️ LEGADO: substituído por PgBoss
ENABLE_OMIE_PRODUCTION_ORDER_QUEUE_JOB=true
OMIE_PRODUCTION_ORDER_QUEUE_CRON="* * * * * *"
```

### 4.5 Queue Processor Job — ⚠️ LEGADO

> **⚠️ Este padrão foi substituído pelo worker centralizado PgBoss ([ADR-009](./DECISIONS.md#-adr-009--job-queue-centralizada-com-pgboss)).**
> Consulte a **seção 5.5** para o novo padrão.
> Módulos migrados para PgBoss removem este job e o cron `* * * * * *` correspondente.

```typescript
// infrastructure/jobs/process-{entidade}-queue.job.ts
// Job que roda a cada 1 segundo, processa 1 comando por vez com rate-limit.

import { createJobLock } from "@/shared/utils/job-lock";

const LOCK_KEY = "{entidade}-queue-processor";
const LOCK_TTL_MS = 60000;

export class Process{Entidade}QueueJob {
  static async execute(prisma: PrismaClient) {
    const lock = createJobLock(LOCK_KEY, LOCK_TTL_MS);
    const acquired = await lock.acquire();
    if (!acquired) return; // Já tem outro worker rodando

    try {
      const commandStore = new {Entidade}CommandStore(prisma);

      while (true) {
        const [command] = await commandStore.dequeue(1);
        if (!command) break; // Fila vazia

        try {
          // Executa comando (Omie)
          await executeCommand(command);
          await commandStore.markConfirmed(command.externalRequestId);
        } catch (error) {
          await commandStore.markFailed(command.externalRequestId, error);
        }

        await sleep(1000); // Rate-limit: 1 chamada/segundo
      }
    } finally {
      await lock.release();
    }
  }
}
```

---

## 5. PADRÃO CANÔNICO (READ + COMMAND + JOB)

### 5.1 Read-model (GET)
```typescript
// Características:
// - Lê apenas o DB (não chama Omie)
// - Entrega decisão pronta
// - Consumido pela API 2
// - Não executa efeitos colaterais

// Exemplo: get-products-production-read-model.usecase.ts
export class GetProductsProductionReadModelUseCase {
  async execute(): Promise<ProductionReadinessModel[]> {
    // Consulta DB e retorna modelo pronto
  }
}
```

### 5.2 Command (POST)
```typescript
// Características:
// - Sempre externalRequestId
// - Fake/Real por environment
// - Idempotência via CommandStore
// - Retorna 202 Accepted sempre

// Exemplo: apply-product-structure.usecase.ts
export class ApplyProductStructureUseCase {
  async execute(command: ApplyProductStructureCommand) {
    // 1. Verifica idempotência
    // 2. Executa ação (fake ou real)
    // 3. Persiste tracking
  }
}
```

### 5.3 Job (cron)
```typescript
// Características:
// - Controlado por environment
// - Lock para evitar concorrência
// - Reutiliza os mesmos UseCases (não chama gateway direto)

// Exemplo: reconcile-product-structures.job.ts
export class ReconcileProductStructuresJob {
  static async execute(options: { source: string; omieClient: OmieHttpClientPort }) {
    // Reutiliza SyncProductStructureUseCase
  }
}
```

### 5.4 Command Queue (Fila de Comandos Assíncrona) — ⚠️ LEGADO

> **⚠️ Este padrão foi substituído pelo [ADR-009](./DECISIONS.md#-adr-009--job-queue-centralizada-com-pgboss).**
> Módulos migrados/novos devem usar a fila centralizada **PgBoss** (seção 5.5 abaixo).
> O `CommandStore` permanece como **audit trail** — o enfileiramento/dequeuing manual (`SKIP LOCKED + polling 1s`) é substituído pelo PgBoss.

**Quando usar (apenas módulos não migrados)**: Operações que exigem rate-limit contra o Omie (ex: 1 chamada/segundo).

> 📌 **Decisão arquitetural original**: Consulte **[ADR-008](../DECISIONS.md)** para referência.

**Fluxo (legado — manter apenas para módulos pendentes de migração)**:
```
Route POST → ProductionOrderCommandStore.enqueue({ commandType: "CREATE_OP", status: "PENDING" })
                ↓
ProcessProductionOrderQueueJob (cron * * * * * *)
                ↓
    commandStore.dequeue(1) → SELECT ... FOR UPDATE SKIP LOCKED
                ↓
         status = PROCESSING
                ↓
       Executa gateway (Omie)
                ↓
         CONFIRMED ou FAILED
```

**Estrutura do CommandStore para fila (legado)**:
```typescript
// infrastructure/db/{entidade}-command.store.ts
export class {Entidade}CommandStore {
  // Enfileiramento
  async enqueue(input: EnqueueCommandInput): Promise<{ record: ProductionOrderCommand; created: boolean }>

  // Dequeuing atômico (FOR UPDATE SKIP LOCKED)
  async dequeue(batchSize?: number): Promise<ProductionOrderCommand[]>

  // Transições de status
  async markProcessing(externalRequestId: string): Promise<void>
  async markConfirmed(externalRequestId: string): Promise<void>
  async markFailed(externalRequestId: string, error: unknown): Promise<void>

  // Consultas
  async countByStatusAll(): Promise<StatusCounts>
  async listRecent(limit?: number): Promise<ProductionOrderCommand[]>
  async listFailures(limit?: number): Promise<ProductionOrderCommand[]>
  async findProcessingStalled(ageMs: number): Promise<ProductionOrderCommand[]>
}
```

**Enums do Schema Prisma**:
```prisma
enum ProductionOrderCommandType {
  SYNC_GLOBAL
  CREATE_OP
  UPDATE_OP
  SYNC_OP
}

enum ProductionOrderCommandStatus {
  PENDING
  PROCESSING
  ACCEPTED
  CONFIRMED
  FAILED
}

enum ProductionOrderCommandSource {
  API2
  JOB
  ADMIN
}
```

---

### 5.5 Job Queue Centralizada com PgBoss (NOVO PADRÃO)

> 📌 **Decisão arquitetural**: Consulte **[ADR-009](./DECISIONS.md#-adr-009--job-queue-centralizada-com-pgboss)** para racional completo.

**Propósito**: Substituir filas por módulo (`SKIP LOCKED + polling 1s`) por uma **fila centralizada**
event-driven, com worker único e retry nativo.

**Arquitetura:**

```
HTTP Route (POST)
  ↓ 202 Accepted
UseCase (aplicação)
  ↓ getJobQueue().enqueue()
┌──────────────────────────────┐
│       PgBoss Queue           │  ← Tabela pg-boss no schema `pgboss`
│  (event-driven LISTEN/NOTIFY)│
└──────────┬───────────────────┘
           ↓ EVENTO
┌──────────────────────────────┐
│  integration.worker.ts       │  ← Worker ÚNICO (singleton)
│  boss.work(type, handler)    │
│  Roteia por job.data.type    │
└──────────┬───────────────────┘
           ↓
     UseCase (mesma lógica)
           ↓
    Gateway (Omie / Fake)
           ↓
  CommandStore (audit trail)
```

**Onde vive:**

```
apps/api/src/shared/infra/job-queue/
├── index.ts                 # Barrel exports
├── pgboss-queue.ts          # Singleton PgBoss, enqueue, stop
└── integration.worker.ts    # Worker único, registra handlers, startWorker
```

**Como enfileirar (no UseCase):**

```typescript
import { getJobQueue } from "@/shared/infra/job-queue";

// No use-case, após validar o comando:
const boss = await getJobQueue();
await boss.enqueue("product-structure.sync", {
  productCode: "123",
  externalRequestId: "uuid",
}, {
  retryLimit: 5,
  retryBackoff: true,
  singletonKey: "product-structure-sync-123", // evita duplicatas
});
```

**Como registrar um handler (no bootstrap do módulo):**

```typescript
// modules/integration/product-structure/infrastructure/jobs/
import { registerJobHandler } from "@/shared/infra/job-queue";

// Antes do worker iniciar:
registerJobHandler("product-structure.sync", async (job) => {
  const useCase = container.resolve(SyncProductStructureUseCase);
  await useCase.execute({
    productCode: job.data.productCode,
    externalRequestId: job.data.externalRequestId,
  });
}, {
  concurrency: 3,           // jobs simultâneos deste tipo
  batchSize: 1,             // jobs por vez (padrão)
});
```

**Worker lifecycle (no bootstrap da API):**

```typescript
// bootstrap/index.ts
import { startJobQueue, startWorker } from "@/shared/infra/job-queue";
import "@/modules/integration/product-structure/infrastructure/jobs"; // side-effect: registra handlers

const boss = await startJobQueue();
await startWorker(boss); // inicia processamento
```

**Variáveis de Ambiente:**

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PG_BOSS_CONNECTION_STRING` | (mesma DB) | Connection string para o PgBoss |
| `PG_BOSS_CONCURRENCY` | `1` | Concorrência máxima global do worker |
| `PG_BOSS_SCHEDULE_INTERVAL` | `2` | Polling interval interno do PgBoss (segundos) |

**Vantagens sobre o padrão anterior:**

| Característica | Command Queue (legado) | PgBoss (novo) |
|---|---|---|
| Entrega | Polling `SELECT ... SKIP LOCKED` a cada 1s | Event-driven (`LISTEN/NOTIFY`) |
| Retry | Manual (`findProcessingStalled`) | Nativo (backoff exponencial) |
| Worker | 1 job por módulo | 1 worker centralizado |
| Concorrência | Rate-limit fixo 1 chamada/s | Configurável por tipo de job |
| Duplicatas | Verificação manual | `singletonKey` nativo |
| Monitoria | Logs + tabela `_command` | Dashboard nativo + métricas |

---

## 6. ORGANIZAÇÃO DE ROTAS HTTP

### 6.1 Estrutura de Rotas
```
presentation/http/routes/
├── commands/          # Comandos (POST) - alteram estado
│   ├── apply-product-structure.route.ts
│   ├── delete-product-structure.route.ts
│   ├── submit-product-structure.route.ts
│   └── sync-product-structure.route.ts
└── read/              # Consultas (GET) - não alteram estado
    ├── get-production-readiness.route.ts
    ├── list-{entidades}.route.ts              # Lista paginada do espelho
    ├── get-{entidade}.route.ts                # Detalhe + itens
    ├── get-{entidade}-stats.route.ts          # Estatísticas
    ├── get-queue-status.route.ts              # Status da fila de comandos
    └── get-queue-failures.route.ts            # Falhas da fila
```

### 6.2 Padrão de Nomeação de Rotas
```typescript
// Comandos (sempre POST):
/v1/integration/{entidade}/{identificador}/{ação}

// Consultas (sempre GET):
/v1/admin/read/{entidade}/{modelo}
```

### 6.3 Exemplo de Rota de Comando
```typescript
// commands/apply-product-structure.route.ts
export async function registerApplyProductStructureRoute(app: FastifyInstance) {
  app.post("/v1/integration/product-structure/:productCode/apply", {
    schema: {
      body: applyProductStructureSchema,
      params: applyProductStructureParamsSchema,
      response: {
        202: acceptedResponseSchema,
        400: badRequestSchema,
        500: internalErrorSchema
      }
    }
  }, async (request, reply) => {
    const command = {
      externalRequestId: request.headers["x-external-request-id"] as string,
      productCode: request.params.productCode,
      items: request.body.items
    };

    await applyProductStructureUseCase.execute(command);
    
    reply.code(202).send({ status: "accepted" });
  });
}
```

---

## 7. BOOTSTRAP E REGISTRO DE MÓDULOS

### 7.1 Registro de Módulo
```typescript
// {nome-modulo}-integration-register.ts
import type { FastifyInstance } from "fastify";
import { {nomeModulo}IntegrationRoutes } from "./presentation/http/routes";

export async function register{nomeModulo}IntegrationModule(app: FastifyInstance) {
  await app.register({nomeModulo}IntegrationRoutes);
}
```

### 7.2 Registro no Bootstrap
```typescript
// src/bootstrap/routes.ts
import { registerProductStructureIntegrationModule } from "@/modules/integration/product-structure/product-structure-integration-register";
import { registerOrdersModule } from "@/modules/integration/orders/register-orders-module";
// ... outros módulos

export function registerRoutes(app: FastifyInstance) {
  registerProductStructureIntegrationModule(app);
  registerOrdersModule(app);
  // ... outros registros
}
```

---

## 8. PRINCÍPIOS DE DESIGN APLICADOS

### 8.1 Single Responsibility Principle
- **Use Case:** Uma responsabilidade de negócio
- **Gateway:** Uma forma de comunicação externa  
- **Store:** Um tipo de persistência
- **Route:** Um endpoint HTTP

### 8.2 Dependency Inversion Principle
- **Application** define interfaces (ports)
- **Infrastructure** implementa interfaces
- **Nunca** application depende de infrastructure

### 8.3 Interface Segregation Principle
- **Ports específicos** para cada ação
- **Nenhuma** interface genérica "do tudo"
- **Cada gateway** implementa apenas o necessário

### 8.4 Open/Closed Principle
- **Extensível** para novos gateways
- **Fechado** para modificação de ports
- **Novos módulos** seguem mesmo padrão

---

## 9. 📚 DOCUMENTAÇÃO RELACIONADA

Para entender as **decisões arquiteturais fundamentais** por trás desta estrutura, consulte:

- **[DECISIONS.md](../DECISIONS.md)** - Architectural Decisions Record (ADR) com racional, consequências e alternativas
- **[PROJECT_MANUAL.md](../PROJECT_MANUAL.md)** - Autoridade máxima do projeto
- **[DOMAIN_NAMING_GUIDE.md](../DOMAIN_NAMING_GUIDE.md)** - Guia canônico de nomenclatura de domínio

---

**📌 NOTA:** Esta arquitetura é **canônica** para o projeto. Qualquer desvio
deve ser justificado e documentado como exceção, não como padrão.
```