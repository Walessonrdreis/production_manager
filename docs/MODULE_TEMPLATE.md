# Template de Módulo - Production Manager

> ⚡ **Módulo Canônico de Referência**: `product-structure`  
> Todo novo módulo de integração DEVE seguir a estrutura, padrões e convenções do
> módulo `product-structure`, que é o padrão mais completo e revisado do projeto.
> Consulte `apps/api/src/modules/integration/product-structure/` como referência viva.

Este template define a estrutura canônica obrigatória para todos os novos módulos de integração. Use este template como ponto de partida e referência ao criar qualquer novo módulo.

## 1. Estrutura Completa do Módulo

```
nome-do-modulo/                          # kebab-case (ex: sales-order-sync)
├── application/
│   ├── ports/
│   │   └── nome-do-modulo-[ação].gateway.ts
│   └── use-cases/
│       └── [ação]-nome-do-modulo.usecase.ts
├── infrastructure/
│   ├── db/
│   │   ├── nome-do-modulo-[tipo].store.ts
│   │   ├── nome-do-modulo-command.store.ts  ⚠️ OPCIONAL — apenas para audit trail (legado); módulos sem command usam PgBoss
│   │   └── nome-do-modulo-sync-state.store.ts
│   ├── gateways/
│   │   ├── [ação]/
│   │   │   ├── real-nome-do-modulo-[ação].gateway.ts
│   │   │   └── fake-nome-do-modulo-[ação].gateway.ts
│   │   └── consult/
│   │       ├── nome-do-modulo-consult.gateway.ts
│   │       ├── real-nome-do-modulo-consult.gateway.ts
│   │       └── fake-nome-do-modulo-consult.gateway.ts
│   └── jobs/
│       ├── [ação]-nome-do-modulo.job.ts
│       ├── sync-all-nome-do-modulo.job.ts
│       └── nome-do-modulo-jobs.register.ts
├── presentation/
│   └── http/
│       ├── routes/
│       │   ├── commands/
│       │   │   └── [ação]-nome-do-modulo.route.ts
│       │   ├── callbacks/
│       │   │   └── confirm-[modelo].callback.route.ts
│       │   └── read/
│       │       └── get-[modelo]-read-model.route.ts
│       ├── routes.ts
│       └── index.ts
├── index.ts
└── nome-do-modulo-integration-register.ts
```

## 2. Arquivos Template por Tipo

### 2.1 Port (Interface) - `application/ports/`

**Arquivo**: `nome-do-modulo-[ação].gateway.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/application/ports/nome-do-modulo-[açao].gateway.ts

export type NomeDoModuloAcaoItem = {
  // Defina os campos do item
  id: string;
  quantidade: number;
  unidade?: string;
};

export type NomeDoModuloAcaoResult = {
  sucesso: boolean;
  codigo: string;
  payloadBruto: any;
};

export interface NomeDoModuloAcaoGateway {
  executar(codigo: string, itens: NomeDoModuloAcaoItem[]): Promise<NomeDoModuloAcaoResult>;
}
```

### 2.2 Use Case - `application/use-cases/`

**Arquivo**: `[ação]-nome-do-modulo.usecase.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/application/use-cases/[açao]-nome-do-modulo.usecase.ts

import type { NomeDoModuloAcaoGateway } from "../ports/nome-do-modulo-[açao].gateway";
import type { NomeDoModuloStore } from "../../infrastructure/db/nome-do-modulo.store";
import type { NomeDoModuloCommandStore } from "../../infrastructure/db/nome-do-modulo-command.store";

export type NomeDoModuloAcaoCommand = {
  externalRequestId: string;  // OBRIGATÓRIO para idempotência
  codigo: string;
  itens: any[];
  fonte?: "API2" | "JOB" | "ADMIN";
};

export class NomeDoModuloAcaoUseCase {
  constructor(
    private readonly gateway: NomeDoModuloAcaoGateway,
    private readonly store: NomeDoModuloStore,
    private readonly commandStore: NomeDoModuloCommandStore,
    private readonly opcoes: { semEscrita?: boolean } = {}
  ) {}

  async executar(comando: NomeDoModuloAcaoCommand) {
    // Fake no-write: simula sem tracking
    if (this.opcoes.semEscrita) {
      await this.gateway.executar(comando.codigo, comando.itens);
      return { status: "ACEITO" as const, externalRequestId: comando.externalRequestId };
    }

    // Idempotência: verifica se já existe
    const { registro, criado } = await this.commandStore.obterOuCriarAceito({
      externalRequestId: comando.externalRequestId,
      codigo: comando.codigo,
      tipoComando: "ACAO" as const,
      fonte: comando.fonte ?? "API2",
    });

    if (!criado) {
      return { status: registro.status, externalRequestId: registro.externalRequestId };
    }

    try {
      // Executa a ação principal
      const resultado = await this.gateway.executar(comando.codigo, comando.itens);

      // Sincroniza estado e persiste
      await this.store.salvar(resultado);
      await this.commandStore.marcarConfirmado(comando.externalRequestId);

      return { status: "CONFIRMADO" as const, externalRequestId: comando.externalRequestId };
    } catch (erro) {
      await this.commandStore.marcarFalha(comando.externalRequestId, erro);
      throw erro;
    }
  }
}
```

### 2.2b Sync All Use Case (Incremental) - `application/use-cases/`

Para módulos que sincronizam **todos os registros** do Omie via paginação incremental com checkpoint:

**Arquivo**: `sync-all-nome-do-modulo.usecase.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/application/use-cases/sync-all-nome-do-modulo.usecase.ts

import { getLogger } from "@/shared/logger";
import { fetchPageWithRetry } from "@/shared/integration/strategies/retry.strategy";
import type { NomeDoModuloSyncPageGateway } from "../ports/nome-do-modulo-sync-page.gateway";
import type { NomeDoModuloCommandStore } from "../../infrastructure/db/nome-do-modulo-command.store";
import type { NomeDoModuloStore } from "../../infrastructure/db/nome-do-modulo.store";
import type { SyncStateStoreContract } from "@/shared/integration/strategies/types";

export type SyncAllNomeDoModuloCommand = {
  externalRequestId: string;
  pageSize?: number;
  maxPages?: number;
  source?: "API2" | "JOB" | "ADMIN";
};

export class SyncAllNomeDoModuloUseCase {
  private readonly logger = getLogger("SyncAllNomeDoModuloUseCase");

  constructor(
    private readonly fetchPageGateway: NomeDoModuloSyncPageGateway,
    private readonly syncStore: NomeDoModuloStore,
    private readonly commandStore: NomeDoModuloCommandStore,
    private readonly syncStateStore: SyncStateStoreContract,
    private readonly options: { noWrite?: boolean } = {}
  ) {}

  async execute(command: SyncAllNomeDoModuloCommand) {
    const pageSize = Math.max(1, Math.min(Number(command.pageSize || 100), 500));
    const maxPages = Math.max(1, Math.min(Number(command.maxPages || 1000), 10000));

    this.logger.info("Global sync started", {
      externalRequestId: command.externalRequestId,
      pageSize, maxPages,
      source: command.source ?? "API2",
      noWrite: this.options.noWrite === true,
    });

    // ── Mode no-write (apenas validação) ──────────────────────────────
    if (this.options.noWrite) {
      let page = 1, processedPages = 0, processedItems = 0;
      while (processedPages < maxPages) {
        const pageResult = await this.fetchPageGateway.fetchPage({ page, pageSize });
        processedPages++; processedItems += pageResult.items.length;
        this.logger.info("No-write page processed", {
          externalRequestId: command.externalRequestId,
          page, items: pageResult.items.length,
          processedPages, processedItems,
        });
        if (!pageResult.hasNextPage || pageResult.items.length === 0) break;
        page++;
      }
      return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId, resourceId: "__GLOBAL__" as const };
    }

    // ── Idempotência ─────────────────────────────────────────────────
    const { record, created } = await this.commandStore.getOrCreateAccepted({
      externalRequestId: command.externalRequestId,
      commandType: "SYNC_GLOBAL",
      source: command.source ?? "API2",
    });
    if (!created) {
      return { status: record.status, externalRequestId: command.externalRequestId, resourceId: "__GLOBAL__" as const };
    }

    // ── Sync incremental ─────────────────────────────────────────────
    try {
      const state = await this.syncStateStore.getState();
      const lastSyncAt = state.lastSyncAt;

      this.logger.info("Incremental sync window", {
        externalRequestId: command.externalRequestId, lastSyncAt,
      });

      let page = 1, processedPages = 0, processedItems = 0;
      while (processedPages < maxPages) {
        const pageResult = await fetchPageWithRetry(
          () => this.fetchPageGateway.fetchPage({ page, pageSize, updatedSince: lastSyncAt }),
          { label: "nome-do-modulo", externalRequestId: command.externalRequestId, page, pageSize }
        );

        processedPages++; processedItems += pageResult.items.length;

        for (const item of pageResult.items) {
          await this.syncStore.save(item);
        }

        this.logger.info("Page processed", {
          externalRequestId: command.externalRequestId, page,
          items: pageResult.items.length, processedPages, processedItems,
          hasNextPage: pageResult.hasNextPage,
        });

        if (!pageResult.hasNextPage || pageResult.items.length === 0) break;
        page++;
      }

      await this.syncStateStore.updateLastSync(new Date());
      await this.commandStore.markConfirmed(command.externalRequestId);

      this.logger.info("Global sync completed", {
        externalRequestId: command.externalRequestId,
        processedPages, processedItems,
      });

      return { status: "ACCEPTED" as const, externalRequestId: command.externalRequestId, resourceId: "__GLOBAL__" as const };
    } catch (err) {
      await this.commandStore.markFailed(command.externalRequestId, err);
      throw err;
    }
  }
}
```

**Regras:**
- **5 args no construtor**: gateway, syncStore, commandStore, syncStateStore, options
- **`noWrite`**: Modo fake que apenas percorre páginas sem persistir (validação)
- **`updatedSince`**: Usa `lastSyncAt` do checkpoint para sincronia incremental
- **`fetchPageWithRetry`**: Resiliência a falhas com backoff exponencial
- **Pós-sync**: Atualiza checkpoint + confirma comando

### 2.2c Sync All Use Case com Hooks (SyncHooksRunner)

Para encadear **side-effects pós-sync** sem acoplar o use case a módulos específicos:

```typescript
// apps/api/src/modules/integration/nome-do-modulo/application/use-cases/sync-all-nome-do-modulo.usecase.ts
// Adicione no construtor e no execute:

import { SyncHooksRunner } from "@/shared/integration/strategies/sync-hooks";

export class SyncAllNomeDoModuloUseCase {
  constructor(
    /* ... existing args ... */
  ) {}

  async execute(
    command: SyncAllNomeDoModuloCommand,
    hooks?: SyncHooksRunner  // ← Opcional!
  ) {
    // ... existing sync logic ...

    // Executa hooks após marcar como confirmado
    await this.commandStore.markConfirmed(command.externalRequestId);

    if (hooks && hooks.any) {
      await hooks.runAll({ externalRequestId: command.externalRequestId });
    }
  }
}
```

**Uso no handler do job PgBoss:**

```typescript
const hooks = new SyncHooksRunner();

if (env.FORCE_SOME_REFRESH_ON_SYNC) {
  hooks.add({
    name: "refresh-some-read-model",
    execute: async () => {
      const useCase = new RefreshSomeReadModelUseCase(...);
      await useCase.execute();
    },
  });
}

await useCase.execute({ externalRequestId }, hooks);
```

**Regras:**
- `SyncHooksRunner` vem de `@/shared/integration/strategies/sync-hooks`
- Hooks são **opcionais** — o use case funciona sem eles
- Cada hook tem `name` (string) e `execute(context)` (async)
- Falha em um hook **não quebra** os demais (try/catch interno)
- Hooks rodam **após** o comando ser marcado como CONFIRMED

### 2.2d Lifecycle Gateway (confirm/fail)

Para comandos assíncronos que precisam de callback de confirmação/falha:

**Port** `application/ports/nome-do-modulo-lifecycle.gateway.ts`:

```typescript
export type NomeDoModuloLifecycleGateway = {
  confirm(externalRequestId: string): Promise<any | null>;
  fail(externalRequestId: string, err: { code: string; message: string }): Promise<any | null>;
};
```

**Fake** `infrastructure/gateways/lifecycle/fake-nome-do-modulo-lifecycle.gateway.ts`:
```typescript
export class FakeNomeDoModuloLifecycleGateway implements NomeDoModuloLifecycleGateway {
  async confirm(externalRequestId: string) {
    const store = new NomeDoModuloCommandStore(prisma);
    return store.markConfirmed(externalRequestId);
  }
  async fail(externalRequestId: string, err: { code: string; message: string }) {
    const store = new NomeDoModuloCommandStore(prisma);
    return store.markFailed(externalRequestId, err);
  }
}
```

**Real** `infrastructure/gateways/lifecycle/real-nome-do-modulo-lifecycle.gateway.ts`:
```typescript
export class RealNomeDoModuloLifecycleGateway implements NomeDoModuloLifecycleGateway {
  async confirm(externalRequestId: string) {
    const store = new NomeDoModuloCommandStore(prisma);
    return store.markConfirmed(externalRequestId);
  }
  async fail(externalRequestId: string, err: { code: string; message: string }) {
    const store = new NomeDoModuloCommandStore(prisma);
    return store.markFailed(externalRequestId, err);
  }
}
```

**Regras:**
- Callbacks HTTP (`/callbacks/:id/confirm`, `/fail`) são **fake-only** (retornam 405 em real)
- Em produção, o ERP gerencia o estado assincronamente
- O gateway real existe para uso interno (jobs/workers)
- Ambos (fake e real) delegam ao CommandStore — a diferença é logging

### 2.3 Store (DB) - `infrastructure/db/`

**Arquivo**: `nome-do-modulo-[tipo].store.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/db/nome-do-modulo-[tipo].store.ts

import type { PrismaClient, NomeDoModuloComando } from "@prisma/client";
import { Prisma } from "@prisma/client";

export type CriarComandoAceitoInput = {
  externalRequestId: string;
  codigo: string;
  tipoComando: "SINCRONIZAR" | "APLICAR" | "EXCLUIR";
  fonte?: "API2" | "JOB" | "ADMIN";
};

/**
 * Store responsável EXCLUSIVAMENTE por:
 * - idempotência por externalRequestId
 * - tracking de status (ACEITO | CONFIRMADO | FALHA)
 * - auditoria mínima de comandos
 */
export class NomeDoModuloComandoStore {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorExternalRequestId(
    externalRequestId: string
  ): Promise<NomeDoModuloComando | null> {
    return this.prisma.nomeDoModuloComando.findUnique({
      where: { externalRequestId },
    });
  }

  async obterOuCriarAceito(
    input: CriarComandoAceitoInput
  ): Promise<{ registro: NomeDoModuloComando; criado: boolean }> {
    const existente = await this.buscarPorExternalRequestId(input.externalRequestId);
    if (existente) {
      return { registro: existente, criado: false };
    }

    const registro = await this.prisma.nomeDoModuloComando.create({
      data: {
        externalRequestId: input.externalRequestId,
        codigo: input.codigo,
        tipoComando: input.tipoComando,
        status: "ACEITO",
        fonte: input.fonte ?? "API2",
        executadoEm: new Date(),
      },
    });

    return { registro, criado: true };
  }

  async marcarConfirmado(externalRequestId: string) {
    return this.prisma.nomeDoModuloComando.update({
      where: { externalRequestId },
      data: { status: "CONFIRMADO", confirmadoEm: new Date() },
    });
  }

  async marcarFalha(externalRequestId: string, erro: any) {
    return this.prisma.nomeDoModuloComando.update({
      where: { externalRequestId },
      data: {
        status: "FALHA",
        falhaEm: new Date(),
        mensagemErro: erro?.message || "Erro desconhecido",
      },
    });
  }
}

### 2.3b CommandStore com Command Queue — ⚠️ LEGADO (substituído por PgBoss)

> **⚠️ Este padrão foi substituído pela fila centralizada com PgBoss ([ADR-009](./DECISIONS.md)).**
> Apenas módulos não migrados ainda usam `enqueue`/`dequeue` com SKIP LOCKED.
> Módulos novos devem usar `getJobQueue().enqueue()` (ver seção 2.15).

Para operações que exigiam **rate-limit** contra o Omie, a variante com `enqueue`/`dequeue`.

> 📌 **Decisão arquitetural (legado)**: Consulte **[ADR-008](./DECISIONS.md)** para o racional completo deste padrão.

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/db/nome-do-modulo-command.store.ts
// NOVOS métodos para fila:

export type EnqueueCommandInput = {
  externalRequestId: string;
  commandType: "CRIAR" | "ATUALIZAR" | "SINCRONIZAR";
  payload?: Record<string, unknown>;
  source?: "API2" | "JOB" | "ADMIN";
};

export type StatusCounts = {
  pending: number;
  processing: number;
  confirmed: number;
  failed: number;
};

// ─── Enfileiramento ──────────────────────────────────────────────────
async enqueue(
  input: EnqueueCommandInput
): Promise<{ record: ProductionOrderCommand; created: boolean }> {
  const existing = await this.buscarPorExternalRequestId(input.externalRequestId);
  if (existing) return { record: existing, created: false };

  const record = await this.prisma.nomeDoModuloComando.create({
    data: {
      externalRequestId: input.externalRequestId,
      tipoComando: input.commandType,
      status: "PENDENTE",
      fonte: input.source ?? "API2",
      payload: input.payload ?? Prisma.DbNull,
    },
  });
  return { record, created: true };
}

// ─── Dequeuing atômico (FOR UPDATE SKIP LOCKED) ────────────────────
async dequeue(batchSize = 1): Promise<ProductionOrderCommand[]> {
  const rows: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
    `SELECT id FROM integration.nome_do_modulo_comando
     WHERE status = 'PENDENTE'
     ORDER BY created_at ASC
     LIMIT $1
     FOR UPDATE SKIP LOCKED`,
    batchSize
  );
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  await this.prisma.nomeDoModuloComando.updateMany({
    where: { id: { in: ids } },
    data: { status: "PROCESSANDO", executadoEm: new Date() },
  });

  return this.prisma.nomeDoModuloComando.findMany({
    where: { id: { in: ids } },
    orderBy: { createdAt: "asc" },
  });
}

// ─── Transições ─────────────────────────────────────────────────────
async marcarConfirmado(externalRequestId: string) { /* ... */ }
async marcarFalha(externalRequestId: string, erro: unknown) { /* ... */ }

// ─── Consultas ──────────────────────────────────────────────────────
async contarPorStatusAll(): Promise<StatusCounts> { /* ... */ }
async listarRecentes(limit = 20): Promise<ProductionOrderCommand[]> { /* ... */ }
async listarFalhas(limit = 20): Promise<ProductionOrderCommand[]> { /* ... */ }
```

### 2.3c QueryStore (Leitura do Espelho Local)

Para consultas READ no espelho local (ex: `omie_production_order`), use um QueryStore:

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/db/nome-do-modulo-query.store.ts

import type { PrismaClient } from "@prisma/client";

export type NomeDoModuloListFilters = {
  ativo?: boolean;
  concluido?: boolean;
  codigo?: string;
};

export type NomeDoModuloListResult = {
  id: string;
  codigo: string;
  // ... campos do espelho
  ultimaSincronizacao: string;
};

export type NomeDoModuloDetailResult = NomeDoModuloListResult & {
  itens: Array<{ /* ... */ }>;
};

export type NomeDoModuloStatsResult = {
  total: number;
  ativos: number;
  concluidos: number;
};

export class NomeDoModuloQueryStore {
  constructor(private readonly prisma: PrismaClient) {}

  async listar(pagina = 1, limite = 20, filtros?: NomeDoModuloListFilters) {
    const skip = (pagina - 1) * limite;
    const where: any = {};
    if (filtros?.ativo !== undefined) where.ativo = filtros.ativo;
    if (filtros?.codigo) where.codigo = filtros.codigo;

    const [itens, total] = await this.prisma.$transaction([
      this.prisma.omieEntidade.findMany({
        where, skip, take: limite, orderBy: { ultimaSincronizacao: "desc" },
      }),
      this.prisma.omieEntidade.count({ where }),
    ]);

    return {
      itens: itens.map(mapper),
      total, pagina, limite,
    };
  }

  async obterPorCodigo(codigo: string): Promise<NomeDoModuloDetailResult | null> {
    const registro = await this.prisma.omieEntidade.findUnique({
      where: { codigo },
      include: { itens: true },
    });
    if (!registro) return null;
    return mapperDetalhe(registro);
  }

  async obterStats(): Promise<NomeDoModuloStatsResult> {
    const [total, ativos, concluidos] = await Promise.all([
      this.prisma.omieEntidade.count(),
      this.prisma.omieEntidade.count({ where: { ativo: true } }),
      this.prisma.omieEntidade.count({ where: { concluido: true } }),
    ]);
    return { total, ativos, concluidos };
  }
}
```
```

### 2.4 Gateway Real - `infrastructure/gateways/[ação]/`

**Arquivo**: `real-nome-do-modulo-[ação].gateway.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/gateways/[açao]/real-nome-do-modulo-[açao].gateway.ts

import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
  NomeDoModuloAcaoGateway,
  NomeDoModuloAcaoItem,
  NomeDoModuloAcaoResult,
} from "../../../application/ports/nome-do-modulo-[açao].gateway";

export class RealNomeDoModuloAcaoGateway implements NomeDoModuloAcaoGateway {
  constructor(private readonly clienteOmie: OmieHttpClientPort) {}

  async executar(codigo: string, itens: NomeDoModuloAcaoItem[]): Promise<NomeDoModuloAcaoResult> {
    // 1) Consulta estado atual no Omie
    const atual = await this.clienteOmie.post<any>("endpoint/omie/", {
      call: "ConsultarEndpoint",
      param: [{ codigo_item: codigo }],
    });

    const existe = Array.isArray(atual?.itens) && atual.itens.length > 0;

    // 2) Decide método Omie (Incluir vs Alterar)
    const metodo = existe ? "AlterarEndpoint" : "IncluirEndpoint";

    // 3) Monta payload para Omie (preservar nomes originais)
    const payload = {
      codigo_item: codigo,
      itens: itens.map((item) => ({
        codigo_componente: item.id,
        quantidade: item.quantidade,
        unidade: item.unidade,
      })),
    };

    const resposta = await this.clienteOmie.post<any>("endpoint/omie/", {
      call: metodo,
      param: [payload],
    });

    return {
      sucesso: true,
      codigo,
      payloadBruto: resposta,
    };
  }
}
```

### 2.5 Gateway Fake - `infrastructure/gateways/[ação]/`

**Arquivo**: `fake-nome-do-modulo-[ação].gateway.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/gateways/[açao]/fake-nome-do-modulo-[açao].gateway.ts

import type {
  NomeDoModuloAcaoGateway,
  NomeDoModuloAcaoItem,
  NomeDoModuloAcaoResult,
} from "../../../application/ports/nome-do-modulo-[açao].gateway";

export class FakeNomeDoModuloAcaoGateway implements NomeDoModuloAcaoGateway {
  private simulacoes: Map<string, any[]> = new Map();

  async executar(codigo: string, itens: NomeDoModuloAcaoItem[]): Promise<NomeDoModuloAcaoResult> {
    // Simula delay de rede
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Armazena simulação em memória
    this.simulacoes.set(codigo, itens);

    console.log(`[FAKE] Executado ${itens.length} itens para código ${codigo}`);

    return {
      sucesso: true,
      codigo,
      payloadBruto: {
        codigo_status: "0",
        descricao_status: "Operação realizada com sucesso (FAKE)",
        itens_aplicados: itens.length,
      },
    };
  }

  // Método auxiliar para testes
  obterSimulacao(codigo: string): any[] | undefined {
    return this.simulacoes.get(codigo);
  }
}
```

### 2.5b Consult Gateway - `infrastructure/gateways/consult/`

Para consultar um **registro individual ao vivo** no Omie. Diferente do gateway de ação, o Consult Gateway:
- Usa `OmieClientWithCircuitBreaker` (não `OmieHttpClientPort`)
- É **síncrono** (sem fila)
- Retorna dados frescos diretamente da API Omie

**Port** `application/ports/nome-do-modulo-consult.gateway.ts`:

```typescript
// apps/api/src/modules/integration/nome-do-modulo/application/ports/nome-do-modulo-consult.gateway.ts

export type NomeDoModuloConsultResult = {
  omieCode: string;
  orderNumber?: string;
  internalCode?: string;
  productCode?: number;
  quantity: number;
  stage?: string;
  completed: boolean;
  forecastDate?: string | null;
  completionDate?: string | null;
  startDate?: string | null;
  rawPayload: any;
};

export interface NomeDoModuloConsultGateway {
  consult(codigo: string): Promise<NomeDoModuloConsultResult | null>;
}
```

**Real** `infrastructure/gateways/consult/real-nome-do-modulo-consult.gateway.ts`:

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/gateways/consult/real-nome-do-modulo-consult.gateway.ts

import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import type { NomeDoModuloConsultGateway, NomeDoModuloConsultResult } from "../../../application/ports/nome-do-modulo-consult.gateway";

export class RealNomeDoModuloConsultGateway implements NomeDoModuloConsultGateway {
  constructor(private readonly omieClient: OmieClientWithCircuitBreaker) {}

  async consult(codigo: string): Promise<NomeDoModuloConsultResult | null> {
    const response = await this.omieClient.post<any>("endpoint/omie/", {
      call: "ConsultarEndpoint",
      param: [{ codigo: Number(codigo) }],
    });

    if (!response?.codigo_status || response.codigo_status !== "0") {
      return null;
    }

    return mapNomeDoModulo(response); // mapper específico do módulo
  }
}
```

**Fake** `infrastructure/gateways/consult/fake-nome-do-modulo-consult.gateway.ts`:

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/gateways/consult/fake-nome-do-modulo-consult.gateway.ts

import { prisma } from "@/shared/db/prisma";
import type { NomeDoModuloConsultGateway, NomeDoModuloConsultResult } from "../../../application/ports/nome-do-modulo-consult.gateway";

export class FakeNomeDoModuloConsultGateway implements NomeDoModuloConsultGateway {
  async consult(codigo: string): Promise<NomeDoModuloConsultResult | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const record = await prisma.omieEntidade.findUnique({
      where: { codigo },
    });
    if (!record) return null;
    return {
      omieCode: codigo,
      quantity: Number(record.quantidade ?? 0),
      completed: false,
      rawPayload: record,
    };
  }
}
```

**Regras:**
- Port fica em `application/ports/` (não em `infrastructure/gateways/`)
- Fake consulta **banco local** (espelho Omie) — não simula em memória
- Real usa `OmieClientWithCircuitBreaker` com retry e circuit breaker

### 2.6 Job - `infrastructure/jobs/`

**Arquivo**: `[ação]-nome-do-modulo.job.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/jobs/[açao]-nome-do-modulo.job.ts

import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { NomeDoModuloAcaoUseCase } from "../../application/use-cases/[açao]-nome-do-modulo.usecase";
import { RealNomeDoModuloAcaoGateway } from "../gateways/[açao]/real-nome-do-modulo-[açao].gateway";
import { NomeDoModuloStore } from "../db/nome-do-modulo.store";
import { NomeDoModuloComandoStore } from "../db/nome-do-modulo-command.store";

export class NomeDoModuloAcaoJob {
  constructor(
    private readonly useCase: NomeDoModuloAcaoUseCase
  ) {}

  async executar() {
    try {
      logger.info("Iniciando job de [ação] nome-do-modulo");

      // Lógica do job: buscar itens pendentes, processar, etc.
      const itensParaProcessar = []; // Buscar do banco ou outra fonte
      
      for (const item of itensParaProcessar) {
        await this.useCase.executar({
          externalRequestId: `job-${Date.now()}-${item.codigo}`,
          codigo: item.codigo,
          itens: item.itens,
          fonte: "JOB",
        });
      }

      logger.info("Job de [ação] nome-do-modulo concluído", {
        processados: itensParaProcessar.length,
      });
    } catch (erro) {
      logger.error("Falha no job de [ação] nome-do-modulo", { erro });
      throw erro;
    }
  }
}

// Função factory para criar job
export function criarNomeDoModuloAcaoJob(
  omieClient: OmieHttpClientPort
): NomeDoModuloAcaoJob {
  // Construir use case com gateways e stores
  const gateway = new RealNomeDoModuloAcaoGateway(omieClient);
  const store = new NomeDoModuloStore(prisma);
  const commandStore = new NomeDoModuloComandoStore(prisma);
  
  const useCase = new NomeDoModuloAcaoUseCase(gateway, store, commandStore);
  return new NomeDoModuloAcaoJob(useCase);
}

### 2.6a Sync All Job (Incremental) - `infrastructure/jobs/`

Para jobs que sincronizam **todos os registros** com checkpoint incremental:

**Arquivo**: `sync-all-nome-do-modulo.job.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/jobs/sync-all-nome-do-modulo.job.ts

import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { env } from "@/config";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";

import { NomeDoModuloCommandStore } from "../db/nome-do-modulo-command.store";
import { NomeDoModuloStore } from "../db/nome-do-modulo.store";
import { SyncAllNomeDoModuloUseCase } from "../../application/use-cases/sync-all-nome-do-modulo.usecase";
import { FakeNomeDoModuloSyncPageGateway } from "../gateways/sync-page/fake-nome-do-modulo-sync-page.gateway";
import { RealNomeDoModuloSyncPageGateway } from "../gateways/sync-page/real-nome-do-modulo-sync-page.gateway";

type ExecuteInput = {
  source: "JOB";
  omieClient: OmieHttpClientPort;
};

export class SyncAllNomeDoModuloJob {
  static async execute({ source, omieClient }: ExecuteInput): Promise<void> {
    const logger = getLogger("nome-do-modulo:sync-job");

    const isFake = env.NOME_DO_MODULO_GATEWAY === "fake";

    const fetchPageGateway = isFake
      ? new FakeNomeDoModuloSyncPageGateway()
      : new RealNomeDoModuloSyncPageGateway(omieClient);

    const syncStateStore = new PrismaSyncStateStore(
      prisma.nomeDoModuloSyncState,
      "GLOBAL"
    );

    const useCase = new SyncAllNomeDoModuloUseCase(
      fetchPageGateway,
      new NomeDoModuloStore(prisma),
      new NomeDoModuloCommandStore(prisma),
      syncStateStore,
      { noWrite: isFake }
    );

    const externalRequestId = `nome-do-modulo-sync-${Date.now()}`;

    logger.info("Syncing nome-do-modulo", { source, gatewayMode: isFake ? "fake" : "real" });
    await useCase.execute({ externalRequestId, source: "JOB" });
    logger.info("Finished sync job", { externalRequestId });
  }
}
```

**Regras:**
- **5 args no construtor** do use case: `fetchPageGateway`, `syncStore`, `commandStore`, `syncStateStore`, `options`
- Usa `PrismaSyncStateStore` compartilhado de `@/shared/integration/strategies/sync-state.store`
- `noWrite = isFake`: em modo fake apenas valida sem persistir

### 2.6b Queue Processor Job — ⚠️ LEGADO (substituído por PgBoss)

> **⚠️ Este padrão foi substituído pelo worker centralizado com PgBoss ([ADR-009](./DECISIONS.md)).**
> Apenas módulos não migrados ainda precisam deste job.
> Módulos novos usam o `integration.worker.ts` único.

Para jobs que processavam uma **fila de comandos** com rate-limit contra o Omie (legado):

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/jobs/process-nome-do-modulo-queue.job.ts

import { createJobLock } from "@/shared/utils/job-lock";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { NomeDoModuloComandoStore } from "../db/nome-do-modulo-command.store";

const logger = getLogger("process-nome-do-modulo-queue");
const LOCK_KEY = "nome-do-modulo-queue-processor";
const LOCK_TTL_MS = 60000;

export class ProcessNomeDoModuloQueueJob {
  static async execute() {
    const lock = createJobLock(LOCK_KEY, LOCK_TTL_MS);
    const acquired = await lock.acquire();
    if (!acquired) {
      logger.info("Queue processor já está rodando em outra instância");
      return;
    }

    try {
      const commandStore = new NomeDoModuloComandoStore(prisma);
      const renewInterval = setInterval(() => lock.renew(), 30000);

      try {
        while (true) {
          const [command] = await commandStore.dequeue(1);
          if (!command) break;

          logger.info("Processando comando", {
            externalRequestId: command.externalRequestId,
            tipo: command.tipoComando,
          });

          try {
            await executarComando(command);
            await commandStore.marcarConfirmado(command.externalRequestId);
          } catch (error) {
            await commandStore.marcarFalha(command.externalRequestId, error);
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } finally {
        clearInterval(renewInterval);
      }
    } finally {
      await lock.release();
    }
  }
}
```

**Regras (legado):**
- Usa `createJobLock` para garantir singleton entre workers
- `dequeue(1)` usa `FOR UPDATE SKIP LOCKED` — atômico e sem lock em tabela
- `sleep(1000)` entre comandos respeita rate-limit do Omie
- Lock renovado a cada 30s (TTL = 60s)
- Registrado via cron `* * * * * *` (a cada 1 segundo)

> ⚠️ **Módulos migrados para PgBoss removem este job e o cron `* * * * * *` correspondente.**

### 2.7 Job Register - `infrastructure/jobs/`

**Arquivo**: `nome-do-modulo-jobs.register.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/jobs/nome-do-modulo-jobs.register.ts

import cron from "node-cron";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { criarNomeDoModuloAcaoJob } from "./[açao]-nome-do-modulo.job";

export function registerNomeDoModuloJobs(omieClient: OmieHttpClientPort) {
  const logger = getLogger("nome-do-modulo:cron");

  // Job agendado (se habilitado no .env)
  if (process.env.ENABLE_OMIE_NOME_DO_MODULO_ACAO_JOB === "true") {
    const schedule = process.env.OMIE_NOME_DO_MODULO_ACAO_CRON || "0 */5 * * * *";
    
    cron.schedule(schedule, async () => {
      const runLogger = getLogger("nome-do-modulo:cron:run");
      runLogger.info("Starting [ação] nome-do-modulo job");

      try {
        const job = criarNomeDoModuloAcaoJob(omieClient);
        await job.executar();
        runLogger.info("Finished [ação] nome-do-modulo job");
      } catch (error) {
        runLogger.error("[Ação] nome-do-modulo job failed", error);
      }
    });

    logger.info("[Ação] nome-do-modulo job registered", { schedule });
  }

  // Job único (execução imediata)
  if (process.env.EXECUTE_OMIE_NOME_DO_MODULO_ACAO_JOB_ON_START === "true") {
    logger.info("Executing [ação] nome-do-modulo job on start");
    
    setTimeout(async () => {
      try {
        const job = criarNomeDoModuloAcaoJob(omieClient);
        await job.executar();
        logger.info("Initial [ação] nome-do-modulo job executed successfully");
      } catch (error) {
        logger.error("Initial [ação] nome-do-modulo job failed", error);
      }
    }, 5000); // Delay de 5 segundos após startup
  }
}
```

### 2.8 Route (Command) - `presentation/http/routes/commands/`

**Arquivo**: `[ação]-nome-do-modulo.route.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/presentation/http/routes/commands/[açao]-nome-do-modulo.route.ts

import type { FastifyInstance } from "fastify";

// Importe stores
import { NomeDoModuloStore } from "../../../../../infrastructure/db/nome-do-modulo.store";
import { NomeDoModuloComandoStore } from "../../../../../infrastructure/db/nome-do-modulo-command.store";

// Importe gateways (real/fake)
import { RealNomeDoModuloAcaoGateway } from "../../../../../infrastructure/gateways/[açao]/real-nome-do-modulo-[açao].gateway";
import { FakeNomeDoModuloAcaoGateway } from "../../../../../infrastructure/gateways/[açao]/fake-nome-do-modulo-[açao].gateway";

// Importe use case
import { NomeDoModuloAcaoUseCase } from "../../../../../application/use-cases/[açao]-nome-do-modulo.usecase";

export function registerNomeDoModuloAcaoRoute(app: FastifyInstance) {
  // ⚠️ IMPORTANTE: Injeção de dependência via app
  // O projeto injeta omieClient via bootstrap (app.omieClient), evitando singleton global.
  // NÃO importe omieHttpClient globalmente - use app.omieClient.
  app.post(
    "/v1/integration/nome-do-modulo/commands/:codigo/[açao]",
    {
      schema: {
        tags: ["nome-do-modulo"],
        summary: "[Descrição da ação]",
        description: "Comando de integração: [descrição detalhada]. Real é idempotente.",
        params: {
          type: "object",
          required: ["codigo"],
          properties: { codigo: { type: "string" } },
        },
        body: {
          type: "object",
          required: ["externalRequestId", "dados"],
          properties: {
            externalRequestId: { type: "string" },
            dados: {
              type: "object",
              required: ["itens"],
              properties: {
                itens: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["id", "quantidade"],
                    properties: {
                      id: { type: "string" },
                      quantidade: { type: ["string", "number"] },
                      unidade: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        response: {
          202: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ACEITO"] },
              externalRequestId: { type: "string" },
            },
          },
          200: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["CONFIRMADO"] },
              externalRequestId: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { codigo } = request.params as { codigo: string };
      const { externalRequestId, dados } = request.body as {
        externalRequestId: string;
        dados: { itens: any[] };
      };

      // Configura gateway (real/fake)
      const gateway =
        process.env.NOME_DO_MODULO_GATEWAY === "real"
          ? new RealNomeDoModuloAcaoGateway(app.omieClient)
          : new FakeNomeDoModuloAcaoGateway();

      // Cria stores
      const prisma = request.server.prisma;
      const store = new NomeDoModuloStore(prisma);
      const commandStore = new NomeDoModuloComandoStore(prisma);

      // Cria use case
      const useCase = new NomeDoModuloAcaoUseCase(gateway, store, commandStore);

      // Executa comando
      const resultado = await useCase.executar({
        externalRequestId,
        codigo,
        itens: dados.itens,
        fonte: "API2",
      });

      // Retorna resposta apropriada
      if (resultado.status === "ACEITO") {
        return reply.status(202).send(resultado);
      }

      return reply.send(resultado);
    }
  );
}
```

### 2.9 Route (Command) — Path Padrão com `/commands/{comando}`

> ⚠️ A rota de comando deve usar o path canônico `/commands/{comando}`:
> ```typescript
> app.post("/v1/integration/nome-do-modulo/commands/:codigo/[açao]", ...)
> ```
> **Não use** o padrão antigo `/:codigo/[açao]` (que parece CRUD).

### 2.9b Callback Route - `presentation/http/routes/callbacks/`

**Arquivo**: `confirm-[modelo].callback.route.ts`

Callbacks são **respostas que entram no sistema** — confirmam ou falham
um comando previamente enfileirado. Diferente de commands, callbacks
**não enfileiram** e **não geram novo `externalRequestId`**.

```typescript
// apps/api/src/modules/integration/nome-do-modulo/presentation/http/routes/callbacks/confirm-[modelo].callback.route.ts

import type { FastifyInstance } from "fastify";
import { NomeDoModuloComandoStore } from "../../../../../infrastructure/db/nome-do-modulo-command.store";

export function registerConfirmModeloCallbackRoute(app: FastifyInstance) {
  app.post(
    "/v1/integration/nome-do-modulo/callbacks/:externalRequestId/confirm",
    {
      schema: {
        tags: ["nome-do-modulo"],
        summary: "Confirmar comando (callback)",
        description: "Callback para confirmar a execução de um comando previamente enfileirado.",
        params: {
          type: "object",
          required: ["externalRequestId"],
          properties: { externalRequestId: { type: "string" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["CONFIRMED"] },
              externalRequestId: { type: "string" },
            },
          },
          404: {
            type: "object",
            properties: { message: { type: "string" } },
          },
        },
      },
    },
    async (request, reply) => {
      const { externalRequestId } = request.params as { externalRequestId: string };
      const commandStore = new NomeDoModuloComandoStore(request.server.prisma);

      const command = await commandStore.buscarPorExternalRequestId(externalRequestId);
      if (!command) {
        return reply.status(404).send({ message: "Comando não encontrado" });
      }

      await commandStore.marcarConfirmado(externalRequestId);

      return reply.send({ status: "CONFIRMED" as const, externalRequestId });
    }
  );
}
```

**Arquivo**: `fail-[modelo].callback.route.ts` (mesmo padrão):

```typescript
export function registerFailModeloCallbackRoute(app: FastifyInstance) {
  app.post(
    "/v1/integration/nome-do-modulo/callbacks/:externalRequestId/fail",
    {
      schema: {
        tags: ["nome-do-modulo"],
        summary: "Falhar comando (callback)",
        params: {
          type: "object",
          required: ["externalRequestId"],
          properties: { externalRequestId: { type: "string" } },
        },
        body: {
          type: "object",
          properties: { error: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      const { externalRequestId } = request.params as { externalRequestId: string };
      const { error } = request.body as { error?: string };
      const commandStore = new NomeDoModuloComandoStore(request.server.prisma);

      const command = await commandStore.buscarPorExternalRequestId(externalRequestId);
      if (!command) {
        return reply.status(404).send({ message: "Comando não encontrado" });
      }

      await commandStore.marcarFalha(externalRequestId, error ? new Error(error) : undefined);

      return reply.send({ status: "FAILED" as const, externalRequestId, error });
    }
  );
}
```

**Regras para Callbacks:**
- **Não** exigem `externalRequestId` no body (vem no path)
- **Não** enfileiram — atualizam comando existente diretamente
- Retornam `200 OK` (processamento imediato, sem fila)
- Prontos para webhooks futuros do Omie

---

### 2.9c Route (Read) - `presentation/http/routes/read/`

**Arquivo**: `get-[modelo]-read-model.route.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/presentation/http/routes/read/get-[modelo]-read-model.route.ts

import type { FastifyInstance } from "fastify";

// Importe use case de leitura
import { ObterModeloLeituraUseCase } from "../../../../../application/use-cases/obter-[modelo]-leitura.usecase";

// Importe store
import { NomeDoModuloStore } from "../../../../../infrastructure/db/nome-do-modulo.store";

export function registerGetModeloReadModelRoute(app: FastifyInstance) {
  app.get(
    "/v1/integration/nome-do-modulo/read/:codigo/[modelo]",
    {
      schema: {
        tags: ["nome-do-modulo"],
        summary: "Obter [modelo] de leitura",
        description: "Consulta rápida do [modelo] para exibição na UI.",
        params: {
          type: "object",
          required: ["codigo"],
          properties: { codigo: { type: "string" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              codigo: { type: "string" },
              // Defina propriedades do modelo
            },
          },
          404: {
            type: "object",
            properties: {
              mensagem: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { codigo } = request.params as { codigo: string };

      const prisma = request.server.prisma;
      const store = new NomeDoModuloStore(prisma);
      const useCase = new ObterModeloLeituraUseCase(store);

      const modelo = await useCase.executar(codigo);

      if (!modelo) {
        return reply.status(404).send({ mensagem: "Modelo não encontrado" });
      }

      return reply.send(modelo);
    }
  );
}
```

### 2.9d Route (Read) com Gateway Pattern - `presentation/http/routes/read/`

Para consultas que usam o **espelho local** via Gateway Pattern (Real/Fake) e QueryStore:

```typescript
// Port: application/ports/nome-do-modulo-query.gateway.ts
export interface NomeDoModuloQueryGateway {
  listar(page: number, limit: number, filters?: Record<string, unknown>)
    : Promise<{ itens: any[]; total: number; pagina: number; limite: number }>;
  obterPorCodigo(codigo: string): Promise<any | null>;
  obterStats(): Promise<{ total: number; ativos: number; concluidos: number }>;
}

// Real Gateway: infrastructure/gateways/read/real-nome-do-modulo-query.gateway.ts
import { NomeDoModuloQueryStore } from "../../db/nome-do-modulo-query.store";

export class RealNomeDoModuloQueryGateway implements NomeDoModuloQueryGateway {
  constructor(private readonly queryStore: NomeDoModuloQueryStore) {}
  async listar(page, limit, filters?) { return this.queryStore.listar(page, limit, filters); }
  async obterPorCodigo(codigo) { return this.queryStore.obterPorCodigo(codigo); }
  async obterStats() { return this.queryStore.obterStats(); }
}

// Seleção na rota (switch real/fake):
const queryGateway: NomeDoModuloQueryGateway =
  process.env.NOME_DO_MODULO_GATEWAY === "real"
    ? new RealNomeDoModuloQueryGateway(new NomeDoModuloQueryStore(prisma))
    : new FakeNomeDoModuloQueryGateway();
```

**Implementação completa da rota de listagem:**

```typescript
export function registerListNomeDoModuloRoute(app: FastifyInstance) {
  app.get("/v1/integration/nome-do-modulo/read", {
    schema: {
      tags: ["nome-do-modulo"],
      summary: "Listar registros (espelho local)",
      querystring: {
        type: "object",
        properties: {
          pagina: { type: "integer", default: 1 },
          limite: { type: "integer", default: 20 },
          ativo: { type: "boolean" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            itens: { type: "array" },
            total: { type: "integer" },
            pagina: { type: "integer" },
            limite: { type: "integer" },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { pagina = 1, limite = 20, ativo } = request.query as any;
    const prisma = request.server.prisma;
    const gateway: NomeDoModuloQueryGateway =
      process.env.NOME_DO_MODULO_GATEWAY === "real"
        ? new RealNomeDoModuloQueryGateway(new NomeDoModuloQueryStore(prisma))
        : new FakeNomeDoModuloQueryGateway();
    return reply.send(await gateway.listar(pagina, limite, { ativo }));
  });
}
```

### 2.9e Refresh Route (Read + Sync) - `presentation/http/routes/read/`

Para rotas que consultam um registro **ao vivo no Omie** e atualizam o espelho local:

**Arquivo**: `get-nome-do-modulo-refresh.route.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/presentation/http/routes/read/get-nome-do-modulo-refresh.route.ts

import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";
import { createOmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import { NomeDoModuloStore } from "../../../../infrastructure/db/nome-do-modulo.store";
import { RealNomeDoModuloConsultGateway } from "../../../../infrastructure/gateways/consult/real-nome-do-modulo-consult.gateway";
import { FakeNomeDoModuloConsultGateway } from "../../../../infrastructure/gateways/consult/fake-nome-do-modulo-consult.gateway";

const logger = getLogger("get-nome-do-modulo-refresh.route");

export async function registerGetNomeDoModuloRefreshRoute(app: FastifyInstance) {
  app.get(
    "/v1/integration/read/nome-do-modulo/:codigo/refresh",
    async (request, reply) => {
      const { codigo } = request.params as { codigo: string };

      const isFake = env.NOME_DO_MODULO_GATEWAY === "fake";

      const consultGateway = isFake
        ? new FakeNomeDoModuloConsultGateway()
        : new RealNomeDoModuloConsultGateway(
            createOmieClientWithCircuitBreaker({
              baseUrl: env.OMIE_BASE_URL,
              appKey: env.OMIE_APP_KEY,
              appSecret: env.OMIE_APP_SECRET,
              timeoutMs: 10000,
              retry: { attempts: 2, baseDelayMs: 1000, maxDelayMs: 3000 },
              circuitBreaker: {
                failureThreshold: 3,
                resetTimeoutMs: 30000,
                successThreshold: 2,
              },
            })
          );

      const freshData = await consultGateway.consult(codigo);
      if (!freshData) {
        return reply.code(404).send({ success: false, error: "NOT_FOUND" });
      }

      // Atualiza o espelho local (apenas em modo real)
      if (!isFake) {
        const syncStore = new NomeDoModuloStore(prisma);
        await syncStore.save(freshData);
      }

      return reply.code(200).send({ success: true, data: freshData });
    }
  );
}
```

**Regras:**
- **GET** (não POST) — o usuário quer o dado agora
- **Síncrona** — sem fila, consulta Omie ao vivo
- **Em fake**: consulta o banco local e retorna (sem persistir)
- **Em real**: consulta Omie, atualiza espelho local, retorna dados frescos

### 2.10 Routes Index - `presentation/http/routes/`

**Arquivo**: `index.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/presentation/http/routes/index.ts

import type { FastifyInstance } from "fastify";

// Importe todas as rotas de comando
import { registerNomeDoModuloAcaoRoute } from "./commands/[açao]-nome-do-modulo.route";
import { registerNomeDoModuloOutraAcaoRoute } from "./commands/[outra-açao]-nome-do-modulo.route";

// Importe todas as rotas de callback
import { registerConfirmModeloCallbackRoute } from "./callbacks/confirm-[modelo].callback.route";
import { registerFailModeloCallbackRoute } from "./callbacks/fail-[modelo].callback.route";

// Importe todas as rotas de leitura
import { registerGetModeloReadModelRoute } from "./read/get-[modelo]-read-model.route";
import { registerGetNomeDoModuloRefreshRoute } from "./read/get-nome-do-modulo-refresh.route";

export function registerNomeDoModuloRoutes(app: FastifyInstance) {
  // Registra rotas de comando
  registerNomeDoModuloAcaoRoute(app);
  registerNomeDoModuloOutraAcaoRoute(app);
  
  // Registra rotas de callback
  registerConfirmModeloCallbackRoute(app);
  registerFailModeloCallbackRoute(app);
  
  // Registra rotas de leitura
  registerGetModeloReadModelRoute(app);
  registerGetNomeDoModuloRefreshRoute(app);
}
```

### 2.11 Routes Main - `presentation/http/`

**Arquivo**: `routes.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/presentation/http/routes.ts

import type { FastifyInstance } from "fastify";
import { registerNomeDoModuloRoutes } from "./routes/index";

export async function nomeDoModuloIntegrationRoutes(app: FastifyInstance) {
  registerNomeDoModuloRoutes(app);
}
```

### 2.12 Presentation Index - `presentation/http/`

**Arquivo**: `index.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/presentation/http/index.ts

export { rotasIntegracaoNomeDoModulo } from "./routes";
```

### 2.13 Module Register

**Arquivo**: `nome-do-modulo-integration-register.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/nome-do-modulo-integration-register.ts

import type { FastifyInstance } from "fastify";
import { nomeDoModuloIntegrationRoutes } from "./presentation/http/routes";
import { registerNomeDoModuloJobs } from "./infrastructure/jobs/nome-do-modulo-jobs.register";

export function createNomeDoModuloIntegration() {
  return {
    name: "nome-do-modulo-integration",
    register: (app: FastifyInstance) => {
      // Registra rotas HTTP
      app.register(nomeDoModuloIntegrationRoutes);
      
      // Registra jobs agendados (passa omieClient injetado via bootstrap)
      registerNomeDoModuloJobs(app.omieClient);
    }
  };
}
```

### 2.14 Module Index

**Arquivo**: `index.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/index.ts

export { criarIntegracaoNomeDoModulo } from "./nome-do-modulo-integration-register";
```

**⚠️ IMPORTANTE: Por que index.ts só exporta o register?**
O arquivo `index.ts` do módulo exporta **apenas** a função de registro (`criarIntegracaoNomeDoModulo`) para evitar **double registration** de rotas ao usar barrel imports. Isso garante que cada módulo seja registrado exatamente uma vez no bootstrap, prevenindo erros de rotas duplicadas e garantindo a inicialização correta da aplicação.

### 2.15 Enfileirando Jobs via PgBoss (NOVO PADRÃO)

> 📌 **Decisão arquitetural**: Consulte **[ADR-009](./DECISIONS.md#-adr-009--job-queue-centralizada-com-pgboss)**.

Para módulos **novos** (ou migrados), substitua o CommandStore + Queue Processor por:

```typescript
// No use-case ou na rota de comando:
import { getJobQueue } from "@/shared/infra/job-queue";

await getJobQueue().enqueue("nome-do-modulo.sync", {
  type: "nome-do-modulo.sync",
  payload: { externalRequestId, /* ... */ },
  options: { retryLimit: 5, retryBackoff: true },
});
```

**Regras:**
- Apenas **COMMANDs** (não GETs) passam pela fila
- O `externalRequestId` continua obrigatório para idempotência
- Retry com backoff exponencial é nativo do PgBoss (sem `findProcessingStalled`)
- O worker centralizado `integration.worker.ts` roteia por `type` e executa o handler
- NÃO criar job `*_QUEUE_JOB` nem cron `*_QUEUE_CRON` — o PgBoss é event-driven

**Handlers registrados no integration.worker.ts:**
```typescript
// apps/api/src/modules/integration/jobs/integration.worker.ts

worker.register("nome-do-modulo.sync", async (job) => {
  const useCase = container.resolve(SyncNomeDoModuloUseCase);
  await useCase.execute(job.data.payload);
});

worker.register("outro-modulo.action", async (job) => {
  // ...
});
```

**Quando NÃO usar PgBoss:**
- **GET** — consultas são sempre síncronas
- **Comandos que não chamam Omie** — execução síncrona imediata
- **Callbacks** (`/callbacks/:id/confirm`) — são respostas imediatas, não passam por fila

## 3. Configuração do Ambiente

### 3.1 Variáveis de Ambiente (`.env`)
Adicione ao `apps/api/.env`:

```env
# Gateway (fake/real) - padrão canônico: {MODULO}_GATEWAY
NOME_DO_MODULO_GATEWAY=fake  # desenvolvimento
# NOME_DO_MODULO_GATEWAY=real  # produção

# Jobs agendados (padrão canônico: ENABLE_OMIE_*)
ENABLE_OMIE_NOME_DO_MODULO_ACAO_JOB=false
OMIE_NOME_DO_MODULO_ACAO_CRON=0 */5 * * * *
EXECUTE_OMIE_NOME_DO_MODULO_ACAO_JOB_ON_START=false

# Queue Processor (Command Queue Pattern - ADR-008) ⚠️ LEGADO
# Apenas para módulos não migrados. Módulos novos usam PgBoss (não precisam destas vars).
ENABLE_OMIE_NOME_DO_MODULO_QUEUE_JOB=true
OMIE_NOME_DO_MODULO_QUEUE_CRON=* * * * * *

# PgBoss (Job Queue Centralizada - ADR-009)
# Geralmente configurado globalmente, não por módulo.
# PG_BOSS_CONNECTION_STRING=postgresql://...
# PG_BOSS_CONCURRENCY=3
```

### 3.2 Schema do Prisma
Adicione ao `apps/api/prisma/schema.prisma`:

```prisma
model NomeDoModuloComando {
  id                 String   @id @default(cuid())
  externalRequestId  String   @unique
  codigo             String
  tipoComando        String   // "SINCRONIZAR", "APLICAR", "EXCLUIR"
  status             String   // "ACEITO", "CONFIRMADO", "FALHA"
  fonte              String   // "API2", "JOB", "ADMIN"
  executadoEm        DateTime
  confirmadoEm       DateTime?
  falhaEm            DateTime?
  mensagemErro       String?
  
  @@map("nome_do_modulo_comando")
}

model NomeDoModuloIntegracao {
  id        String   @id @default(cuid())
  codigo    String   @unique
  dados     Json
  atualizadoEm DateTime @updatedAt
  
  @@map("nome_do_modulo_integracao")
}

model NomeDoModuloSyncState {
  id            String   @id
  lastSyncAt    DateTime @map("last_sync_at")
  updatedAt     DateTime @updatedAt

  @@map("nome_do_modulo_sync_state")
  @@schema("integration")
}
```

## 4. Registro no Bootstrap

### 4.1 Adicionar ao `apps/api/src/bootstrap/routes.ts`

```typescript
// Importe seu módulo
import { criarIntegracaoNomeDoModulo } from "@/modules/integration/nome-do-modulo";

// Adicione ao array de integrações
const integrations = [
  // ... outras integrações
  criarIntegracaoNomeDoModulo(),
];
```

## 5. Checklist de Implementação

- [ ] Estrutura de pastas canônica criada
- [ ] Todos os arquivos template implementados
- [ ] Ports (interfaces) definidas (ação, consult, sync-page, lifecycle)
- [ ] Use cases implementados (ação + sync-all incremental)
- [ ] SyncHooksRunner opcional para side-effects pós-sync
- [ ] Lifecycle Gateway (port + fake + real) para confirm/fail
- [ ] Stores (command, integration, query, sync-state) criadas
- [ ] SyncStateStore (checkpoint incremental) configurado
- [ ] fetchPageWithRetry implementado
- [ ] SyncPageGateway (port + real/fake) para paginação
- [ ] ConsultGateway (port + real/fake) para consulta ao vivo
- [ ] Consult + Refresh route (consulta ao vivo + atualiza espelho)
- [ ] PgBoss handlers registrados (sync, sync-all, apply, delete)
- [ ] Jobs agendados configurados (sync-all + reconciliação)
- [ ] Rotas HTTP registradas (commands, callbacks, read, refresh)
- [ ] OpenAPI documentado (todas as rotas)
- [ ] Schema do Prisma atualizado (integration, command, sync_state)
- [ ] Variáveis de ambiente adicionadas
- [ ] Módulo registrado no bootstrap
- [ ] Testes unitários escritos
- [ ] README.md do módulo atualizado

## 6. Exemplo Completo: Módulo `product-catalog`

> **⚠️ IMPORTANTE**: Usamos `product-catalog` (específico) em vez de `products` (genérico) para:
> - **Clareza de domínio**: "product catalog" vs "product structure" vs "sales order"
> - **Ownership explícito**: API 1 mantém espelho Omie + materialização; API 2 consome read-models prontos
> - **Separação de responsabilidades**: sincronização (commands) vs consulta (reads) vs materialização (refresh)
> - **Consistência canônica**: Segue padrão "entidade específica + capacidade"
>
> **📌 REFERÊNCIA OBRIGATÓRIA**: Consulte [DOMAIN_NAMING_GUIDE.md](./DOMAIN_NAMING_GUIDE.md) para padrões canônicos de nomenclatura de domínio.

```
product-catalog/
├── application/
│   ├── dto/
│   │   ├── get-product-catalog-production-ready.dto.ts
│   │   ├── get-product-catalog-read-model.dto.ts
│   │   ├── sync-all-product-catalog.dto.ts
│   │   └── sync-product-catalog.dto.ts
│   ├── mappers/
│   │   └── map-omie-product-to-summary.ts
│   ├── ports/
│   │   ├── product-catalog-fetch.gateway.ts
│   │   ├── product-catalog-fetch-page.gateway.ts
│   │   └── product-catalog-fetch-page.ts
│   ├── use-cases/
│   │   ├── get-product-catalog-production-ready.usecase.ts
│   │   ├── get-product-catalog-read-model.usecase.ts
│   │   ├── get-product-catalog-summary.usecase.ts
│   │   ├── refresh-product-catalog-production-ready.usecase.ts
│   │   ├── sync-all-product-catalog.usecase.ts
│   │   └── sync-product-catalog.usecase.ts
│   └── utils/
│       └── query.utils.ts
├── infrastructure/
│   ├── db/
│   │   ├── product-catalog-command.store.ts
│   │   ├── product-catalog-integration.store.ts
│   │   ├── product-catalog-production-ready-read-model.store.ts
│   │   └── product-catalog-sales-order-aggregation.store.ts
│   ├── gateways/
│   │   ├── fetch/
│   │   │   ├── fake-product-catalog-fetch.gateway.ts
│   │   │   └── real-product-catalog-fetch.gateway.ts
│   │   └── fetch-page/
│   │       ├── fake-product-catalog-fetch-page.gateway.ts
│   │       └── real-product-catalog-fetch-page.gateway.ts
│   └── jobs/
│       ├── product-catalog-jobs.register.ts
│       └── refresh-product-catalog-production-ready.job.ts
├── presentation/
│   └── http/
│       ├── index.ts
│       ├── openapi.ts
│       ├── routes.ts
│       └── routes/
│           ├── Routes.md
│           ├── commands/
│           │   ├── refresh-product-catalog-production-ready.route.ts
│           │   ├── sync-all-product-catalog.route.ts
│           │   └── sync-product-catalog.route.ts
│           └── read/
│               ├── get-product-catalog-last-sync.route.ts
│               ├── get-product-catalog-production-ready.route.ts
│               ├── get-product-catalog-read-model.route.ts
│               ├── get-product-catalog-stats.route.ts
│               ├── get-product-catalog-summary.route.ts
│               ├── get-product-catalog-sync-failures.route.ts
│               ├── get-product-catalog-sync-history.route.ts
│               └── get-product-catalog-sync-status.route.ts
├── index.ts
├── product-catalog-integration-register.ts
└── README.md
```

> 💡 **Por que este módulo é o exemplo ideal?**
> `product-catalog` é o módulo mais completo do projeto, pois combina:
> - **Commands de sincronização** (`sync`, `sync-all`) — com idempotência via `externalRequestId`
> - **Read-models materializados** (`production-ready`) — consolida dados de produto, estoque, estrutura, OP e pedidos
> - **Múltiplas stores** — command store, integration store, read-model store, aggregation store
> - **Gateways reais e fake** — para fetch (produto individual) e fetch-page (paginação)
> - **Jobs agendados** — refresh periódico do read-model de produção
> - **Múltiplos endpoints de leitura** — status, histórico, falhas, summary, stats, read-model
> - **DTOs e mappers específicos** — separação clara entre camadas

---

**Referências**:
- [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md): Padrões de nomenclatura
- [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md): Arquitetura técnica
- [DECISIONS.md](./DECISIONS.md): Decisões arquiteturais fundamentais (ADR)
- Módulo `product-catalog`: Implementação de referência em `apps/api/src/modules/integration/product-catalog/`

**Próximos passos**:
1. Use `pnpm --filter api gen:module` para scaffold automático
2. Siga os templates acima para implementação
3. Configure `.env` com gateways apropriados
4. Registre no bootstrap
5. Escreva testes