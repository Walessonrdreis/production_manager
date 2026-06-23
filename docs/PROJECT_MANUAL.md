# 📚 MANUAL DEFINITIVO - PRODUCTION MANAGER

**🔴 AUTORIDADE MÁXIMA DO PROJETO**
Este documento é a **fonte de verdade principal** do projeto Production Manager.
Os demais arquivos de documentação detalham aspectos específicos e **não devem contradizê‑lo**.
Para qualquer dúvida sobre padrões, arquitetura ou decisões de design, **comece aqui**.

**Versão**: 1.2.0  
**Data**: 2026-06-22  
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
7. [📄 Arquivos Obrigatórios para Atualização](#-arquivos-obrigatórios-para-atualização)
8. [🗄️ Padrão Canônico do Banco de Dados](#️-padrão-canônico-do-banco-de-dados)
9. [🔄 Padrão de Sincronização Paginada com Retry](#-padrão-de-sincronização-paginada-com-retry)
10. [📦 Shared Library de Integração](#-shared-library-de-integração)

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
            ├── commands/          # POST — intenções (criam, atualizam, sincronizam)
            ├── callbacks/         # POST — respostas (confirmam, falham)
            └── read/              # GET — consultas do espelho local
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

# Queue Processor (fila de comandos assíncrona)
ENABLE_OMIE_PRODUCTION_ORDER_QUEUE_JOB=true
OMIE_PRODUCTION_ORDER_QUEUE_CRON=* * * * * *

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

### 4. 📚 DOCUMENTAÇÃO DE DECISÕES ARQUITETURAIS

> **📌 FONTE DE VERDADE PARA DECISÕES FUNDAMENTAIS**:  
> → **[DECISIONS.md](./DECISIONS.md)** - Architectural Decisions Record (ADR) com racional, consequências e alternativas

#### Propósito:
- Preservar o *racional* por trás das decisões arquiteturais
- Evitar reabrir discussões já resolvidas
- Ajudar novos devs, revisores e agentes AI a entender *por que* o sistema é assim

#### Decisões Fundamentais Documentadas:

| ADR | Título | Status | Relevância para o Manual |
|-----|--------|--------|--------------------------|
| **ADR‑001** | Banco de Dados Único com Ownership por Tipo de Dado | ✅ Aceita | Define estrutura de dados compartilhados entre APIs |
| **ADR‑002** | Separação Clara entre API 1 (Integração) e API 2 (Domínio) | ✅ Aceita | Estabelece responsabilidades de cada API |
| **ADR‑003** | Gateway representa CAPACIDADE, não Módulo | ✅ Aceita | Princípio de design para gateways |
| **ADR‑004** | Strategy Fake / Real por Capacidade | ✅ Aceita | Padrão para desenvolvimento e produção |
| **ADR‑005** | Idempotência Obrigatória em Comandos de Integração | ✅ Aceita | Garantia de execução única |
| **ADR‑006** | `index.ts` só exporta `register` em módulos com registro explícito | ✅ Aceita | Evita double registration |
| **ADR‑007** | Frontend chamando Omie diretamente (rejeitada) | ❌ Rejeitada | Mantém anti-corruption layer intacta |
| **ADR‑008** | Command Queue Pattern para Rate-Limit e Concorrência | ✅ Aceita | Fila assíncrona com FOR UPDATE SKIP LOCKED |

> **📌 NOTA**: Para detalhes completos, racional, consequências e alternativas, consulte o documento completo: **[DECISIONS.md](./DECISIONS.md)**

#### Como Usar:
- **Para entender decisões**: Consulte `DECISIONS.md` antes de questionar arquitetura existente
- **Para propor mudanças**: Entenda primeiro o racional das decisões atuais
- **Para documentar novas decisões**: Adicione ADR seguindo formato canônico

### 5. SISTEMA DE JOBS AGENDADOS

#### Configuração:
```env
ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB=false
OMIE_PRODUCT_STRUCTURE_SYNC_CRON=0 */12 * * * *
```

#### Tipos de Jobs:
- **Sincronização**: Traz dados do Omie para o espelho local
- **Reconciliação**: Detecta e corrige divergências
- **Processamento em lote**: Executa operações em massa
- **Queue Processor**: Consome fila de comandos (`PENDING → PROCESSING → CONFIRMED/FAILED`) com rate-limit entre chamadas Omie

#### Convenção de Nomenclatura para Queue Processor:
```env
ENABLE_OMIE_{MODULO}_QUEUE_JOB=true
OMIE_{MODULO}_QUEUE_CRON="* * * * * *"  # A cada 1 segundo
```

### 5. PADRÃO CANÔNICO: COMMAND + CALLBACK + READ + JOB

#### Para cada entidade de integração:
1. **Command** (`POST`): Intenção que **sai do sistema** (enfileira → eventual-consistente)
2. **Callback** (`POST`): Resposta que **entra no sistema** (confirmar/falhar comando, webhook-ready)
3. **Read** (`GET`): Consulta do espelho local (sem efeitos colaterais)
4. **Job**: Processamento assíncrono agendado (queue processor, reconciliação)

#### Exemplo `production-order`:
- `POST /commands/create` — Command (enfileira, retorna 202)
- `POST /callbacks/:id/confirm` — Callback (confirma execução)
- `POST /callbacks/:id/fail` — Callback (registra falha)
- `GET /read/production-orders` — Read (lista espelho local)
- `GET /read/production-orders/:omieCode` — Read (detalhe)
- `GET /read/production-orders/stats` — Read (estatísticas)
- `GET /read/production-orders/queue` — Read (status da fila)
- `GET /commands/:externalRequestId` — Tracking (rastreio de comando)
- `Job process-production-order-queue` — Queue processor (consome fila)

---

### 6. ORGANIZAÇÃO DE ROTAS HTTP (CANÔNICO)

#### Hierarquia de Path:
```
/v1/integration/{modulo}/
├── commands/{comando}          # POST — intenção que SAI do sistema
├── callbacks/:id/{acao}        # POST — resposta que ENTRA no sistema
├── read/{...}                  # GET — consulta do espelho local
└── commands/:id                # GET — tracking de um comando específico
```

#### 6.1 Commands — Intenção que Sai do Sistema
- **Método**: `POST`
- **Response**: `202 Accepted` (eventual-consistente)
- **Body obrigatório**: `externalRequestId` (idempotência)
- **Processamento**: Enfileira (`PENDING`) → Queue Processor executa assincronamente
- **Exemplos**:
  - `POST /v1/integration/production-orders/commands/create`
  - `POST /v1/integration/production-orders/commands/update`
  - `POST /v1/integration/production-orders/commands/cancel`
  - `POST /v1/integration/production-orders/commands/sync-global`

#### 6.2 Callbacks — Resposta que Entra no Sistema
- **Método**: `POST`
- **Response**: `200 OK` (processamento imediato)
- **Propósito**: Confirmar ou falhar um comando previamente enfileirado
- **Preparado para webhooks futuros**: Omie pode chamar callback quando processar
- **Exemplos**:
  - `POST /v1/integration/production-orders/callbacks/:externalRequestId/confirm`
  - `POST /v1/integration/production-orders/callbacks/:externalRequestId/fail`

#### 6.3 Reads — Consulta do Espelho Local
- **Método**: `GET`
- **Response**: `200 OK`
- **Sem efeitos colaterais**: Apenas consulta o banco local (espelho Omie)
- **Exemplos**:
  - `GET /v1/integration/read/production-orders`
  - `GET /v1/integration/read/production-orders/:omieCode`
  - `GET /v1/integration/read/production-orders/stats`
  - `GET /v1/integration/read/production-orders/queue`
  - `GET /v1/integration/read/production-orders/queue/failures`

#### 6.4 Tracking — Rastreio de Comando
- **Método**: `GET`
- **Response**: `200 OK`
- **Exemplo**:
  - `GET /v1/integration/production-orders/commands/:externalRequestId`

#### 6.5 Estrutura de Pastas (Rotas)
```
presentation/http/routes/
├── commands/          # POST handlers para intenções
│   ├── create.route.ts
│   ├── update.route.ts
│   └── sync-global.route.ts
├── callbacks/         # POST handlers para respostas
│   ├── confirm.route.ts
│   └── fail.route.ts
└── read/             # GET handlers para consultas
    ├── list.route.ts
    ├── get-by-code.route.ts
    ├── stats.route.ts
    ├── queue.route.ts
    └── queue-failures.route.ts
```

#### Versionamento:
- `v1/`: API atual (estável)
- Sempre incluir `integration/` no path para módulos de integração

#### 🚫 O que NÃO usar (nomenclatura obsoleta):
```
❌ /product-structure/{codigo}/apply       — parece CRUD, é comando
❌ /production-order/{omieCode}/update     — parece CRUD, é comando
❌ /production-order/{extId}/confirm       — é callback, não comando
```
A nomenclatura antiga (`/{entidade}/{id}/{ação}`) **não deve ser usada em módulos novos**.
Use a hierarquia `/commands/`, `/callbacks/`, `/read/` para deixar explícita a semântica.

### 7. BOOTSTRAP E REGISTRO DE MÓDULOS

#### Arquivo principal: `apps/api/src/bootstrap/routes.ts`
```typescript
const integrations = [
  createProductStructureIntegration(),
  createSalesOrderSyncIntegration(),
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
- **Armazenar status**: Mantém estados (PENDING / PROCESSING / ACCEPTED / CONFIRMED / FAILED)
- **Permitir retry seguro**: Rastreia tentativas e permite retentativas controladas
- **Base para observabilidade**: Fornece logs e métricas para monitoramento

> 💡 **Callbacks** não passam pelo CommandStore pois **não são comandos**.
> Callbacks (`POST /callbacks/:id/confirm|fail`) atualizam diretamente o status
> de um comando existente — são respostas que entram no sistema.

**Dois modos de operação**:
- **Síncrono (legacy)**: `getOrCreateAccepted()` → cria com status `ACCEPTED`, executa imediatamente
- **Assíncrono (Command Queue)**: `enqueue()` → cria com status `PENDING`, processado pelo Queue Processor job

**Exemplo de uso (síncrono)**:
```typescript
// No use case de comando
const existing = await commandStore.findByExternalRequestId(externalRequestId);
if (existing) {
  return { status: existing.status, externalRequestId };
}
```

**Exemplo de uso (Command Queue)**:
```typescript
// Na rota — apenas enfileira e retorna 202
const { record, created } = await commandStore.enqueue({
  externalRequestId,
  commandType: "CREATE_OP",
  source: "API2",
  payload: { productId, quantity },
});
return reply.code(202).send({ status: "PENDING", externalRequestId });
```

#### 4. Command Queue Pattern (Processamento Assíncrono)

**Propósito**: Evitar chamadas simultâneas ao Omie, garantindo rate-limit de 1 chamada/segundo via fila.

> 📌 **Decisão arquitetural**: Consulte **[ADR-008](./DECISIONS.md)** para racional completo, alternativas e consequências deste padrão.

**Fluxo**:
```
Rota POST → enqueue(PENDING)
                ↓
Queue Processor job (a cada 1s)
                ↓
        dequeue() → FOR UPDATE SKIP LOCKED
                ↓
         status = PROCESSING
                ↓
       Executa comando (Omie)
                ↓
         CONFIRMED ou FAILED
```

**Status da fila**:
- `PENDING` — Aguardando processamento
- `PROCESSING` — Em execução (protegido contra concorrência via SKIP LOCKED)
- `CONFIRMED` — Executado com sucesso
- `FAILED` — Falha na execução

**Garantias**:
- **Atômico**: `dequeue()` usa `SELECT ... FOR UPDATE SKIP LOCKED` — sem concorrência entre workers
- **Rate-limit**: 1 segundo entre chamadas Omie (via `sleep(1000)` no processor)
- **Idempotência**: `enqueue()` retorna registro existente se `externalRequestId` duplicado
- **Recuperação**: Jobs travados por >60s são detectados como stalled e podem ser retomados

#### 5. Anti-corruption Layer
- API 1 traduz payloads do Omie
- Domínio interno não conhece detalhes do Omie
- Isolamento de mudanças no Omie

#### 6. Strategy Pattern
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
- **Exemplo**: `product-structure`, `sales-order-sync`, `customer-management`
  > **📌 IMPORTANTE**: Para semântica de domínio, consulte [DOMAIN_NAMING_GUIDE.md](./DOMAIN_NAMING_GUIDE.md). Use "Entidade Específica + Capacidade" (ex: `sales-order-sync`, não `order-integration`).

#### Diretórios Obrigatórios:
```
nome-do-modulo/
├── application/
│   ├── dto/                                           # DTOs de entrada/saída dos use cases
│   │   ├── sync-nome-do-modulo.dto.ts
│   │   ├── sync-all-nome-do-modulo.dto.ts
│   │   ├── get-nome-do-modulo-read-model.dto.ts
│   │   └── get-nome-do-modulo-production-ready.dto.ts
│   ├── mappers/                                       # Mapeamento entre domínios
│   │   └── map-omie-[entidade]-to-summary.ts
│   ├── ports/                                         # Interfaces (Ports)
│   │   ├── nome-do-modulo-fetch.gateway.ts
│   │   ├── nome-do-modulo-fetch-page.gateway.ts
│   │   └── nome-do-modulo-fetch-page.ts
│   ├── use-cases/                                     # Casos de uso
│   │   ├── sync-nome-do-modulo.usecase.ts
│   │   ├── sync-all-nome-do-modulo.usecase.ts
│   │   ├── get-nome-do-modulo-read-model.usecase.ts
│   │   ├── get-nome-do-modulo-summary.usecase.ts
│   │   ├── get-nome-do-modulo-production-ready.usecase.ts
│   │   └── refresh-nome-do-modulo-production-ready.usecase.ts
│   └── utils/                                         # Utilitários do módulo
│       └── query.utils.ts
├── infrastructure/
│   ├── db/                                            # Repositórios/Stores
│   │   ├── nome-do-modulo-command.store.ts
│   │   ├── nome-do-modulo-integration.store.ts
│   │   ├── nome-do-modulo-read-model.store.ts
│   │   └── nome-do-modulo-aggregation.store.ts
│   ├── gateways/                                      # Gateways organizados por capacidade
│   │   ├── fetch/
│   │   │   ├── fake-nome-do-modulo-fetch.gateway.ts
│   │   │   └── real-nome-do-modulo-fetch.gateway.ts
│   │   └── fetch-page/
│   │       ├── fake-nome-do-modulo-fetch-page.gateway.ts
│   │       └── real-nome-do-modulo-fetch-page.gateway.ts
│   └── jobs/                                          # Jobs agendados
│       ├── refresh-nome-do-modulo-production-ready.job.ts
│       └── nome-do-modulo-jobs.register.ts
├── presentation/
│   └── http/                                          # Interface HTTP
│       ├── index.ts
│       ├── openapi.ts                                 # Documentação OpenAPI do módulo
│       ├── routes.ts                                  # Agregador de rotas
│       └── routes/
│           ├── Routes.md                              # Documentação das rotas
│           ├── commands/                              # Rotas de comando (POST)
│           │   ├── sync-nome-do-modulo.route.ts
│           │   ├── sync-all-nome-do-modulo.route.ts
│           │   └── refresh-nome-do-modulo-production-ready.route.ts
│           └── read/                                  # Rotas de leitura (GET)
│               ├── get-nome-do-modulo-read-model.route.ts
│               ├── get-nome-do-modulo-summary.route.ts
│               ├── get-nome-do-modulo-production-ready.route.ts
│               ├── get-nome-do-modulo-stats.route.ts
│               ├── get-nome-do-modulo-last-sync.route.ts
│               ├── get-nome-do-modulo-sync-status.route.ts
│               ├── get-nome-do-modulo-sync-history.route.ts
│               └── get-nome-do-modulo-sync-failures.route.ts
├── index.ts
├── nome-do-modulo-integration-register.ts
└── README.md                                          # Documentação do módulo
```

> 💡 **Referência real**: Consulte o módulo `product-catalog` em `apps/api/src/modules/integration/product-catalog/` como implementação de referência completa.

### 2. NOMENCLATURA DE ARQUIVOS

| Tipo de Arquivo | Padrão | Exemplo |
|----------------|--------|---------|
| **DTO** | `[ação]-nome-do-modulo.dto.ts` | `sync-product-catalog.dto.ts` |
| **Mapper** | `map-[origem]-[entidade]-to-[destino].ts` | `map-omie-product-to-summary.ts` |
| **Utils** | `[contexto].utils.ts` | `query.utils.ts` |
| **Port (Interface)** | `nome-do-modulo-[ação].gateway.ts` | `product-catalog-fetch-page.gateway.ts` |
| **Use Case** | `[ação]-nome-do-modulo.usecase.ts` | `sync-product-catalog.usecase.ts` |
| **Store (DB)** | `nome-do-modulo-[tipo].store.ts` | `product-catalog-command.store.ts` |
| **Gateway Real** | `real-nome-do-modulo-[ação].gateway.ts` | `real-product-catalog-fetch.gateway.ts` |
| **Gateway Fake** | `fake-nome-do-modulo-[ação].gateway.ts` | `fake-product-catalog-fetch.gateway.ts` |
| **Job** | `[ação]-nome-do-modulo.job.ts` | `refresh-product-catalog-production-ready.job.ts` |
| **Job Register** | `nome-do-modulo-jobs.register.ts` | `product-catalog-jobs.register.ts` |
| **Route (Command)** | `[ação]-nome-do-modulo.route.ts` | `sync-product-catalog.route.ts` |
| **Route (Read)** | `get-nome-do-modulo-[modelo].route.ts` | `get-product-catalog-production-ready.route.ts` |
| **Module Register** | `nome-do-modulo-integration-register.ts` | `product-catalog-integration-register.ts` |
| **OpenAPI** | `openapi.ts` | `openapi.ts` |
| **README** | `README.md` | `README.md` |
| **Routes Doc** | `Routes.md` | `Routes.md` |

### 3. NOMENCLATURA DE CLASSES

#### Padrão PascalCase:
| Tipo de Classe | Padrão | Exemplo |
|----------------|--------|---------|
| **DTO** | `[Ação]NomeDoModulo[Modelo]Dto` | `SyncProductCatalogDto` |
| **Mapper** | `Map[Nome]To[Nome]` | `MapOmieProductToSummary` |
| **Use Case** | `[Ação]NomeDoModuloUseCase` | `SyncProductCatalogUseCase` |
| **Store** | `NomeDoModulo[Tipo]Store` | `ProductCatalogCommandStore` |
| **Gateway Real** | `RealNomeDoModulo[Ação]Gateway` | `RealProductCatalogFetchGateway` |
| **Gateway Fake** | `FakeNomeDoModulo[Ação]Gateway` | `FakeProductCatalogFetchGateway` |
| **Job** | `[Ação]NomeDoModuloJob` | `RefreshProductCatalogProductionReadyJob` |

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
PRODUCTION_ORDER_GATEWAY=fake  # Use 'real' em produção
PRODUCT_STRUCTURE_GATEWAY=fake  # Use 'fake' para desenvolvimento

# Command Queue (fila de comandos assíncrona)
ENABLE_OMIE_PRODUCTION_ORDER_QUEUE_JOB=true
OMIE_PRODUCTION_ORDER_QUEUE_CRON=* * * * * *
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
1. **Escolher nome**: `kebab-case` (ex: `sales-order-sync`)
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

### 📋 CONTRATO TÉCNICO DA API 1

> **📌 FONTE DE VERDADE PARA CONSUMIDORES**:  
> → **[ROUTES.md](../../apps/api/ROUTES.md)** - Documentação canônica de todas as rotas públicas

#### Propósito do Contrato:
1. **API 2**: Consumidor principal - usa como referência obrigatória
2. **Desenvolvedores**: Implementação consistente de novos módulos
3. **Agentes AI**: Documentação precisa para automação e suporte

#### Estrutura Canônica do Contrato:
```
## [NOME DO MÓDULO] — [DESCRIÇÃO DO DOMÍNIO]

### ✅ Responsabilidades do módulo
- ✅ [Responsabilidade específica]
- ❌ [O que NÃO faz]

### ✅ Rota — [Nome da funcionalidade]
[MÉTODO] [PATH]

#### Query params suportados
- [param]=[valores]

#### Payload (se aplicável)
```json
{
  "externalRequestId": "<string>"
}
```

#### Descrição
* [Comportamento específico]
* [Regras de negócio]

### ✅ Exemplo de resposta
```json
{
  "status": "ACEITO"
}
```

*** [Separador entre módulos]
```

#### Regras Canônicas para Comandos:
1. **Idempotência**: Todos os comandos são idempotentes por `externalRequestId`
2. **External Request ID**: Campo obrigatório em todos os payloads
3. **Status Code**: Retorna **202 Accepted** para comandos aceitos
4. **Gateway Control**: Fake/Real controlado por env (`{MODULO}_GATEWAY=fake|real`)
5. **Anti-Corruption**: Executa lógica exclusivamente via API 1

#### Template para Novos Módulos:
- **Exemplo canônico**: `sales-order-sync` - Sincronização bidirecional de pedidos de venda
- **Estrutura**: `/v1/integration/[nome-do-modulo]/:identificador/[ação]`
- **Documentação**: Adicionar seção em `ROUTES.md` seguindo template canônico

#### Como Usar o Contrato:
1. **Para consumir API 1**: Consulte `ROUTES.md` para rotas disponíveis
2. **Para criar novo módulo**: Siga template em `ROUTES.md` seção "TEMPLATE PARA NOVOS MÓDULOS"
3. **Para manter consistência**: Atualize `ROUTES.md` ao adicionar novas rotas

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

### 6. EXEMPLO COMPLETO: MÓDULO `sales-order-sync`

> **⚠️ IMPORTANTE**: Usamos `sales-order-sync` (específico) em vez de `orders-sync` (genérico) para:
> - **Clareza de domínio**: "sales order" vs "production order" vs "purchase order"
> - **Ownership explícito**: API 1 escreve espelho Omie, API 2 escreve domínio interno
> - **Consistência canônica**: Segue padrão "entidade específica + capacidade"
> 
> **📌 Consulte**: [DOMAIN_NAMING_GUIDE.md](DOMAIN_NAMING_GUIDE.md) para padrões completos de nomenclatura de domínio.

```
sales-order-sync/
├── application/
│   ├── ports/
│   │   └── sales-order-sync-fetch.gateway.ts
│   └── use-cases/
│       └── sync-sales-order.usecase.ts
├── infrastructure/
│   ├── db/
│   │   └── sales-order-sync-command.store.ts
│   ├── gateways/
│   │   ├── fetch/
│   │   │   ├── real-sales-order-sync-fetch.gateway.ts
│   │   │   └── fake-sales-order-sync-fetch.gateway.ts
│   └── jobs/
│       ├── reconcile-sales-orders.job.ts
│       └── sales-order-sync-jobs.register.ts
├── presentation/
│   └── http/
│       ├── routes/
│       │   ├── commands/
│       │   │   └── sync-sales-order.route.ts
│       │   └── read/
│       │       └── get-sales-order-status.route.ts
│       ├── routes.ts
│       └── index.ts
├── index.ts
└── sales-order-sync-integration-register.ts
```

---

## 📄 ARQUIVOS OBRIGATÓRIOS PARA ATUALIZAÇÃO

Ao criar um **novo módulo de integração**, você **DEVE** atualizar **4 arquivos obrigatórios** para manter a consistência arquitetural do projeto:

### 1️⃣ `apps/api/src/bootstrap/routes.ts`
**Propósito**: Registrar o módulo no sistema de rotas da API 1
**Obrigatório**: ✅ SIM (sempre)
**Exemplo**:
```typescript
import { criarIntegracaoSalesOrderSync } from "@/modules/integration/sales-order-sync";

const integrations = [
  // ... outras integrações
  criarIntegracaoSalesOrderSync(),
];
```

### 2️⃣ `apps/api/ROUTES.md`
**Propósito**: Documentar as rotas públicas seguindo template canônico
**Obrigatório**: ✅ SIM (sempre)
**Exemplo**: Copiar seção "📋 TEMPLATE PARA NOVOS MÓDULOS" e substituir `[nome-do-modulo]` por nome canônico

### 3️⃣ `docs/DECISIONS.md` (se aplicável)
**Propósito**: Documentar decisões arquiteturais específicas do módulo
**Obrigatório**: 🟡 CONTEXTUAL (apenas se houver decisão não‑óbvia)
**Quando usar**: 
- Módulo introduz novo padrão de integração
- Decisão afeta múltiplos módulos futuros
- Trade-off significativo foi considerado

### 4️⃣ `docs/DB_SCHEMA_GUIDE.md` (se aplicável)
**Propósito**: Documentar schema específico do módulo
**Obrigatório**: 🟡 CONTEXTUAL (apenas se criar novas tabelas)
**Quando usar**: 
- Módulo requer novas tabelas no banco
- Schema segue padrão canônico diferente
- Precisa documentar relações complexas

### 📌 CHECKLIST DE COMPLIANCE
- [ ] Módulo registrado em `bootstrap/routes.ts`
- [ ] Rotas documentadas em `ROUTES.md` seguindo template
- [ ] Nome canônico segue `DOMAIN_NAMING_GUIDE.md`
- [ ] Decisões arquiteturais registradas (se aplicável)
- [ ] Schema documentado (se aplicável)

---

## 🗄️ PADRÃO CANÔNICO DO BANCO DE DADOS

> O banco de dados do projeto é **único e compartilhado**, mas com **ownership estrito por tipo de dado**.

### Princípios Imutáveis

#### API 1 Escreve:
- **Espelhos do Omie**: Dados brutos como cópia local do Omie
- **Comandos de integração**: Garantia de idempotência para ações
- **Read‑models**: Cache materializado para consultas frequentes  
- **Locks e controle de jobs**: Coordenação de execução concorrente

#### API 2 Escreve:
- **Dados de domínio**: Decisões humanas e estado interno
- **Estados internos**: Informações que não existem no Omie
- **Configurações de usuário**: Preferências e personalizações

#### Regra Fundamental:
> **Nunca existe escrita concorrente de API 1 e API 2 na mesma tabela.**

### Classificação Obrigatória

Toda tabela **DEVE** se enquadrar em um dos tipos canônicos:

| Tipo | Prefixo/Sufixo | Ownership | Propósito |
|------|---------------|-----------|-----------|
| **Espelho Omie** | `omie_` prefix | API 1 | Armazenar dados brutos do Omie |
| **Comando** | `_command` suffix | API 1 | Garantir idempotência de comandos |
| **Integração Processada** | `_integration` suffix | API 1 | Estado processado da integração |
| **Read‑model** | `_read_model` suffix | API 1 | Cache materializado para consultas |
| **Domínio Interno** | Sem prefixo | API 2 | Decisões humanas e estado interno |
| **Lock/Controle** | `_lock` suffix | API 1 | Coordenação de execução concorrente |
| **Sync State** | `_sync_state` suffix | API 1 | Checkpoint de sincronização incremental |

### Documento de Referência Obrigatório

📌 **Para detalhes completos de implementação, consulte:**
→ **[DB_SCHEMA_GUIDE.md](DB_SCHEMA_GUIDE.md)** - Guia canônico completo de schema

> **IMPORTANTE**: O Prisma schema **não define o padrão** — ele **implementa** o padrão descrito no `DB_SCHEMA_GUIDE.md`.

---

## 🔄 PADRÃO DE SINCRONIZAÇÃO PAGINADA COM RETRY

### 1. PROBLEMA

Módulos que consomem APIs paginadas do Omie (ex: `ListarEstruturas`, `ListarPedidosVenda`) enfrentam:
- **Falhas intermitentes**: Omie pode retornar erro "consumo redundante" ou timeout
- **Grande volume**: Alguns endpoints têm centenas de páginas (ex: 566 páginas de estruturas)
- **Sem checkpoint**: Se o sync falha na página 300, recomeça do zero
- **Custo desnecessário**: Sempre busca TODAS as páginas, mesmo quando só mudaram poucos registros

### 2. SOLUÇÃO CANÔNICA: `fetchPageWithRetry` + `SyncStateStore`

```
┌──────────────────────────────────────────────────────────┐
│                    Use Case (sync-all-x)                  │
│                                                          │
│  1. getOrCreateAccepted(externalRequestId)               │
│  2. getState().lastSyncAt → incremental window           │
│  3. page = 1                                             │
│  4. while page < maxPages:                               │
│       result = fetchPageWithRetry({ page, updatedSince }) │
│       for each item: save()                              │
│       if !hasNextPage: break                             │
│       page++                                             │
│  5. updateLastSync(now)                                  │
│  6. markConfirmed()                                      │
│  7. refresh read-models (se configurado)                 │
└──────────────────────────────────────────────────────────┘
```

### 3. MECANISMOS OBRIGATÓRIOS

#### a. `SyncStateStore` — Sincronização Incremental

Persiste `lastSyncAt` para que cada execução busque **apenas dados alterados desde a última execução**.

```typescript
// infrastructure/db/x-sync-state.store.ts
export class XSyncStateStore {
  async getState() {
    return prisma.xSyncState.upsert({
      where: { id: "GLOBAL" },
      update: {},
      create: { id: "GLOBAL", lastSyncAt: new Date("2000-01-01") },
    });
  }
  async updateLastSync(date: Date) {
    return prisma.xSyncState.update({
      where: { id: "GLOBAL" },
      data: { lastSyncAt: date },
    });
  }
}
```

**Prisma Model:**
```prisma
model XSyncState {
  id         String   @id
  lastSyncAt DateTime @map("last_sync_at")
  updatedAt  DateTime @updatedAt

  @@map("x_sync_state")
  @@schema("integration")
}
```

#### b. `fetchPageWithRetry()` — Resiliência a Falhas

```typescript
private async fetchPageWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: {
    label: string;              // Nome do módulo (ex: "product-structure")
    externalRequestId: string;
    page: number;
    pageSize: number;
    maxAttempts?: number;       // default: 3
    maxRedundantWaits?: number; // default: 5
  }
): Promise<T>
```

**Comportamento:**
- **Tentativa 1**: Chama a API normalmente
- **Erro "consumo redundante"**: Extrai tempo de espera da mensagem (`/aguarde\s+(\d+)\s+segundos/i`), espera +2s, retenta (mesmo attempt)
- **Máximo de waits redundantes**: 5 — depois disso, propaga erro
- **Demais erros**: Backoff exponencial (1s, 2s, 3s) por até `maxAttempts` tentativas
- **Logging**: Cada retry é logado com `externalRequestId`, página, tentativa

#### c. Porta com Input Object e Metadados

A porta `fetch-page` DEVE usar **input object** (não parâmetros soltos) e retornar metadados de progresso:

```typescript
// ✅ CORRETO - Input object + metadados
export type XFetchPageInput = {
  page: number;
  pageSize: number;
  updatedSince?: Date;    // Para sync incremental
};

export type XFetchPageResult = {
  items: XItem[];
  hasNextPage: boolean;
  totalPages: number | null;  // ✅ Metadado de progresso
  currentPage: number;         // ✅ Metadado de progresso
};

export interface XFetchPageGateway {
  fetchPage(input: XFetchPageInput): Promise<XFetchPageResult>;
}

// ❌ ERRADO - Parâmetros soltos, sem metadados
// fetchPage(page: number, pageSize: number): Promise<{ items, hasNextPage }>
```

#### d. Pós-sync Refresh

Ao finalizar o sync, **DEVE** disparar refresh dos read-models impactados:
- `summary` (estatísticas de espelhamento)
- `production-readiness` (se aplicável)

### 4. MÓDULOS QUE IMPLEMENTAM (REFERÊNCIA)

| Módulo | `fetchPageWithRetry` | `SyncStateStore` | `totalPages` | Pós-sync refresh |
|--------|:---:|:---:|:---:|:---:|
| **`sales-order-sync`** | ✅ Completo | ✅ | ✅ | ✅ summary |
| **`customer-sync`** | ✅ Completo | ✅ | ✅ | ❌ |
| **`product-stock-fetch`** | ✅ Parcial | ✅ | ✅ | ❌ |
| **`product-structure`** | ⏳ Em evolução | ⏳ Em evolução | ⏳ Em evolução | ⏳ |
| **`product-catalog`** | ❌ Pendente | ❌ Pendente | ❌ | ⚠️ Parcial |

> 💡 **Módulo de referência para paginação**: `sales-order-sync` — implementação mais completa com retry, incremental, redundant handling e pós-sync refresh.

### 5. EVOLUÇÃO FUTURA: SHARED LIBRARY

O padrão `fetchPageWithRetry` + `extractRedundantWaitSeconds` + `sleep` está **duplicado** em 3 módulos. A evolução planejada é extrair para `apps/api/src/shared/integration/strategies/`:

```
shared/integration/strategies/
├── retry.strategy.ts       # fetchPageWithRetry() genérico
├── sync-state.store.ts     # SyncStateStore interface + Prisma impl
└── types.ts                # PaginatedSyncInput, PaginatedSyncMeta
```

**Benefícios:**
- Zero duplicação de código
- Testes unitários uma única vez
- Consistência entre módulos
- Um ponto para ajustar timeouts e políticas de retry

---

## 📦 SHARED LIBRARY DE INTEGRAÇÃO

### 1. PROPÓSITO

Centralizar padrões reutilizáveis de integração que hoje estão duplicados entre módulos:

| Padrão | Onde está hoje | Destino |
|--------|---------------|---------|
| `fetchPageWithRetry()` | 3 módulos (copiado) | `shared/integration/strategies/retry.strategy.ts` |
| `SyncStateStore` | 3 módulos (similar) | `shared/integration/strategies/sync-state.store.ts` |
| `extractRedundantWaitSeconds()` | 3 módulos (copiado) | `shared/integration/strategies/retry.strategy.ts` |

### 2. ESTRUTURA PREVISTA

```
apps/api/src/shared/integration/
├── strategies/
│   ├── retry.strategy.ts        # fetchPageWithRetry() genérico
│   ├── sync-state.store.ts      # Interface + PrismaSyncStateStore
│   └── types.ts                 # Tipos compartilhados
└── README.md                    # Documentação
```

### 3. USO (QUANDO IMPLEMENTADO)

```typescript
// Antes (cada módulo copia o padrão)
private async fetchPageWithRetry(input: ...) { /* 50 linhas */ }

// Depois (usa shared)
import { fetchPageWithRetry } from "@/shared/integration/strategies/retry.strategy";

const result = await fetchPageWithRetry(
  () => gateway.fetchPage({ page, pageSize, updatedSince }),
  { label: "product-structure", externalRequestId, page, pageSize }
);
```

### 4. PRIORIDADE DE IMPLEMENTAÇÃO

1. **`product-structure`** — Alvo imediato (já tem Fases 1-4 completas)
2. **Criar shared library** — Extrair dos módulos existentes
3. **`product-catalog`** — Retrofit com o padrão
4. **`production-orders`** — Análise (pode não usar paginação Omie)
5. **Retrofit** — `customer-sync`, `product-stock-fetch` usarem a shared

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
7. **`DB_SCHEMA_GUIDE.md`** - Guia canônico de schema do banco
8. **`PROJECT_MANUAL.md`** - Manual consolidado (este arquivo)

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
1. **Criar shared library** de estratégias de integração (`retry.strategy.ts`, `sync-state.store.ts`)
2. **Evoluir `product-structure`** com `fetchPageWithRetry` + `SyncStateStore` + sync incremental
3. **Retrofit `product-catalog`** com o padrão de paginação robusta
4. **Configurar CI/CD** com validação de padrões
5. **Criar testes de integração** para módulos críticos

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

### `product-structure` — Estrutura Canônica do Módulo

Veja `apps/api/src/modules/integration/product-structure/` como a **implementação de referência** que segue exatamente todos os padrões descritos neste manual. Use este módulo como modelo para qualquer novo desenvolvimento.

**O que encontrar**:
- ✅ Estrutura canônica completa
- ✅ Gateways por capacidade (apply/fetch/delete)
- ✅ CommandStore com idempotência
- ✅ OpenAPI documentado
- ✅ Jobs agendados configuráveis
- ✅ Rotas HTTP organizadas (commands/read)
- ✅ DTOs e mappers
- ✅ Registro correto no bootstrap

**Como usar**:
1. **Copie a estrutura**: Use como template para novos módulos
2. **Consulte os padrões**: Verifique nomenclatura, imports, organização
3. **Valide implementações**: Compare com este módulo para garantir conformidade

---

### `sales-order-sync` — Padrão de Paginação Robusta

Veja `apps/api/src/modules/integration/sales-order-sync/` como referência para sincronização paginada com retry, detecção de consumo redundante, sincronização incremental e pós-sync refresh.

**O que encontrar**:
- ✅ `fetchPageWithRetry()` com 3 tentativas e backoff exponencial
- ✅ Detecção de erro "consumo redundante" da API Omie
- ✅ `SyncStateStore` para sincronização incremental (apenas dados alterados)
- ✅ `totalPages` e `currentPage` como metadados de progresso
- ✅ Pós-sync refresh de read-models (summary)
- ✅ Porta com input object (`SalesOrderFetchPageInput`)

**Diferença crítica para `product-structure`**:
`product-structure` é o template de **estrutura do módulo** (pastas, nomenclatura, arquivos).
`sales-order-sync` é o template de **comportamento de sincronização** (retry, incremental, resiliência).
Novos módulos devem combinar **ambos**: a estrutura de `product-structure` com o comportamento de `sales-order-sync`.

---

**Última atualização**: 2026-06-22  
**Responsável**: Equipe de Desenvolvimento  
**Status**: Ativo e em evolução contínua

> **Nota**: Este manual é um documento vivo. Atualize conforme o projeto evolui e novos padrões emergem.
