# Padrões de Nomenclatura - Production Manager

Este documento define os padrões de nomenclatura obrigatórios para todos os módulos do projeto. Seguir estas convenções garante consistência, legibilidade e facilita a manutenção.

## 1. Estrutura de Pastas (Canônica)

### 1.1 Nome do Módulo
- **Formato**: `kebab-case` (letras minúsculas separadas por hífen)
- **Exemplo**: `product-structure`, `order-integration`, `customer-sync`

### 1.2 Diretórios Obrigatórios
Cada módulo DEVE seguir esta estrutura exata:

```
nome-do-modulo/
├── application/
│   ├── ports/                    # Interfaces (Ports)
│   │   └── nome-do-modulo-[ação].gateway.ts
│   └── use-cases/                # Casos de uso
│       └── [ação]-nome-do-modulo.usecase.ts
├── infrastructure/
│   ├── db/                       # Stores (repositórios)
│   │   └── nome-do-modulo-[tipo].store.ts
│   ├── gateways/                 # Implementações (Adapters)
│   │   ├── [ação]/              # Subdiretório por ação
│   │   │   ├── real-nome-do-modulo-[ação].gateway.ts
│   │   │   └── fake-nome-do-modulo-[ação].gateway.ts
│   │   └── [outra-ação]/        # Outra ação
│   └── jobs/                     # Jobs agendados
│       ├── [ação]-nome-do-modulo.job.ts
│       └── nome-do-modulo-jobs.register.ts
├── presentation/
│   └── http/
│       ├── routes/
│       │   ├── commands/         # Rotas de comando (POST)
│       │   │   └── [ação]-nome-do-modulo.route.ts
│       │   └── read/             # Rotas de leitura (GET)
│       │       └── get-[modelo]-read-model.route.ts
│       ├── routes.ts             # Registro de todas as rotas
│       └── index.ts              # Exportações
├── index.ts                      # Exportações públicas
└── nome-do-modulo-integration-register.ts  # Registro do módulo
```

## 2. Nomenclatura de Arquivos

### 2.1 Tipos de Arquivo e Padrões

| Tipo de Arquivo | Padrão | Exemplo |
|----------------|--------|---------|
| **Port (Interface)** | `nome-do-modulo-[ação].gateway.ts` | `product-structure-apply.gateway.ts` |
| **Use Case** | `[ação]-nome-do-modulo.usecase.ts` | `apply-product-structure.usecase.ts` |
| **Store (DB)** | `nome-do-modulo-[tipo].store.ts` | `product-structure-command.store.ts` |
| **Gateway Real** | `real-nome-do-modulo-[ação].gateway.ts` | `real-product-structure-apply.gateway.ts` |
| **Gateway Fake** | `fake-nome-do-modulo-[ação].gateway.ts` | `fake-product-structure-apply.gateway.ts` |
| **Job** | `[ação]-nome-do-modulo.job.ts` | `reconcile-product-structures.job.ts` |
| **Job Register** | `nome-do-modulo-jobs.register.ts` | `product-structure-jobs.register.ts` |
| **Route (Command)** | `[ação]-nome-do-modulo.route.ts` | `apply-product-structure.route.ts` |
| **Route (Read)** | `get-[modelo]-read-model.route.ts` | `get-production-readiness.route.ts` |
| **Module Register** | `nome-do-modulo-integration-register.ts` | `product-structure-integration-register.ts` |

### 2.2 Palavras-chave Padrão

| Contexto | Palavras-chave | Uso |
|----------|----------------|-----|
| **Ações** | `apply`, `sync`, `delete`, `fetch`, `reconcile`, `process` | Use cases, gateways, routes |
| **Tipos** | `command`, `integration`, `read-model`, `event` | Stores, models |
| **Implementações** | `real`, `fake` | Gateways (sempre prefixo) |
| **Registros** | `register` | Jobs, módulos, rotas |

## 3. Nomenclatura de Classes

### 3.1 Padrão PascalCase
Todas as classes usam **PascalCase** (primeira letra maiúscula de cada palavra).

| Tipo de Classe | Padrão | Exemplo |
|----------------|--------|---------|
| **Use Case** | `[Ação]NomeDoModuloUseCase` | `ApplyProductStructureUseCase` |
| **Store** | `NomeDoModulo[Tipo]Store` | `ProductStructureCommandStore` |
| **Gateway Real** | `RealNomeDoModulo[Ação]Gateway` | `RealProductStructureApplyGateway` |
| **Gateway Fake** | `FakeNomeDoModulo[Ação]Gateway` | `FakeProductStructureApplyGateway` |
| **Job** | `[Ação]NomeDoModuloJob` | `ReconcileProductStructuresJob` |

### 3.2 Exemplos Completos

```typescript
// Use Case
export class ApplyProductStructureUseCase { ... }

// Store
export class ProductStructureCommandStore { ... }

// Gateway Real
export class RealProductStructureApplyGateway { ... }

// Gateway Fake  
export class FakeProductStructureApplyGateway { ... }

// Job
export class ReconcileProductStructuresJob { ... }
```

## 4. Nomenclatura de Funções e Métodos

### 4.1 Padrão camelCase
Todas as funções e métodos usam **camelCase** (primeira letra minúscula).

### 4.2 Convenções por Contexto

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| **Método principal** | `execute()` | `async execute(command: ApplyProductStructureCommand)` |
| **Store methods** | `[ação][Entidade]()` | `getOrCreateAccepted()`, `markConfirmed()` |
| **Gateway methods** | `[ação]()` | `apply()`, `fetch()`, `delete()` |
| **Route registration** | `register[Nome]Route()` | `registerApplyProductStructureRoute()` |
| **Factory functions** | `create[Nome]()` | `createProductStructureIntegration()` |

### 4.3 Exemplos Completos

```typescript
// Use Case
async execute(command: ApplyProductStructureCommand) { ... }

// Store
async getOrCreateAccepted(input: CreateAcceptedCommandInput) { ... }
async markConfirmed(externalRequestId: string) { ... }

// Gateway
async apply(productCode: string, items: ApplyProductStructureItem[]) { ... }

// Route
export function registerApplyProductStructureRoute(app: FastifyInstance) { ... }
```

## 5. Nomenclatura de Variáveis e Parâmetros

### 5.1 Padrão camelCase
Todas as variáveis e parâmetros usam **camelCase**.

### 5.2 Convenções Especiais

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| **Instâncias** | `[nome]Instance` | `appInstance`, `prismaInstance` |
| **Configurações** | `[nome]Config` | `omieConfig`, `jobConfig` |
| **Resultados** | `[nome]Result` | `applyResult`, `fetchResult` |
| **Erros** | `[nome]Error` | `validationError`, `omieError` |
| **Flags booleanas** | `is[Nome]`, `has[Nome]`, `should[Nome]` | `isConfirmed`, `hasItems`, `shouldRetry` |

### 5.3 Exemplos Completos

```typescript
// Instâncias
const prismaInstance = new PrismaClient();
const appInstance: FastifyInstance = fastify();

// Configurações
const omieConfig = { apiKey: env.OMIE_API_KEY };
const jobConfig = { cronExpression: "0 */5 * * * *" };

// Resultados
const applyResult = await gateway.apply(productCode, items);
const fetchResult = await gateway.fetchByProductCode(productCode);

// Flags booleanas
const isConfirmed = record.status === "CONFIRMED";
const hasItems = Array.isArray(items) && items.length > 0;
const shouldRetry = attemptCount < maxRetries;
```

## 6. Nomenclatura de Tipos e Interfaces

### 6.1 Padrão PascalCase
Todos os tipos e interfaces usam **PascalCase**.

### 6.2 Convenções por Contexto

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| **Command DTO** | `[Ação]NomeDoModuloCommand` | `ApplyProductStructureCommand` |
| **Result DTO** | `[Ação]NomeDoModuloResult` | `ApplyProductStructureResult` |
| **Input DTO** | `[Ação]NomeDoModuloInput` | `CreateAcceptedCommandInput` |
| **Item DTO** | `[Ação]NomeDoModuloItem` | `ApplyProductStructureItem` |
| **Gateway Interface** | `NomeDoModulo[Ação]Gateway` | `ProductStructureApplyGateway` |

### 6.3 Exemplos Completos

```typescript
// Command DTO
export type ApplyProductStructureCommand = {
  externalRequestId: string;
  productCode: string;
  items: ApplyProductStructureItem[];
  source?: ProductStructureCommandSource;
};

// Result DTO
export type ApplyProductStructureResult = {
  productCode: string;
  applied: boolean;
  rawPayload: any;
};

// Input DTO
export type CreateAcceptedCommandInput = {
  externalRequestId: string;
  productCode: string;
  commandType: "SYNC" | "APPLY" | "DELETE";
  source?: "API2" | "JOB" | "ADMIN";
};

// Gateway Interface
export interface ProductStructureApplyGateway {
  apply(productCode: string, items: ApplyProductStructureItem[]): Promise<ApplyProductStructureResult>;
}
```

## 7. Nomenclatura de Constantes e Enums

### 7.1 Constantes: UPPER_SNAKE_CASE
Constantes globais usam **UPPER_SNAKE_CASE**.

```typescript
// Constantes de configuração
export const MAX_RETRY_ATTEMPTS = 3;
export const DEFAULT_TIMEOUT_MS = 30000;
export const JOB_CRON_EXPRESSION = "0 */5 * * * *";

// Constantes de domínio
export const PRODUCT_STRUCTURE_COMMAND_TYPES = ["SYNC", "APPLY", "DELETE"] as const;
export const VALID_SOURCES = ["API2", "JOB", "ADMIN"] as const;
```

### 7.2 Enums: PascalCase
Enums usam **PascalCase** para o nome e **UPPER_SNAKE_CASE** para os valores.

```typescript
// Enum de status
export enum CommandStatus {
  ACCEPTED = "ACCEPTED",
  CONFIRMED = "CONFIRMED", 
  FAILED = "FAILED"
}

// Enum de tipos
export enum CommandType {
  SYNC = "SYNC",
  APPLY = "APPLY",
  DELETE = "DELETE"
}
```

## 8. Regras Especiais para Integração Omie

### 8.1 Mapeamento de Campos
Ao integrar com Omie, mantenha os nomes originais da API Omie nos payloads:

```typescript
// Preservar nomes do Omie no payload
const omiePayload = {
  codigo_produto: productCode,  // Nome original do Omie
  itens: items.map(i => ({
    codigo_produto_componente: i.componentCode,  // Nome original
    quantidade: i.quantity,
    unidade: i.unit,
    percentual_perda: i.loss
  }))
};

// No nosso domínio, use camelCase
export type ApplyProductStructureItem = {
  componentCode: string;
  quantity: number;
  unit?: string;
  loss?: number;
};
```

### 8.2 Prefixos para Integração
- **Omie**: `omie` (ex: `omieClient`, `omieConfig`)
- **API 1**: `api1` (ex: `api1Endpoint`, `api1Auth`)
- **API 2**: `api2` (ex: `api2Request`, `api2Response`)

## 9. Verificação de Conformidade

### 9.1 Checklist para Novo Módulo
Antes de criar um novo módulo, verifique:

- [ ] Nome do módulo em `kebab-case`
- [ ] Estrutura de pastas canônica seguida
- [ ] Arquivos nomeados conforme padrões da seção 2
- [ ] Classes em `PascalCase` conforme seção 3
- [ ] Métodos em `camelCase` conforme seção 4
- [ ] Tipos em `PascalCase` conforme seção 6
- [ ] Constantes em `UPPER_SNAKE_CASE` conforme seção 7
- [ ] Nomes Omie preservados em payloads conforme seção 8

### 9.2 Exemplo de Módulo Conforme

```typescript
// Arquivo: apply-product-structure.usecase.ts
export class ApplyProductStructureUseCase {
  async execute(command: ApplyProductStructureCommand) {
    const isDuplicate = await this.checkDuplicate(command.externalRequestId);
    if (isDuplicate) {
      throw new DuplicateCommandError(command.externalRequestId);
    }
    
    const applyResult = await this.gateway.apply(command.productCode, command.items);
    await this.store.saveResult(applyResult);
    
    return { status: "CONFIRMED", externalRequestId: command.externalRequestId };
  }
  
  private async checkDuplicate(externalRequestId: string): Promise<boolean> {
    const existing = await this.commandStore.findByExternalRequestId(externalRequestId);
    return existing !== null;
  }
}

// Arquivo: product-structure-command.store.ts
export class ProductStructureCommandStore {
  async findByExternalRequestId(externalRequestId: string) {
    return this.prisma.productStructureCommand.findUnique({
      where: { externalRequestId }
    });
  }
}
```

## 10. Exceções e Casos Especiais

### 10.1 Acrônimos
Acrônimos com 3+ letras mantêm apenas a primeira maiúscula:

- ✅ `HttpClient` (não `HTTPClient`)
- ✅ `ApiEndpoint` (não `APIEndpoint`)
- ✅ `DbConnection` (não `DBConnection`)

### 10.2 Números em Nomes
Números são permitidos mas devem ser usados com cuidado:

- ✅ `ProductV2Integration`
- ✅ `ApiV1Client`
- ❌ `Product2Structure` (prefira `ProductSecondStructure`)

### 10.3 Prefixos Comuns
- `get`: Para métodos que retornam dados (ex: `getProductById`)
- `create`: Para métodos que criam recursos (ex: `createCommand`)
- `update`: Para métodos que atualizam recursos (ex: `updateStatus`)
- `delete`: Para métodos que removem recursos (ex: `deleteRecord`)
- `validate`: Para métodos de validação (ex: `validateInput`)
- `is`/`has`/`should`: Para métodos booleanos (ex: `isValid`, `hasPermission`)

---

**Última atualização**: 2026-06-08  
**Aplicável a**: Todos os módulos em `apps/api/src/modules/integration/`  
**Referência**: Módulo modelo `product-structure`