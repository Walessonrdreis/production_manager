# 📚 MANUAL DEFINITIVO - PRODUCTION MANAGER

**🔴 AUTORIDADE MÁXIMA DO PROJETO**
Este documento é a **fonte de verdade principal** do projeto Production Manager.
Os demais arquivos de documentação detalham aspectos específicos e **não devem contradizê‑lo**.
Para qualquer dúvida sobre padrões, arquitetura ou decisões de design, **comece aqui**.

**Versão**: 1.0.0  
**Data**: 2026-06-08  
**Foco**: API principal (`apps/api/`) e módulos de integração (`integration/`)

**📌 CONVENÇÃO DE IDIOMA**:
- **Documentação**: Português (PT-BR) para explicações, guias e comentários
- **Código**: Inglês para nomes de variáveis, funções, classes e tipos
- **Exceção**: Comentários em PT-BR para facilitar entendimento da equipe local

---

## 📖 SUMÁRIO

1. [🎯 Visão Estratégica](#-visão-estratégica)
2. [🏗️ Guia de Arquitetura](#️-guia-de-arquitetura)
3. [📚 Biblioteca de Imports](#-biblioteca-de-imports)
4. [🔤 Padrões de Nomenclatura](#-padrões-de-nomenclatura)
5. [👨‍💻 Como Contribuir](#-como-contribuir)
6. [📦 Template de Módulo](#-template-de-módulo)

---

## 🎯 VISÃO ESTRATÉGICA

### 1. OBJETIVO DO PROJETO

**Reduzir em ~90% a necessidade de operar diretamente o Omie**, movendo a operação diária para o sistema (Front + API 2), mantendo o Omie como **base persistente/ERP**.

### 2. PRINCÍPIO FUNDAMENTAL

```
Usuário → Sistema (Front + API 2) → API 1 → Omie (ERP)
```

### 3. ARQUITETURA MACRO

```
DB ÚNICO (compartilhado)
    ↑
API 1 (Fastify) - Integração com Omie
    ↑  
API 2 - Domínio/UX
    ↑
FRONTEND - Interface do usuário
```

### 4. REGRAS DE OURO (IMUTÁVEIS)

1. **Front nunca chama Omie**
2. **Front nunca chama API 1 diretamente**
3. **API 2 nunca chama Omie** e não conhece payloads do Omie
4. **API 1 é a única camada que fala com Omie**
5. **Read-models não executam efeitos colaterais**
6. **Comandos de integração sempre usam externalRequestId** (idempotência)
7. **Comandos retornam 202 Accepted (ACK)** e o sistema é eventual-consistente

---

## 🏗️ GUIA DE ARQUITETURA

### 1. ARQUITETURA CANÔNICA (PADRÃO IMUTÁVEL)

#### Estrutura de Pastas Obrigatória:
```
modules/integration/{nome-modulo}/
├── application/                    # Regras de negócio puras
│   ├── ports/                     # Interfaces (Ports)
│   └── use-cases/                 # Casos de uso
├── infrastructure/                # Implementações concretas
│   ├── db/                        # Repositórios/Stores
│   ├── gateways/                  # Gateways organizados por capacidade
│   └── jobs/                      # Jobs agendados
└── presentation/                  # Interface HTTP
    └── http/
        ├── routes.ts              # Registro principal
        └── routes/                # Rotas organizadas
            ├── commands/          # Comandos (alteram estado)
            └── read/              # Consultas (não alteram estado)
```

### 2. CLEAN ARCHITECTURE E PORTS & ADAPTERS

#### Princípios Fundamentais:
- **Dependência Invertida**: Camadas internas NÃO dependem de camadas externas
- **Separação de Concerns**: Application (regras), Infrastructure (implementações), Presentation (interface)

#### Camadas:
- **Application**: Regras de negócio puras usando apenas ports (interfaces)
- **Infrastructure**: Implementações concretas que dependem de ports
- **Presentation**: Interface HTTP que depende de application

### 3. PADRÃO REAL/FAKE PARA GATEWAYS

#### Configuração via `.env`:
```env
PRODUCT_STRUCTURE_GATEWAY=fake  # desenvolvimento
PRODUCT_STRUCTURE_GATEWAY=real  # produção
```

#### ⚠️ ENV CANÔNICO DO PROJETO
O projeto usa um **padrão canônico** para variáveis de ambiente com prefixo `ENABLE_OMIE_*`:

```env
# Padrão REAL do projeto (não use exemplos genéricos)
ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB=false
OMIE_PRODUCT_STRUCTURE_SYNC_CRON=0 */12 * * * *

# Padrão para novos módulos (ex: product-management)
ENABLE_OMIE_PRODUCT_MANAGEMENT_SYNC_JOB=false
OMIE_PRODUCT_MANAGEMENT_SYNC_CRON=0 */6 * * * *

# Padrão para gateways por módulo
PRODUCT_STRUCTURE_GATEWAY=fake|real
PRODUCTION_ORDER_GATEWAY=fake|real
PRODUCT_MANAGEMENT_GATEWAY=fake|real
PRODUCT_CATALOG_GATEWAY=fake|real
```

**Regra obrigatória**: 
- Prefixo `ENABLE_OMIE_*` para jobs de integração com Omie
- Prefixo `OMIE_*_CRON` para expressões cron
- `{MODULO}_GATEWAY=fake|real` para gateways configuráveis

#### Benefícios:
- **Desenvolvimento rápido**: Fake gateways sem dependências externas
- **Testes isolados**: Sem chamadas reais ao Omie

#### ⚠️ CONCEITO FUNDAMENTAL: Gateway representa uma CAPACIDADE externa
Cada gateway no projeto representa uma **capacidade específica** de comunicação com sistemas externos (ex: Omie), não um módulo genérico. Esta distinção é crucial:
- **Gateway por capacidade**: `ProductStructureApplyGateway` (aplicar estrutura), `ProductStructureFetchGateway` (buscar estrutura)
- **NÃO gateway por módulo**: `ProductStructureGateway` (genérico, incorreto)
- **Objetivo**: Isolar responsabilidades e permitir substituição independente de cada capacidade
- **Transição suave**: Mesmo código, apenas configuração muda

### 4. SISTEMA DE JOBS AGENDADOS

#### Configuração:
```env
ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB=false
OMIE_PRODUCT_STRUCTURE_SYNC_CRON=0 */12 * * * *
```

#### Tipos de Jobs:
- **Sincronização**: Traz dados do Omie para o espelho local
- **Reconciliação**: Detecta e corrige divergências
- **Processamento em lote**: Executa operações em massa

### 5. PADRÃO CANÔNICO: READ + COMMAND + JOB

#### Para cada entidade de integração:
1. **Read-model**: GET para consulta rápida (cacheado)
2. **Command**: POST para ações com efeitos colaterais (idempotente)
3. **Job**: Processamento assíncrono agendado

#### Exemplo `product-structure`:
- `GET /product-structure/{codigo}` - Read-model
- `POST /product-structure/{codigo}/apply` - Command
- `Job reconcile-product-structures` - Reconciliação agendada

### 6. ORGANIZAÇÃO DE ROTAS HTTP

#### Convenções:
- **`/v1/integration/{modulo}/{entidade}/{ação}`** - Padrão canônico
- **Commands**: POST com `externalRequestId` obrigatório
- **Read**: GET sem efeitos colaterais

#### Versionamento:
- `v1/`: API atual (estável)
- Sempre incluir `integration/` no path para módulos de integração

### 7. BOOTSTRAP E REGISTRO DE MÓDULOS

#### Arquivo principal: `apps/api/src/bootstrap/routes.ts`
```typescript
const integrations = [
  createProductStructureIntegration(),
  createOrderSyncIntegration(),
  // ... outros módulos
];
```

#### Cada módulo deve exportar:
```typescript
export function create{NomeModulo}Integration() {
  return {
    name: "{nome-modulo}-integration",
    register: (app: FastifyInstance) => {
      // Registrar rotas e jobs
    }
  };
}
```

### 8. PRINCÍPIOS DE DESIGN APLICADOS

#### 1. Eventual Consistency
- Commands retornam 202 Accepted imediatamente
- Sistema processa assincronamente
- Read-models eventualmente consistentes

#### 2. Idempotência
- Todo command usa `externalRequestId`
- Execução única garantida pelo sistema
- Retry seguro em caso de falhas

#### 3. CommandStore (Obrigatório em comandos)
O CommandStore é responsável por:
- **Garantir idempotência**: Verifica `externalRequestId` para evitar execução duplicada
- **Armazenar status**: Mantém estados (ACCEPTED / CONFIRMED / FAILED) de cada comando
- **Permitir retry seguro**: Rastreia tentativas e permite retentativas controladas
- **Base para observabilidade**: Fornece logs e métricas para monitoramento

**Exemplo de uso**:
```typescript
// No use case de comando
const existing = await commandStore.findByExternalRequestId(externalRequestId);
if (existing) {
  return { status: existing.status, externalRequestId };
}
```

#### 4. Anti-corruption Layer
- API 1 traduz payloads do Omie
- Domínio interno não conhece detalhes do Omie
- Isolamento de mudanças no Omie

#### 4. Strategy Pattern
- Gateways configuráveis (real/fake)
- Mesma interface, implementações diferentes
- Troca em runtime via configuração

---

## 📚 BIBLIOTECA DE IMPORTS

### 1. IMPORTS CATEGORIZADOS

#### CORE DO FASTIFY
```typescript
import Fastify, { FastifyInstance } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
```

#### CONFIGURAÇÃO E AMBIENTE  
```typescript
import { env } from "@/config";
import "dotenv/config";
```

#### BANCO DE DADOS (PRISMA) - ⚠️ DIFERENÇA CRÍTICA
```typescript
import { prisma } from "@/infra/db";           // SÓ no bootstrap/app.ts
import { prisma } from "@/shared/db/prisma";   // Em TODOS os módulos
import type { PrismaClient } from "@prisma/client";
```

#### LOGGING
```typescript
import { getLogger } from "@/shared/logger";
import { setBaseLogger } from "@/shared/logger";
```

#### VALIDAÇÃO (ZOD)
```typescript
import { z } from "zod";
import { ZodError } from "zod";
```

#### ERROS DO PROJETO
```typescript
import { AppError } from "@/shared/errors/AppError";
import { DomainError } from "@/shared/errors/domain-errors";
import { HttpError } from "@/shared/errors/http-errors";
```

#### HTTP HELPERS
```typescript
import { sendOk } from "@/shared/http/response";
import { ok, created, noContent } from "@/shared/http/response";
import { validate } from "@/shared/http/validate";
```

#### INTEGRAÇÃO OMIE
```typescript
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { createOmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
```

#### SERVIÇOS COMPARTILHADOS
```typescript
import { IntelligentPollingService } from "@/shared/services/IntelligentPollingService";
import { RetrySystem } from "@/shared/services/RetrySystem";
import { idempotency } from "@/shared/services/idempotency.utils";
```

#### UTILITÁRIOS
```typescript
import crypto from "crypto";
import cron from "node-cron";
```

### 2. EXEMPLOS COMPLETOS POR TIPO DE ARQUIVO

#### ROTA HTTP (route.ts)
```typescript
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { env } from "@/config";
import { validate } from "@/shared/http/validate";
import { AppError } from "@/shared/errors/AppError";
```

#### USE CASE (usecase.ts)
```typescript
import type { ProductStructureApplyGateway } from "../ports/product-structure-apply.gateway";
import type { ProductStructureFetchGateway } from "../ports/product-structure-fetch.gateway";
import type { ProductStructureIntegrationStore } from "../../infrastructure/db/product-structure-integration.store";
```

#### GATEWAY (gateway.ts)
```typescript
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type { ProductStructureApplyGateway, ApplyProductStructureItem } from "../../../application/ports/product-structure-apply.gateway";
```

#### STORE (store.ts)
```typescript
import type { PrismaClient, ProductStructureCommand } from "@prisma/client";
import { Prisma } from "@prisma/client";
```

#### JOB (job.ts)
```typescript
import cron from "node-cron";
import { env } from "@/config";
import { logger } from "@/shared/logger";
```

#### REGISTER (register.ts)
```typescript
import type { FastifyInstance } from "fastify";
import { productStructureIntegrationRoutes } from "./presentation/http/routes";
```

### 3. ERROS COMUNS E SOLUÇÕES

#### 1. "Cannot find module '@/infra/db'"
**Causa**: Tentando usar `@/infra/db` fora do `bootstrap/app.ts`
**Solução**: Use `@/shared/db/prisma` em módulos

#### 2. "PrismaClient is not defined"
**Causa**: Cliente Prisma não gerado
**Solução**: Execute `pnpm --filter api prisma:generate`

#### 3. "Invalid import path"
**Causa**: Caminho relativo incorreto
**Solução**: Use `@/modules/integration/{modulo}/` para imports entre módulos

#### 4. "env is undefined"
**Causa**: Não importou `@/config` ou `.env` não carregado
**Solução**: Adicione `import { env } from "@/config";` no topo do arquivo

### 4. DIFERENÇAS ENTRE AMBIENTES

#### Desenvolvimento (local):
- Gateways: `fake` (padrão)
- Jobs: desabilitados (ou com cron longo)
- Logging: nível `debug`

#### Testes:
- Gateways: `fake` (obrigatório)
- DB: SQLite em memória
- Jobs: mockados

#### Produção:
- Gateways: `real` (obrigatório)
- Jobs: habilitados com cron apropriado
- Logging: nível `info` ou `warn`

### 5. ORDEM RECOMENDADA DE IMPORTS

```typescript
// 1. Core do framework (Fastify, etc.)
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

// 2. Configuração e ambiente
import { env } from "@/config";

// 3. Bibliotecas externas
import { z } from "zod";
import cron from "node-cron";

// 4. Shared do projeto
import { logger } from "@/shared/logger";
import { AppError } from "@/shared/errors/AppError";

// 5. Ports (interfaces) do próprio módulo
import type { ProductStructureApplyGateway } from "../ports/product-structure-apply.gateway";

// 6. Implementações do próprio módulo
import { RealProductStructureApplyGateway } from "../../infrastructure/gateways/apply/real-product-structure-apply.gateway";

// 7. Use cases do próprio módulo
import { ApplyProductStructureUseCase } from "../use-cases/apply-product-structure.usecase";
```

---

## 🔤 PADRÕES DE NOMENCLATURA

### 1. ESTRUTURA DE PASTAS (CANÔNICA)

#### Nome do Módulo:
- **Formato**: `kebab-case` (letras minúsculas separadas por hífen)
- **Exemplo**: `product-structure`, `order-integration`, `customer-sync`

#### Diretórios Obrigatórios:
```
nome-do-modulo/
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

### 2. NOMENCLATURA DE ARQUIVOS

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

### 3. NOMENCLATURA DE CLASSES

#### Padrão PascalCase:
| Tipo de Classe | Padrão | Exemplo |
|----------------|--------|---------|
| **Use Case** | `[Ação]NomeDoModuloUseCase` | `ApplyProductStructureUseCase` |
| **Store** | `NomeDoModulo[Tipo]Store` | `ProductStructureCommandStore` |
| **Gateway Real** | `RealNomeDoModulo[Ação]Gateway` | `RealProductStructureApplyGateway` |
| **Gateway Fake** | `FakeNomeDoModulo[Ação]Gateway` | `FakeProductStructureApplyGateway` |
| **Job** | `[Ação]NomeDoModuloJob` | `ReconcileProductStructuresJob` |

### 4. NOMENCLATURA DE FUNÇÕES E MÉTODOS

#### Padrão camelCase:
| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| **Método principal** | `execute()` | `async execute(command: ApplyProductStructureCommand)` |
| **Store methods** | `[ação][Entidade]()` | `getOrCreateAccepted()`, `markConfirmed()` |
| **Gateway methods** | `[ação]()` | `apply()`, `fetch()`, `delete()` |
| **Route registration** | `register[Nome]Route()` | `registerApplyProductStructureRoute()` |
| **Factory functions** | `create[Nome]()` | `createProductStructureIntegration()` |

### 5. NOMENCLATURA DE VARIÁVEIS E PARÂMETROS

#### Padrão camelCase:
| Tipo | Padrão | Exemplo |
|------|--------|---------|
| **Instâncias** | `[nome]Instance` | `appInstance`, `prismaInstance` |
| **Configurações** | `[nome]Config` | `omieConfig`, `jobConfig` |
| **Resultados** | `[nome]Result` | `applyResult`, `fetchResult` |
| **Erros** | `[nome]Error` | `validationError`, `omieError` |
| **Flags booleanas** | `is[Nome]`, `has[Nome]`, `should[Nome]` | `isConfirmed`, `hasItems`, `shouldRetry` |

### 6. NOMENCLATURA DE TIPOS E INTERFACES

#### Padrão PascalCase:
| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| **Command DTO** | `[Ação]NomeDoModuloCommand` | `ApplyProductStructureCommand` |
| **Result DTO** | `[Ação]NomeDoModuloResult` | `ApplyProductStructureResult` |
| **Input DTO** | `[Ação]NomeDoModuloInput` | `CreateAcceptedCommandInput` |
| **Item DTO** | `[Ação]NomeDoModuloItem` | `ApplyProductStructureItem` |
| **Gateway Interface** | `NomeDoModulo[Ação]Gateway` | `ProductStructureApplyGateway` |

### 7. NOMENCLATURA DE CONSTANTES E ENUMS

#### Constantes: UPPER_SNAKE_CASE
```typescript
export const MAX_RETRY_ATTEMPTS = 3;
export const DEFAULT_TIMEOUT_MS = 30000;
export const JOB_CRON_EXPRESSION = "0 */5 * * * *";
```

#### Enums: PascalCase (nome) + UPPER_SNAKE_CASE (valores)
```typescript
export enum CommandStatus {
  ACCEPTED = "ACCEPTED",
  CONFIRMED = "CONFIRMED", 
  FAILED = "FAILED"
}
```

### 8. REGRAS ESPECIAIS PARA INTEGRAÇÃO OMIE

#### Mapeamento de Campos:
```typescript
// Preservar nomes do Omie no payload
const omiePayload = {
  codigo_produto: productCode,  // Nome original do Omie
  itens: items.map(i => ({
    codigo_produto_componente: i.componentCode,  // Nome original
    quantidade: i.quantity,
    unidade: i.unit,
  }))
};

// No nosso domínio, use camelCase
export type ApplyProductStructureItem = {
  componentCode: string;
  quantity: number;
  unit?: string;
};
```

#### Prefixos para Integração:
- **Omie**: `omie` (ex: `omieClient`, `omieConfig`)
- **API 1**: `api1` (ex: `api1Endpoint`, `api1Auth`)
- **API 2**: `api2` (ex: `api2Request`, `api2Response`)

### 9. CHECKLIST PARA NOVO MÓDULO

- [ ] Nome do módulo em `kebab-case`
- [ ] Estrutura de pastas canônica seguida
- [ ] Arquivos nomeados conforme padrões
- [ ] Classes em `PascalCase`
- [ ] Métodos em `camelCase`
- [ ] Tipos em `PascalCase`
- [ ] Constantes em `UPPER_SNAKE_CASE`
- [ ] Nomes Omie preservados em payloads

---

## 👨‍💻 COMO CONTRIBUIR

### 1. PRÉ-REQUISITOS

#### Ferramentas Necessárias:
- **Node.js**: Versão 20.x (exigida pelo `engines`)
- **PNPM**: Gerenciador de pacotes (obrigatório)
- **Docker** (opcional): Para banco de dados local
- **Git**: Controle de versão

#### Instalação Rápida:
```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Clonar e configurar
git clone <repositorio>
cd production_manager
pnpm install
cp apps/api/.env.example apps/api/.env
# Editar apps/api/.env
```

### 2. CONFIGURAÇÃO DO AMBIENTE

#### Variáveis de Ambiente (`apps/api/.env`):
```env
# Banco de dados
DATABASE_URL_DEV="postgresql://postgres:postgres@localhost:5432/production_manager?schema=public"
DIRECT_URL_DEV="postgresql://postgres:postgres@localhost:5432/production_manager?schema=public&connection_limit=1"

# API
PORT=3333
CORS_ORIGIN="http://localhost:5174"

# Omie
OMIE_APP_KEY="sua-app-key"
OMIE_APP_SECRET="sua-app-secret"
OMIE_BASE_URL="https://app.omie.com.br/api/v1/"

# Gateways (fake/real)
PRODUCTION_ORDER_GATEWAY=real
PRODUCT_STRUCTURE_GATEWAY=fake  # Use 'fake' para desenvolvimento
```

#### Banco de Dados Local:
```bash
# Docker (recomendado)
docker run -d --name production-manager-db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=production_manager postgres:16

# Migrações
pnpm --filter api prisma:generate
pnpm --filter api db:migrate:dev
```

### 3. DESENVOLVIMENTO LOCAL

#### Iniciar Servidor:
```bash
# Desenvolvimento com hot reload
pnpm --filter api dev

# Ou navegar para apps/api
cd apps/api
pnpm dev
```

#### Scripts Úteis:
```bash
# Gerar novo módulo (scaffold)
pnpm --filter api gen:module

# Gerar estrutura do projeto
pnpm --filter api gen:structure

# Criar arquivo interativo
pnpm --filter api create:file

# Atualizar documentação
pnpm --filter api metrics:update-docs
```

### 4. CRIANDO UM NOVO MÓDULO

#### Passo a Passo:
1. **Escolher nome**: `kebab-case` (ex: `order-sync`)
2. **Gerar scaffold**: `pnpm --filter api gen:module`
3. **Seguir estrutura canônica**: Verificar [Padrões de Nomenclatura](#-padrões-de-nomenclatura)
4. **Implementar camadas**: Ports, use cases, gateways, stores, jobs, routes

#### Template Rápido:
```bash
novo-modulo/
├── application/
│   ├── ports/
│   │   └── novo-modulo-[ação].gateway.ts
│   └── use-cases/
│       └── [ação]-novo-modulo.usecase.ts
├── infrastructure/
│   ├── db/
│   │   └── novo-modulo-[tipo].store.ts
│   ├── gateways/
│   │   ├── [ação]/
│   │   │   ├── real-novo-modulo-[ação].gateway.ts
│   │   │   └── fake-novo-modulo-[ação].gateway.ts
│   └── jobs/
│       ├── [ação]-novo-modulo.job.ts
│       └── novo-modulo-jobs.register.ts
├── presentation/
│   └── http/
│       ├── routes/
│       │   ├── commands/
│       │   │   └── [ação]-novo-modulo.route.ts
│       │   └── read/
│       │       └── get-[modelo]-read-model.route.ts
│       ├── routes.ts
│       └── index.ts
├── index.ts
└── novo-modulo-integration-register.ts
```

#### Registro do Módulo:
```typescript
// novo-modulo-integration-register.ts
import type { FastifyInstance } from "fastify";
import { registerRoutes } from "./presentation/http/routes";
import { registerJobs } from "./infrastructure/jobs/novo-modulo-jobs.register";

export function createNovoModuloIntegration() {
  return {
    name: "novo-modulo-integration",
    register: (app: FastifyInstance) => {
      registerRoutes(app);
      registerJobs();
    }
  };
}
```

### 5. PADRÕES DE DESENVOLVIMENTO

#### Clean Architecture:
- **Presentation**: Rotas HTTP, controllers
- **Application**: Use cases, ports (interfaces)
- **Infrastructure**: Gateways, stores, jobs

#### Ports & Adapters:
```typescript
// Port (interface)
export interface NovoModuloGateway {
  execute(data: any): Promise<any>;
}

// Adapter (implementação)
export class RealNovoModuloGateway implements NovoModuloGateway { ... }
export class FakeNovoModuloGateway implements NovoModuloGateway { ... }
```

#### Strategy Fake/Real:
```env
NOVO_MODULO_GATEWAY=fake  # dev/test
NOVO_MODULO_GATEWAY=real  # produção
```

#### Eventual Consistency:
- **Commands**: POST retorna 202 Accepted, processa assincronamente
- **Read-models**: GET para consultas rápidas
- **Idempotência**: Use `externalRequestId` para evitar duplicação

### 6. TESTANDO

#### Testes Unitários:
```bash
# Executar testes
pnpm --filter api test

# Watch mode
pnpm --filter api test --watch
```

#### Testes com Fake Gateways:
```typescript
// Use fake gateways para desenvolvimento local
const gateway = env.NOVO_MODULO_GATEWAY === "real" 
  ? new RealNovoModuloGateway() 
  : new FakeNovoModuloGateway();
```

### 7. COMMITS E VERSIONAMENTO

#### Mensagens de Commit:
```
tipo(escopo): descrição breve

Descrição detalhada (opcional)

BREAKING CHANGE: se houver mudança quebra compatibilidade
```

**Tipos**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

#### Exemplo:
```
feat(product-structure): adiciona reconciliação automática

- Implementa job de reconciliação a cada 5 minutos
- Adiciona store para tracking de comandos
- Configura cron expression via .env

BREAKING CHANGE: remove endpoint sync manual
```

### 8. CODE REVIEW

#### Checklist para Review:
- [ ] Estrutura canônica seguida
- [ ] Nomenclatura conforme convenções
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Gateways configuráveis (fake/real)
- [ ] Idempotência com `externalRequestId`
- [ ] Tratamento de erros adequado
- [ ] Logs informativos
- [ ] Variáveis de ambiente documentadas

#### Pontos de Atenção:
1. **Não hardcode valores**: Use `.env` ou configurações
2. **Não acoplar com Omie**: Use gateways abstratos
3. **Não esquecer idempotência**: Sempre use `externalRequestId`
4. **Não misturar camadas**: Presentation não acessa infrastructure diretamente

### 9. DEPLOY

#### Ambiente de Produção:
```bash
# Build
pnpm --filter api build

# Migrações (com resiliência)
pnpm --filter api db:migrate:resilient

# Iniciar
pnpm --filter api start
```

#### Variáveis de Produção:
- `DATABASE_URL` (Supabase com pgbouncer)
- `DIRECT_URL` (Supabase direto para migrações)
- `OMIE_APP_KEY` e `OMIE_APP_SECRET` (produção)
- Todos os gateways como `real`
- Jobs habilitados conforme necessidade

#### Monitoramento:
```bash
# Métricas do projeto
pnpm --filter api metrics:all

# Status da API
pnpm --filter api docs:status

# Contrato da API
pnpm --filter api docs:contract
```

### 10. SOLUÇÃO DE PROBLEMAS

#### Problemas Comuns:

##### "Cannot find module"
```bash
# Recriar node_modules
rm -rf node_modules
pnpm install
```

##### "Prisma client not generated"
```bash
# Gerar cliente
pnpm --filter api prisma:generate
```

##### "Migration failed"
```bash
# Corrigir migração falha
pnpm --filter api db:fix:failed
```

#### Logs e Debug:
```typescript
import { logger } from "@/shared/logger";

logger.info("Iniciando processamento", { externalRequestId });
logger.error("Falha na integração", { error: err, productCode });
```

---

## 📦 TEMPLATE DE MÓDULO

### 1. ESTRUTURA COMPLETA

```
nome-do-modulo/
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

### 2. ARQUIVOS TEMPLATE POR TIPO

#### Port (Interface):
```typescript
// nome-do-modulo-[açao].gateway.ts
export type NomeDoModuloAcaoItem = { id: string; quantidade: number; };
export type NomeDoModuloAcaoResult = { sucesso: boolean; codigo: string; };
export interface NomeDoModuloAcaoGateway {
  executar(codigo: string, itens: NomeDoModuloAcaoItem[]): Promise<NomeDoModuloAcaoResult>;
}
```

#### Use Case:
```typescript
// [açao]-nome-do-modulo.usecase.ts
export type NomeDoModuloAcaoCommand = {
  externalRequestId: string;
  codigo: string;
  itens: any[];
  fonte?: "API2" | "JOB" | "ADMIN";
};

export class NomeDoModuloAcaoUseCase {
  async executar(comando: NomeDoModuloAcaoCommand) {
    // Implementação com idempotência
  }
}
```

#### Store (DB):
```typescript
// nome-do-modulo-[tipo].store.ts
export class NomeDoModuloComandoStore {
  async obterOuCriarAceito(input: CriarComandoAceitoInput) {
    // Implementação com Prisma
  }
}
```

#### Gateway Real:
```typescript
// real-nome-do-modulo-[açao].gateway.ts
export class RealNomeDoModuloAcaoGateway implements NomeDoModuloAcaoGateway {
  async executar(codigo: string, itens: NomeDoModuloAcaoItem[]) {
    // Implementação real com Omie
  }
}
```

#### Gateway Fake:
```typescript
// fake-nome-do-modulo-[açao].gateway.ts
export class FakeNomeDoModuloAcaoGateway implements NomeDoModuloAcaoGateway {
  async executar(codigo: string, itens: NomeDoModuloAcaoItem[]) {
    // Implementação fake para desenvolvimento
  }
}
```

#### Job:
```typescript
// [açao]-nome-do-modulo.job.ts
export class NomeDoModuloAcaoJob {
  async executar() {
    // Lógica do job agendado
  }
}
```

#### Job Register:
```typescript
// nome-do-modulo-jobs.register.ts
export function registrarJobsNomeDoModulo() {
  // Configura jobs agendados via cron
}
```

#### Route (Command):
```typescript
// [açao]-nome-do-modulo.route.ts
export function registrarRotaNomeDoModuloAcao(app: FastifyInstance) {
  app.post("/v1/integration/nome-do-modulo/:codigo/[açao]", async (request, reply) => {
    // Implementação da rota
  });
}
```

#### Route (Read):
```typescript
// get-[modelo]-read-model.route.ts
export function registrarRotaObterModeloLeitura(app: FastifyInstance) {
  app.get("/v1/integration/nome-do-modulo/:codigo/[modelo]", async (request, reply) => {
    // Implementação da rota de leitura
  });
}
```

#### Routes Index:
```typescript
// routes/index.ts
import type { FastifyInstance } from "fastify";
import { registrarRotaNomeDoModuloAcao } from "./commands/[açao]-nome-do-modulo.route";
import { registrarRotaObterModeloLeitura } from "./read/get-[modelo]-read-model.route";

export function registrarRotasNomeDoModulo(app: FastifyInstance) {
  registrarRotaNomeDoModuloAcao(app);
  registrarRotaObterModeloLeitura(app);
}
```

#### Routes Main:
```typescript
// routes.ts
import type { FastifyInstance } from "fastify";
import { registrarRotasNomeDoModulo } from "./routes/index";

export async function rotasIntegracaoNomeDoModulo(app: FastifyInstance) {
  registrarRotasNomeDoModulo(app);
}
```

#### Module Register:
```typescript
// nome-do-modulo-integration-register.ts
import type { FastifyInstance } from "fastify";
import { rotasIntegracaoNomeDoModulo } from "./presentation/http/routes";
import { registrarJobsNomeDoModulo } from "./infrastructure/jobs/nome-do-modulo-jobs.register";

export function criarIntegracaoNomeDoModulo() {
  return {
    nome: "nome-do-modulo-integration",
    registrar: (app: FastifyInstance) => {
      app.register(rotasIntegracaoNomeDoModulo);
      registrarJobsNomeDoModulo();
    }
  };
}
```

#### Module Index:
```typescript
// index.ts
export { criarIntegracaoNomeDoModulo } from "./nome-do-modulo-integration-register";
```

### 3. CONFIGURAÇÃO DO AMBIENTE

#### Variáveis de Ambiente (`.env`):
```env
# Gateway (fake/real)
GATEWAY_NOME_DO_MODULO=fake  # desenvolvimento
# GATEWAY_NOME_DO_MODULO=real  # produção

# Jobs agendados
HABILITAR_JOB_NOME_DO_MODULO_ACAO=false
CRON_JOB_NOME_DO_MODULO_ACAO=0 */5 * * * *
EXECUTAR_JOB_NOME_DO_MODULO_ACAO_INICIO=false
```

#### Schema do Prisma:
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

### 4. REGISTRO NO BOOTSTRAP

#### Adicionar ao `apps/api/src/bootstrap/routes.ts`:
```typescript
import { criarIntegracaoNomeDoModulo } from "@/modules/integration/nome-do-modulo";

const integrations = [
  // ... outras integrações
  criarIntegracaoNomeDoModulo(),
];
```

### 5. CHECKLIST DE IMPLEMENTAÇÃO

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

### 6. EXEMPLO COMPLETO: MÓDULO `order-sync`

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

## 🎯 RESUMO E PRÓXIMOS PASSOS

### 1. O QUE TEMOS AGORA

#### Documentação Completa:
1. **`PROJECT_VISION.md`** - Visão estratégica e regras de ouro
2. **`ARCHITECTURE_GUIDE.md`** - Arquitetura técnica detalhada
3. **`IMPORTS_LIBRARY.md`** - Biblioteca de imports padrão
4. **`NAMING_CONVENTIONS.md`** - Padrões de nomenclatura
5. **`HOW_TO_CONTRIBUTE.md`** - Guia prático para contribuir
6. **`MODULE_TEMPLATE.md`** - Template completo para módulos
7. **`PROJECT_MANUAL.md`** - Manual consolidado (este arquivo)

#### Referência Principal:
- **Módulo `product-structure`**: Implementação canônica de referência
- **Diretório `integration/`**: Foco exclusivo para novos desenvolvimentos

### 2. COMO USAR ESTE MANUAL

#### Para Desenvolvedores Novos:
1. Leia **Visão Estratégica** para entender o propósito
2. Consulte **Como Contribuir** para configurar ambiente
3. Use **Template de Módulo** para criar novos módulos
4. Siga **Padrões de Nomenclatura** para consistência

#### Para Manutenção de Código Existente:
1. Verifique **Biblioteca de Imports** para imports corretos
2. Consulte **Guia de Arquitetura** para padrões de design
3. Use **Módulo `product-structure`** como referência

#### Para Code Review:
1. Use checklists das seções relevantes
2. Verifique conformidade com padrões canônicos
3. Confirme idempotência e tratamento de erros

### 3. PRINCIPAIS PONTOS DE ATENÇÃO

#### Não Esquecer:
1. **`externalRequestId`** obrigatório em todos os commands
2. **Gateways configuráveis** (fake/real) via `.env`
3. **Estrutura canônica** imutável para novos módulos
4. **Separação de camadas** (Presentation/Application/Infrastructure)

#### Evitar:
1. Hardcode de valores (use `.env`)
2. Acoplamento direto com Omie (use gateways)
3. Mix de responsabilidades entre camadas
4. Commands sem idempotência

### 4. PRÓXIMOS PASSOS SUGERIDOS

#### Imediato:
1. **Atualizar módulos existentes** em `integration/` para seguir padrão canônico
2. **Configurar CI/CD** com validação de padrões
3. **Criar testes de integração** para módulos críticos

#### Médio Prazo:
1. **Implementar novos módulos** seguindo templates
2. **Melhorar monitoramento** e métricas
3. **Documentar APIs** com OpenAPI/Swagger

#### Longo Prazo:
1. **Expandir para outras áreas** (financeiro, etc.)
2. **Otimizar performance** de jobs e sincronizações
3. **Implementar features avançadas** baseadas em feedback

---

## 📞 SUPORTE E CONTATO

### 1. RECURSOS DISPONÍVEIS

#### Documentação:
- **Este manual**: Referência completa do projeto
- **Módulo `product-structure`**: Implementação de referência
- **Arquivos `.trae/rules/`**: Regras para assistentes AI

#### Ferramentas:
- **Scripts de scaffold**: `pnpm --filter api gen:module`
- **Métricas do projeto**: `pnpm --filter api metrics:all`
- **Documentação automática**: `pnpm --filter api docs:status`

### 2. SOLUÇÃO DE PROBLEMAS

#### Primeiros Passos:
1. **Verificar `.env`**: Configurações corretas?
2. **Gerar Prisma client**: `pnpm --filter api prisma:generate`
3. **Executar migrações**: `pnpm --filter api db:migrate:dev`

#### Problemas Comuns:
- **Imports incorretos**: Consulte `IMPORTS_LIBRARY.md`
- **Estrutura inválida**: Verifique `NAMING_CONVENTIONS.md`
- **Gateways não funcionando**: Confirme `.env` (fake/real)

### 3. CONTRIBUIÇÃO CONTÍNUA

#### Para Melhorar Este Manual:
1. **Reportar inconsistências**: Entre módulos existentes
2. **Sugerir melhorias**: Baseado em experiência prática
3. **Documentar novos padrões**: Conforme evolução do projeto

#### Para Evoluir o Projeto:
1. **Seguir padrões canônicos**: Em todos os novos desenvolvimentos
2. **Manter consistência**: Entre módulos diferentes
3. **Documentar mudanças**: Para futuros desenvolvedores

---

## 🔗 REFERÊNCIA CANÔNICA

### **Módulo `product-structure` - Implementação Viva do Padrão**
Veja `apps/api/src/modules/integration/product-structure/` como a **implementação de referência** que segue exatamente todos os padrões descritos neste manual. Use este módulo como modelo para qualquer novo desenvolvimento.

**O que encontrar**:
- ✅ Estrutura canônica completa
- ✅ Gateways por capacidade (apply/fetch)
- ✅ CommandStore com idempotência
- ✅ Jobs agendados configuráveis
- ✅ Rotas HTTP organizadas (commands/read)
- ✅ Registro correto no bootstrap

**Como usar**:
1. **Copie a estrutura**: Use como template para novos módulos
2. **Consulte os padrões**: Verifique nomenclatura, imports, organização
3. **Valide implementações**: Compare com este módulo para garantir conformidade

---

**Última atualização**: 2026-06-08  
**Responsável**: Equipe de Desenvolvimento  
**Status**: Ativo e em evolução contínua

> **Nota**: Este manual é um documento vivo. Atualize conforme o projeto evolui e novos padrões emergem.
