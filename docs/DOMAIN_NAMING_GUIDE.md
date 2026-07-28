# 🏷️ Guia Canônico de Nomenclatura de Domínio

**🔴 AUTORIDADE MÁXIMA PARA NOMENCLATURA DE DOMÍNIO**

Este documento define o **padrão canônico** para nomenclatura de entidades, módulos e capacidades no projeto Production Manager. Ele **complementa** o `NAMING_CONVENTIONS.md` com foco específico em **semântica de domínio**.

**⚠️ REGRA FUNDAMENTAL**: Nomes genéricos (`order`, `data`, `item`) são **proibidos**. Sempre use **entidade específica + capacidade**.

---

## 📋 ÍNDICE

1. [Princípio Fundamental](#1-princípio-fundamental)
2. [Categorias de Entidades](#2-categorias-de-entidades)
3. [Capacidades Canônicas](#3-capacidades-canônicas)
4. [Regras de Ouro](#4-regras-de-ouro)
5. [Exemplos Canônicos vs Problemáticos](#5-exemplos-canônicos-vs-problemáticos)
6. [Mapeamento: Schema ↔ Módulo ↔ Gateway](#6-mapeamento-schema--módulo--gateway)
7. [Checklist de Compliance](#7-checklist-de-compliance)

---

## 1️⃣ PRINCÍPIO FUNDAMENTAL

> **"Nome = Entidade Específica + Capacidade"**

### ❌ O que NÃO fazer:
```typescript
// Nomes genéricos (proibidos)
orders
data
items
documents
sync
management
```

### ✅ O que FAZER:
```typescript
// Entidade específica + capacidade (obrigatório)
sales-order-sync
production-data-management
bom-item-tracking
omie-document-fetch
```

### 📌 Justificativa:
- **Ambiguidade**: "order" pode ser sales order, production order, purchase order
- **Ownership**: Nome genérico não revela quem escreve (API 1 vs API 2)
- **Capacidade**: Não fica claro o que o módulo faz (sync, fetch, apply, manage)

---

## 2️⃣ CATEGORIAS DE ENTIDADES

### 2.1 Entidades Omie (API 1 Exclusive)
**Propósito**: Dados espelhados do Omie para consulta local.
- **Schema prefix**: `omie_` (obrigatório)
- **Módulo sufixo**: `-sync`, `-fetch`, `-apply`
- **Ownership**: API 1 (escrita exclusiva)
- **Exemplos canônicos**:

| Entidade Omie | Schema | Módulo | Capacidade |
|---------------|--------|--------|------------|
| Pedido de venda | `omie_sales_order` | `sales-order-sync` | Sincronização bidirecional |
| Produto | `omie_product` | `product-fetch` | Busca unidirecional |
| Cliente | `omie_customer` | `customer-sync` | Sincronização bidirecional |
| Estrutura de produto | `omie_product_structure` | `product-structure-fetch` | Busca unidirecional |

### 2.2 Entidades de Domínio (API 2 Exclusive)
**Propósito**: Decisões humanas e estado interno do sistema.
- **Schema prefix**: Nenhum (sem `omie_`)
- **Módulo sufixo**: `-management`, `-planning`, `-tracking`
- **Ownership**: API 2 (escrita exclusiva)
- **Exemplos canônicos**:

| Entidade Domínio | Schema | Módulo | Capacidade |
|------------------|--------|--------|------------|
| Ordem de produção | `production_order` | `production-order-management` | Gestão de OPs |
| Plano de produção | `production_plan` | `production-planning` | Planejamento |
| Status interno | `internal_status` | `status-tracking` | Monitoramento |
| Preferência usuário | `user_preference` | `preference-management` | Configurações |

### 2.3 Entidades de Controle (API 1 Exclusive)
**Propósito**: Coordenação e controle de execução.
- **Schema sufix**: `_lock`, `_job`, `_sync`
- **Módulo sufixo**: `-lock`, `-job`, `-sync`
- **Ownership**: API 1 (escrita exclusiva)
- **Exemplos canônicos**:

| Entidade Controle | Schema | Módulo | Capacidade |
|-------------------|--------|--------|------------|
| Lock de job | `job_lock` | `job-lock` | Controle concorrência |
| Job de sincronização | `sync_job` | `sync-job` | Execução agendada |
| Controle de processo | `process_control` | `process-control` | Coordenação |

---

## 3️⃣ CAPACIDADES CANÔNICAS

### 3.1 Capacidades de Integração (Omie ↔ Local)
| Capacidade | Quando Usar | Exemplo | Ownership |
|------------|-------------|---------|-----------|
| **`-sync`** | Sincronização bidirecional (Omie ↔ local) | `sales-order-sync` | API 1 |
| **`-fetch`** | Busca unidirecional (Omie → local) | `product-fetch` | API 1 |
| **`-apply`** | Aplicação unidirecional (local → Omie) | `structure-apply` | API 1 |

### 3.2 Capacidades de Domínio (Interno)
| Capacidade | Quando Usar | Exemplo | Ownership |
|------------|-------------|---------|-----------|
| **`-management`** | CRUD completo de entidade interna | `production-order-management` | API 2 |
| **`-planning`** | Planejamento e otimização | `production-planning` | API 2 |
| **`-tracking`** | Monitoramento de estado | `status-tracking` | API 2 |
| **`-analysis`** | Análise e relatórios | `performance-analysis` | API 2 |

### 3.3 Capacidades de Controle
| Capacidade | Quando Usar | Exemplo | Ownership |
|------------|-------------|---------|-----------|
| **`-lock`** | Controle de concorrência | `resource-lock` | API 1 |
| **`-job`** | Execução agendada | `reconciliation-job` | API 1 |
| **`-monitor`** | Monitoramento de saúde | `system-monitor` | API 1 |

---

## 4️⃣ REGRAS DE OURO

### 🔴 REGRA 1: Evite Nomes Genéricos
```typescript
// ❌ PROIBIDO (genérico demais)
orders
data
items
documents
sync
management

// ✅ OBRIGATÓRIO (específico + capacidade)
sales-orders
production-data
bom-items
omie-documents
order-sync
plan-management
```

### 🔴 REGRA 2: Ownership Explícito no Nome
```typescript
// Se é do Omie → deixe claro no schema, implícito no módulo
Schema: omie_sales_order      // ✅ (prefixo omie_)
Módulo: sales-order-sync      // ✅ (sem prefixo, contexto claro)

// Se é domínio interno → sem referência ao Omie
Schema: production_order      // ✅ (sem prefixo)
Módulo: production-order-management  // ✅ (ownership claro)

// ❌ AMBÍGUO (não revela ownership)
Schema: order                 // ❌ (genérico)
Módulo: orders                // ❌ (genérico)
```

### 🔴 REGRA 3: Consistência entre Schema e Módulos
```
// ✅ CANÔNICO (alinhamento perfeito)
Schema: omie_sales_order
Módulo: sales-order-sync
Gateway: SalesOrderSyncGateway

// ✅ ACEITÁVEL (contexto claro)
Schema: omie_sales_order  
Módulo: sales-sync          // (abreviação aceitável se contexto claro)

// ❌ PROIBIDO (inconsistência)
Schema: omie_sales_order
Módulo: order-management    // ❌ (muda entidade)
```

### 🔴 REGRA 4: Capacidade Única por Módulo
```typescript
// ✅ CORRETO (uma capacidade por módulo)
sales-order-sync            // Só sincronização
product-fetch               // Só busca
plan-management             // Só gestão

// ❌ PROIBIDO (múltiplas capacidades)
order-sync-and-fetch        // ❌ (duas capacidades)
data-management-sync        // ❌ (duas capacidades)
```

### 🔴 REGRA 5 (🆕): Hierarquia de Path na API 1 (Commands / Callbacks / Read)

Os paths HTTP seguem uma **hierarquia canônica** que **complementa** a nomenclatura do módulo:

```
/v1/integration/{modulo}/
├── commands/{comando}      # POST — intenção que SAI do sistema
├── callbacks/:id/{acao}    # POST — resposta que ENTRA no sistema  
├── read/{...}              # GET  — consulta do espelho local
└── commands/:id            # GET  — tracking de comando
```

**Commands** (`POST`) = ação com efeito colateral que sai para o Omie:
- `POST /commands/create` — Cria, enfileira
- `POST /commands/sync-global` — Sincroniza lote
- **Nome do comando**: verbo no imperativo (`create`, `update`, `cancel`, `sync`, `sync-global`)

**Callbacks** (`POST`) = resposta que entra no sistema:
- `POST /callbacks/:id/confirm` — Confirma execução
- `POST /callbacks/:id/fail` — Falha na execução  
- **Nome do callback**: resultado (`confirm`, `fail`)

**Reads** (`GET`) = consulta sem efeito colateral:
- `GET /read/production-orders` — Lista espelho local
- `GET /read/production-orders/:code` — Detalhe
- **Nome do read**: entidade no plural, opcionalmente com sufixo (`/stats`, `/queue`)

---

## 5️⃣ EXEMPLOS CANÔNICOS VS PROBLEMÁTICOS

### 5.1 Integração Omie (API 1)
| Contexto | ✅ Canônico | ❌ Problemático | Razão |
|----------|-------------|-----------------|-------|
| Sincronização pedidos | `sales-order-sync` | `orders-sync` | Especificidade |
| Busca produtos | `product-fetch` | `data-fetch` | Entidade clara |
| Aplicação estrutura | `structure-apply` | `product-apply` | Capacidade específica |
| Sincronização cliente | `customer-sync` | `client-sync` | Terminologia consistente |

### 5.2 Domínio Interno (API 2)
| Contexto | ✅ Canônico | ❌ Problemático | Razão |
|----------|-------------|-----------------|-------|
| Gestão OPs | `production-order-management` | `order-management` | Ownership claro |
| Planejamento | `production-planning` | `plan-management` | Capacidade específica |
| Tracking status | `status-tracking` | `data-tracking` | Entidade específica |
| Análise performance | `performance-analysis` | `report-analysis` | Propósito claro |

### 5.3 Controle (API 1)
| Contexto | ✅ Canônico | ❌ Problemático | Razão |
|----------|-------------|-----------------|-------|
| Lock recursos | `resource-lock` | `lock` | Entidade específica |
| Job reconciliação | `reconciliation-job` | `sync-job` | Capacidade específica |
| Monitor sistema | `system-monitor` | `health-check` | Terminologia consistente |

---

## 6️⃣ MAPEAMENTO: SCHEMA ↔ MÓDULO ↔ GATEWAY

### 6.1 Fluxo Canônico Completo
```
Schema DB: omie_sales_order
  ↓
Módulo: sales-order-sync
  ↓
Port: SalesOrderSyncGateway (interface)
  ↓
Gateway Real: RealSalesOrderSyncGateway (implementação)
  ↓
Gateway Fake: FakeSalesOrderSyncGateway (implementação)
  ↓
Use Case: SyncSalesOrderUseCase
  ↓
Route: /v1/integration/sales-order/sync-global
Route: /v1/integration/sales-order/commands/sync
```

### 6.2 Exemplo Prático: Sales Order Sync
```prisma
// SCHEMA (Prisma)
model OmieSalesOrder {
  id       String @id @default(cuid())
  codigo   String @unique  // Código Omie
  rawData  Json           // Dados brutos
  syncedAt DateTime @default(now())
}
```

```typescript
// MÓDULO (nome da pasta)
sales-order-sync/
├── application/
│   ├── ports/
│   │   └── sales-order-sync.gateway.ts
│   └── use-cases/
│       └── sync-sales-order.usecase.ts
```

```typescript
// GATEWAY (interface)
export interface SalesOrderSyncGateway {
  fetchFromOmie(codigo: string): Promise<OmieSalesOrderData>;
  applyToOmie(data: SalesOrderData): Promise<void>;
}
```

---

## 7️⃣ CHECKLIST DE COMPLIANCE

### ✅ Antes de Criar Novo Módulo:
- [ ] **Nome específico**: Evitou termos genéricos (`order`, `data`, `item`)
- [ ] **Entidade clara**: Identificou entidade exata (`sales-order`, `production-order`)
- [ ] **Capacidade única**: Definiu uma capacidade principal (`-sync`, `-fetch`, `-management`)
- [ ] **Ownership explícito**: Sabe se é API 1 (Omie) ou API 2 (domínio)
- [ ] **Consistência**: Nome do módulo alinha com schema e gateways

### ✅ Antes de Criar Nova Tabela:
- [ ] **Prefix correto**: `omie_` para dados Omie, nenhum para domínio interno
- [ ] **Entidade específica**: Não usou nomes genéricos (`order`, `data`)
- [ ] **Sufixo apropriado**: `_command`, `_integration`, `_lock` quando aplicável
- [ ] **Ownership claro**: API 1 ou API 2 exclusivo

### ✅ Antes de Nomear Gateway:
- [ ] **Por capacidade**: Nome reflete capacidade específica (`Sync`, `Fetch`, `Apply`)
- [ ] **Entidade específica**: Não genérico (`SalesOrder`, não `Order`)
- [ ] **Real/Fake claro**: Prefixo `Real` ou `Fake` na implementação
- [ ] **Interface única**: Uma interface por capacidade

---

## 🎯 RESUMO DE PRINCÍPIOS

### 🔴 **NUNCA FAÇA:**
1. Use nomes genéricos (`order`, `data`, `item`)
2. Crie módulos com múltiplas capacidades
3. Misture ownership no mesmo nome
4. Use abreviações ambíguas

### ✅ **SEMPRE FAÇA:**
1. **Entidade específica** + **capacidade única**
2. **Ownership explícito** no nome (schema prefix, contexto módulo)
3. **Consistência total** entre schema, módulo, gateway
4. **Clareza semântica** acima de brevidade

---

## 📚 DOCUMENTOS RELACIONADOS

| Documento | Papel | Relação |
|-----------|-------|---------|
| **`NAMING_CONVENTIONS.md`** | Padrões sintáticos (kebab-case, etc.) | Este guia **complementa** com semântica |
| **`PROJECT_MANUAL.md`** | Autoridade máxima geral | Referencia este guia para nomenclatura de domínio |
| **`DB_SCHEMA_GUIDE.md`** | Padrão canônico de schema | Alinhamento total de nomenclatura |
| **`MODULE_TEMPLATE.md`** | Template para novos módulos | Implementa estes princípios |

---

**📅 Última atualização**: 2026‑06‑09  
**🔗 Documento relacionado**: [NAMING_CONVENTIONS.md](NAMING_CONVENTIONS.md)  
**🚨 Status**: Padrão canônico oficial (obrigatório para novos módulos)