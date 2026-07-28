# 📚 BIBLIOTECA DE IMPORTS - PRODUCTION MANAGER

## 🎯 OBJETIVO
Catálogo completo de imports padrão do projeto para evitar erros de importação
e garantir consistência entre módulos.

---

## 1. IMPORTS CATEGORIZADOS

### 1.1 CORE DO FASTIFY
```typescript
import Fastify, { FastifyInstance } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
```

### 1.2 CONFIGURAÇÃO E AMBIENTE  
```typescript
import { env } from "@/config";
import "dotenv/config";
```

### 1.3 BANCO DE DADOS (PRISMA)
```typescript
// ⚠️ DIFERENÇA CRÍTICA:
import { prisma } from "@/infra/db";           // SÓ no bootstrap/app.ts
import { prisma } from "@/shared/db/prisma";   // Em TODOS os módulos

import type { PrismaClient } from "@prisma/client";
import type { ModelName } from "@prisma/client";  // Ex: Product, Order
import { Prisma } from "@prisma/client";          // Para operadores
```

### 1.4 LOGGING
```typescript
import { getLogger } from "@/shared/logger";
import { setBaseLogger } from "@/shared/logger";
```

### 1.5 VALIDAÇÃO (ZOD)
```typescript
import { z } from "zod";
import { ZodError } from "zod";
```

### 1.6 ERROS DO PROJETO
```typescript
import { AppError } from "@/shared/errors/AppError";
import { DomainError } from "@/shared/errors/domain-errors";
import { HttpError } from "@/shared/errors/http-errors";
```

### 1.7 HTTP HELPERS
```typescript
import { sendOk } from "@/shared/http/response";
import { ok, created, noContent } from "@/shared/http/response";
import { validate } from "@/shared/http/validate";
```

### 1.8 INTEGRAÇÃO OMIE
```typescript
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { createOmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import { createOmieStockCache } from "@/shared/integrations/omie/omie-stock-cache";
import { OmieAdapter } from "@/shared/integrations/omie/omie.adapter";
```

### 1.9 SERVIÇOS COMPARTILHADOS
```typescript
import { IntelligentPollingService } from "@/shared/services/IntelligentPollingService";
import { RetrySystem } from "@/shared/services/RetrySystem";
import { idempotency } from "@/shared/services/idempotency.utils";
```

### 1.10 UTILITÁRIOS
```typescript
import crypto from "crypto";
import cron from "node-cron";
```

---

## 2. EXEMPLOS COMPLETOS POR TIPO DE ARQUIVO

### 2.1 ROTA HTTP (route.ts)
```typescript
// Arquivo: modules/integration/product-structure/presentation/http/routes/commands/apply-product-structure.route.ts
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { env } from "@/config";
import { validate } from "@/shared/http/validate";
import { AppError } from "@/shared/errors/AppError";
import { applyProductStructureUseCase } from "@/modules/integration/product-structure/application/use-cases/apply-product-structure.usecase";

export async function registerApplyProductStructureRoute(app: FastifyInstance) {
  app.post("/v1/integration/product-structure/:productCode/apply", async (request: FastifyRequest, reply: FastifyReply) => {
    // Implementação da rota
  });
}
```

### 2.2 USE CASE (usecase.ts)
```typescript
// Arquivo: modules/integration/product-structure/application/use-cases/apply-product-structure.usecase.ts
import type { ProductStructureApplyGateway } from "../ports/product-structure-apply.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
import type { ProductStructureCommandStore } from "../../infrastructure/db/product-structure-command.store";
import { AppError } from "@/shared/errors/AppError";
import { DomainError } from "@/shared/errors/domain-errors";

export class ApplyProductStructureUseCase {
  constructor(
    private readonly applyGateway: ProductStructureApplyGateway,
    private readonly fetchGateway: ProductStructureFetchGateway,
    private readonly store: ProductStructureIntegrationStore,
    private readonly commandStore: ProductStructureCommandStore
  ) {}

  async execute(command: ApplyProductStructureCommand) {
    // Lógica do use case
  }
}
```

### 2.3 GATEWAY REAL (real-*.gateway.ts)
```typescript
// Arquivo: modules/integration/product-structure/infrastructure/gateways/fetch/real-product-structure-fetch.gateway.ts
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type { ProductStructureFetchGateway, ProductStructureFetchResult } from "../../../application/ports/product-structure-fetch.gateway";

export class RealProductStructureFetchGateway implements ProductStructureFetchGateway {
  constructor(private readonly omieClient: OmieHttpClientPort) {}

  async fetchByProductCode(productCode: string): Promise<ProductStructureFetchResult> {
    // Implementação real com Omie
  }
}
```

### 2.4 GATEWAY FAKE (fake-*.gateway.ts)
```typescript
// Arquivo: modules/integration/product-structure/infrastructure/gateways/fetch/fake-product-structure-fetch.gateway.ts
import type { ProductStructureFetchGateway, ProductStructureFetchResult } from "../../../application/ports/product-structure-fetch.gateway";

export class FakeProductStructureFetchGateway implements ProductStructureFetchGateway {
  async fetchByProductCode(productCode: string): Promise<ProductStructureFetchResult> {
    // Implementação fake para dev/test
    return {
      productCode,
      hasStructure: false,
      items: [],
      rawPayload: { fake: true, reason: "Fake gateway ativo" }
    };
  }
}
```

### 2.5 STORE/REPOSITÓRIO (store.ts)
```typescript
// Arquivo: modules/integration/product-structure/infrastructure/db/product-structure-integration.store.ts
import { prisma } from "@/shared/db/prisma";  // ⚠️ IMPORTANTE: NÃO use @/infra/db aqui!
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { getLogger } from "@/shared/logger";

export class ProductStructureIntegrationStore {
  private readonly logger = getLogger("ProductStructureIntegrationStore");

  async save(productCode: string, data: any) {
    // Implementação do repositório
  }
}
```

### 2.6 JOB AGENDADO (job.ts)
```typescript
// Arquivo: modules/integration/product-structure/infrastructure/jobs/reconcile-product-structures.job.ts
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

export class ReconcileProductStructuresJob {
  static async execute(options: { source: string; omieClient: OmieHttpClientPort }) {
    // Implementação do job
  }
}
```

### 2.7 REGISTER DE MÓDULO (register.ts)
```typescript
// Arquivo: modules/integration/product-structure/product-structure-integration-register.ts
import type { FastifyInstance } from "fastify";
import { productStructureIntegrationRoutes } from "./presentation/http/routes";

export async function registerProductStructureIntegrationModule(app: FastifyInstance) {
  await app.register(productStructureIntegrationRoutes);
}
```

---

## 3. ERROS COMUNIS E SOLUÇÕES

### ❌ ERRO: `Cannot find module '@/infra/db'`
**CAUSA:** Tentando importar `@/infra/db` em um módulo (fora do bootstrap)
**SOLUÇÃO:** Use `@/shared/db/prisma` em todos os módulos. `@/infra/db` só funciona em `src/bootstrap/app.ts`

### ❌ ERRO: `TypeError: omieClient.post is not a function`
**CAUSA:** Não injetou `OmieHttpClientPort` no construtor do gateway
**SOLUÇÃO:** Certifique-se de que o gateway recebe `omieClient` no construtor

### ❌ ERRO: `Property 'env' does not exist on type 'typeof import("@/config")'`
**CAUSA:** Import errado do config
**SOLUÇÃO:** Use `import { env } from "@/config";` (não `import config from "@/config"`)

### ❌ ERRO: `Cannot find module '@/shared/logger'`
**CAUSA:** Path incorreto ou módulo não construído
**SOLUÇÃO:** Execute `pnpm build` para construir packages compartilhados

---

## 4. DIFERENÇAS ENTRE AMBIENTES

### 4.1 DESENVOLVIMENTO (DEV)
```typescript
// .env
PRODUCT_STRUCTURE_GATEWAY=fake
PRODUCTION_ORDER_GATEWAY=fake

// Imports recomendados
import { FakeProductStructureFetchGateway } from "./gateways/fetch/fake-product-structure-fetch.gateway";
```

### 4.2 TESTES (TEST)
```typescript
// .env.test  
PRODUCT_STRUCTURE_GATEWAY=fake
ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB=false

// Imports para testes
import { FakeProductStructureFetchGateway } from "./gateways/fetch/fake-product-structure-fetch.gateway";
```

### 4.3 PRODUÇÃO (PROD)
```typescript
// .env.production
PRODUCT_STRUCTURE_GATEWAY=real
PRODUCTION_ORDER_GATEWAY=real
ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB=true
OMIE_PRODUCT_STRUCTURE_SYNC_CRON="0 */12 * * *"

// Imports obrigatórios
import { RealProductStructureFetchGateway } from "./gateways/fetch/real-product-structure-fetch.gateway";
```

---

## 5. ORDEM RECOMENDADA DE IMPORTS

```typescript
// 1. Imports de tipos (type imports)
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";

// 2. Imports de bibliotecas externas
import cron from "node-cron";
import { z } from "zod";

// 3. Imports de @/ (paths do projeto)
import { env } from "@/config";
import { prisma } from "@/shared/db/prisma";
import { getLogger } from "@/shared/logger";

// 4. Imports relativos do módulo
import { applyProductStructureUseCase } from "../application/use-cases/apply-product-structure.usecase";
import type { ProductStructureApplyGateway } from "../ports/product-structure-apply.gateway";
```

---

**📌 NOTA:** Esta biblioteca deve ser consultada sempre que criar um novo módulo
ou arquivo para garantir consistência com os padrões do projeto.
```