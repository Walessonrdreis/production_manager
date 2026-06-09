# 🏗️ GUIA DE ARQUITETURA - PRODUCTION MANAGER

## 1. ARQUITETURA CANÔNICA (PADRÃO IMUTÁVEL)

### 1.1 Estrutura de Pastas Obrigatória
```
modules/integration/{nome-modulo}/
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
└── {verbo}-{entidade}.job.ts         # Implementação do job
```

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
    └── get-production-readiness.route.ts
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

**📌 NOTA:** Esta arquitetura é **canônica** para o projeto. Qualquer desvio
deve ser justificado e documentado como exceção, não como padrão.
```