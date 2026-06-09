# Template de Módulo - Production Manager

Este template define a estrutura canônica obrigatória para todos os novos módulos de integração. Use este template como ponto de partida e referência ao criar qualquer novo módulo.

## 1. Estrutura Completa do Módulo

```
nome-do-modulo/                          # kebab-case (ex: order-sync)
├── application/
│   ├── ports/
│   │   └── nome-do-modulo-[ação].gateway.ts
│   └── use-cases/
│       └── [ação]-nome-do-modulo.usecase.ts
├── infrastructure/
│   ├── db/
│   │   └── nome-do-modulo-[tipo].store.ts
│   ├── gateways/
│   │   ├── [ação]/
│   │   │   ├── real-nome-do-modulo-[ação].gateway.ts
│   │   │   └── fake-nome-do-modulo-[ação].gateway.ts
│   └── jobs/
│       ├── [ação]-nome-do-modulo.job.ts
│       └── nome-do-modulo-jobs.register.ts
├── presentation/
│   └── http/
│       ├── routes/
│       │   ├── commands/
│       │   │   └── [ação]-nome-do-modulo.route.ts
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

### 2.6 Job - `infrastructure/jobs/`

**Arquivo**: `[ação]-nome-do-modulo.job.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/jobs/[açao]-nome-do-modulo.job.ts

import cron from "node-cron";
import { env } from "@/config";
import { logger } from "@/shared/logger";

import { NomeDoModuloAcaoUseCase } from "../../application/use-cases/[açao]-nome-do-modulo.usecase";
// Importe gateways, stores, etc.

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
  // Dependências
): NomeDoModuloAcaoJob {
  // Construir use case com gateways e stores
  const useCase = new NomeDoModuloAcaoUseCase(/* ... */);
  return new NomeDoModuloAcaoJob(useCase);
}
```

### 2.7 Job Register - `infrastructure/jobs/`

**Arquivo**: `nome-do-modulo-jobs.register.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/infrastructure/jobs/nome-do-modulo-jobs.register.ts

import cron from "node-cron";
import { env } from "@/config";
import { logger } from "@/shared/logger";

import { criarNomeDoModuloAcaoJob } from "./[açao]-nome-do-modulo.job";

export function registrarJobsNomeDoModulo() {
  // Job agendado (se habilitado no .env)
  if (env.HABILITAR_JOB_NOME_DO_MODULO_ACAO === "true") {
    const expressaoCron = env.CRON_JOB_NOME_DO_MODULO_ACAO || "0 */5 * * * *";
    
    cron.schedule(expressaoCron, async () => {
      try {
        const job = criarNomeDoModuloAcaoJob(/* dependências */);
        await job.executar();
      } catch (erro) {
        logger.error("Falha na execução agendada do job", { erro });
      }
    });

    logger.info("Job de [ação] nome-do-modulo agendado", { expressaoCron });
  }

  // Job único (execução imediata)
  if (env.EXECUTAR_JOB_NOME_DO_MODULO_ACAO_INICIO === "true") {
    logger.info("Executando job de [ação] nome-do-modulo no início");
    
    setTimeout(async () => {
      try {
        const job = criarNomeDoModuloAcaoJob(/* dependências */);
        await job.executar();
      } catch (erro) {
        logger.error("Falha na execução inicial do job", { erro });
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
import { env } from "@/config";

// Importe stores
import { NomeDoModuloStore } from "../../../../../infrastructure/db/nome-do-modulo.store";
import { NomeDoModuloComandoStore } from "../../../../../infrastructure/db/nome-do-modulo-command.store";

// Importe gateways (real/fake)
import { RealNomeDoModuloAcaoGateway } from "../../../../../infrastructure/gateways/[açao]/real-nome-do-modulo-[açao].gateway";
import { FakeNomeDoModuloAcaoGateway } from "../../../../../infrastructure/gateways/[açao]/fake-nome-do-modulo-[açao].gateway";

// Importe use case
import { NomeDoModuloAcaoUseCase } from "../../../../../application/use-cases/[açao]-nome-do-modulo.usecase";

// Importe cliente Omie (para gateway real)
import { omieHttpClient } from "@/shared/integrations/omie/omie-http-client";

export function registrarRotaNomeDoModuloAcao(app: FastifyInstance) {
  app.post(
    "/v1/integration/nome-do-modulo/:codigo/[açao]",
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
        env.GATEWAY_NOME_DO_MODULO === "real"
          ? new RealNomeDoModuloAcaoGateway(omieHttpClient)
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

### 2.9 Route (Read) - `presentation/http/routes/read/`

**Arquivo**: `get-[modelo]-read-model.route.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/presentation/http/routes/read/get-[modelo]-read-model.route.ts

import type { FastifyInstance } from "fastify";

// Importe use case de leitura
import { ObterModeloLeituraUseCase } from "../../../../../application/use-cases/obter-[modelo]-leitura.usecase";

// Importe store
import { NomeDoModuloStore } from "../../../../../infrastructure/db/nome-do-modulo.store";

export function registrarRotaObterModeloLeitura(app: FastifyInstance) {
  app.get(
    "/v1/integration/nome-do-modulo/:codigo/[modelo]",
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

### 2.10 Routes Index - `presentation/http/routes/`

**Arquivo**: `index.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/presentation/http/routes/index.ts

import type { FastifyInstance } from "fastify";

// Importe todas as rotas de comando
import { registrarRotaNomeDoModuloAcao } from "./commands/[açao]-nome-do-modulo.route";
import { registrarRotaNomeDoModuloOutraAcao } from "./commands/[outra-açao]-nome-do-modulo.route";

// Importe todas as rotas de leitura
import { registrarRotaObterModeloLeitura } from "./read/get-[modelo]-read-model.route";

export function registrarRotasNomeDoModulo(app: FastifyInstance) {
  // Registra rotas de comando
  registrarRotaNomeDoModuloAcao(app);
  registrarRotaNomeDoModuloOutraAcao(app);
  
  // Registra rotas de leitura
  registrarRotaObterModeloLeitura(app);
}
```

### 2.11 Routes Main - `presentation/http/`

**Arquivo**: `routes.ts`

```typescript
// apps/api/src/modules/integration/nome-do-modulo/presentation/http/routes.ts

import type { FastifyInstance } from "fastify";
import { registrarRotasNomeDoModulo } from "./routes/index";

export async function rotasIntegracaoNomeDoModulo(app: FastifyInstance) {
  registrarRotasNomeDoModulo(app);
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
import { rotasIntegracaoNomeDoModulo } from "./presentation/http/routes";
import { registrarJobsNomeDoModulo } from "./infrastructure/jobs/nome-do-modulo-jobs.register";

export function criarIntegracaoNomeDoModulo() {
  return {
    nome: "nome-do-modulo-integration",
    registrar: (app: FastifyInstance) => {
      // Registra rotas HTTP
      app.register(rotasIntegracaoNomeDoModulo);
      
      // Registra jobs agendados
      registrarJobsNomeDoModulo();
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

## 3. Configuração do Ambiente

### 3.1 Variáveis de Ambiente (`.env`)
Adicione ao `apps/api/.env`:

```env
# Gateway (fake/real)
GATEWAY_NOME_DO_MODULO=fake  # desenvolvimento
# GATEWAY_NOME_DO_MODULO=real  # produção

# Jobs agendados
HABILITAR_JOB_NOME_DO_MODULO_ACAO=false
CRON_JOB_NOME_DO_MODULO_ACAO=0 */5 * * * *
EXECUTAR_JOB_NOME_DO_MODULO_ACAO_INICIO=false
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
- [ ] Ports (interfaces) definidas
- [ ] Use cases implementados
- [ ] Stores (real/fake) criadas
- [ ] Jobs agendados configurados
- [ ] Rotas HTTP registradas
- [ ] Schema do Prisma atualizado
- [ ] Variáveis de ambiente adicionadas
- [ ] Módulo registrado no bootstrap
- [ ] Testes unitários escritos
- [ ] Documentação atualizada

## 6. Exemplo Completo: Módulo `order-sync`

```
order-sync/
├── application/
│   ├── ports/
│   │   └── order-sync-fetch.gateway.ts
│   └── use-cases/
│       └── sync-order.usecase.ts
├── infrastructure/
│   ├── db/
│   │   └── order-sync-command.store.ts
│   ├── gateways/
│   │   ├── fetch/
│   │   │   ├── real-order-sync-fetch.gateway.ts
│   │   │   └── fake-order-sync-fetch.gateway.ts
│   └── jobs/
│       ├── reconcile-orders.job.ts
│       └── order-sync-jobs.register.ts
├── presentation/
│   └── http/
│       ├── routes/
│       │   ├── commands/
│       │   │   └── sync-order.route.ts
│       │   └── read/
│       │       └── get-order-status.route.ts
│       ├── routes.ts
│       └── index.ts
├── index.ts
└── order-sync-integration-register.ts
```

---

**Referências**:
- [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md): Padrões de nomenclatura
- [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md): Arquitetura técnica
- Módulo `product-structure`: Implementação de referência

**Próximos passos**:
1. Use `pnpm --filter api gen:module` para scaffold automático
2. Siga os templates acima para implementação
3. Configure `.env` com gateways apropriados
4. Registre no bootstrap
5. Escreva testes