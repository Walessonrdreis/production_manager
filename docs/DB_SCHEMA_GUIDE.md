# 🗄️ Guia Canônico de Schema do Banco de Dados

**🔴 AUTORIDADE MÁXIMA PARA SCHEMA DB**

Este documento define o **padrão canônico** para schema do banco de dados do projeto Production Manager. Ele **governa como o Prisma schema deve ser escrito**, não substitui o schema existente.

**⚠️ REGRA FUNDAMENTAL**: Qualquer tabela ou campo que viole este padrão é considerada **dívida técnica** e deve ser corrigida.

---

## 📋 ÍNDICE

1. [Tipos de Tabela (Classificação Canônica)](#1-tipos-de-tabela-classificação-canônica)
2. [Campos Obrigatórios por Tipo de Tabela](#2-campos-obrigatórios-por-tipo-de-tabela)
3. [Regras de Ouro do Schema (Imutáveis)](#3-regras-de-ouro-do-schema-imutáveis)
4. [Relação Prisma ↔ Arquitetura](#4-relação-prisma--arquitetura)
5. [Exemplos Canônicos](#5-exemplos-canônicos)
6. [Migrações e Evolução](#6-migrações-e-evolução)

---

## 1️⃣ TIPOS DE TABELA (CLASSIFICAÇÃO CANÔNICA)

### 1.1 Espelho de Integração (Omie)
**Propósito**: Armazenar dados brutos do Omie como espelho local.
- **Prefixos**: `omie_` (obrigatório)
- **Ownership**: API 1 (exclusivo)
- **Escrita por**: Jobs de sincronização Omie
- **Leitura por**: API 1 e API 2 (somente consulta)
- **Exemplos**: 
  - `omie_product` (produtos do Omie)
  - `omie_order` (pedidos do Omie)
  - `omie_customer` (clientes do Omie)

### 1.2 Tabela de Comando
**Propósito**: Garantir idempotência de comandos de integração.
- **Sufixos**: `_command` (obrigatório)
- **Ownership**: API 1 (exclusivo)
- **Escrita por**: API 2 (via comandos), Jobs
- **Leitura por**: API 1, API 2, Jobs
- **Exemplos**:
  - `product_structure_command`
  - `production_order_command`
  - `customer_sync_command`

### 1.3 Tabela de Integração Processada
**Propósito**: Armazenar estado processado da integração.
- **Sufixos**: `_integration` (obrigatório)
- **Ownership**: API 1 (exclusivo)
- **Escrita por**: Jobs de processamento
- **Leitura por**: API 1, API 2, Jobs
- **Exemplos**:
  - `production_order_integration`
  - `product_structure_integration`
  - `customer_integration`

### 1.4 Read Model
**Propósito**: Otimizar consultas frequentes (cache materializado).
- **Sufixos**: `_read_model` (obrigatório)
- **Ownership**: API 1 (exclusivo)
- **Escrita por**: Jobs de atualização
- **Leitura por**: API 2 (principalmente), API 1
- **Observação**: Nunca escreve diretamente no Omie
- **Exemplos**:
  - `product_availability_read_model`
  - `order_status_read_model`

### 1.5 Domínio Interno
**Propósito**: Armazenar decisões humanas e estado do domínio.
- **Nomenclatura**: Livre (sem `omie_`)
- **Ownership**: API 2 (exclusivo)
- **Escrita por**: API 2 (exclusivo)
- **Leitura por**: API 2, API 1 (somente consulta)
- **Exemplos**:
  - `production_plan` (planejamento humano)
  - `internal_status` (status interno)
  - `user_preference` (preferências de usuário)

### 1.6 Lock / Controle
**Propósito**: Coordenar execução concorrente.
- **Sufixos**: `_lock` (obrigatório)
- **Ownership**: API 1 (exclusivo)
- **Escrita por**: Jobs, Processos de sincronização
- **Leitura por**: Jobs, Processos de sincronização
- **Exemplos**:
  - `job_lock` (locks de jobs)
  - `sync_lock` (locks de sincronização)
  - `resource_lock` (locks de recursos)

---

## 2️⃣ CAMPOS OBRIGATÓRIOS POR TIPO DE TABELA

### 2.1 Tabelas de Comando (`_command`)
```prisma
model ProductStructureCommand {
  id                String   @id @default(cuid())
  externalRequestId String   @unique
  status            String   // "ACEITO" | "CONFIRMADO" | "FALHA"
  source            String   // "API2" | "JOB" | "ADMIN"
  createdAt         DateTime @default(now())
  confirmedAt       DateTime?
  failedAt          DateTime?
  errorMessage      String?
  rawPayload        Json     // Payload bruto do comando
  codigo            String   // Código da entidade (ex: código do produto)
  
  // Relações opcionais
  jobId             String?  // Se executado por job
  syncId            String?  // Se parte de uma sincronização
}
```

**Campos obrigatórios**:
- `id` (cuid ou uuid) - Identificador único
- `externalRequestId` (unique) - Garante idempotência
- `status` - Estado do comando
- `source` - Origem da execução
- `createdAt` - Timestamp de criação
- `rawPayload` (Json) - Dados brutos (nunca normalizado)

### 2.2 Espelhos de Integração (`omie_`)
```prisma
model OmieProduct {
  id               String   @id @default(cuid())
  codigo           String   @unique // Código do Omie
  rawData          Json     // Dados brutos da API Omie
  syncedAt         DateTime @default(now())
  syncId           String?  // ID da sincronização
  lastModifiedAt   DateTime? // Última modificação no Omie
  
  // Campos derivados (opcionais, para performance)
  nome             String?
  categoria        String?
  preco            Float?
}
```

**Campos obrigatórios**:
- `id` (cuid ou uuid)
- `codigo` (unique) - Código único do Omie
- `rawData` (Json) - Dados brutos completos
- `syncedAt` - Timestamp da última sincronização

### 2.3 Integrações Processadas (`_integration`)
```prisma
model ProductionOrderIntegration {
  id               String   @id @default(cuid())
  externalId       String   // ID externo (Omie, etc.)
  status           String   // "PENDENTE" | "PROCESSADO" | "ERRO"
  processedAt      DateTime?
  errorDetails     String?
  metadata         Json?
  
  // Relações
  commandId        String?  // Comando que originou
  jobId            String?  // Job que processou
}
```

**Campos obrigatórios**:
- `id` (cuid ou uuid)
- `externalId` - Identificador no sistema externo
- `status` - Estado do processamento

### 2.4 Read Models (`_read_model`)
```prisma
model ProductAvailabilityReadModel {
  id               String   @id @default(cuid())
  productCode      String   @unique
  availableStock   Int
  reservedStock    Int
  lastUpdated      DateTime @default(now())
  sourceData       Json?    // Dados de origem para debug
  
  @@index([productCode])
}
```

**Campos obrigatórios**:
- `id` (cuid ou uuid)
- Campo único para a entidade (ex: `productCode`)
- `lastUpdated` - Timestamp da última atualização

### 2.5 Domínio Interno (sem prefixo)
```prisma
model ProductionPlan {
  id               String   @id @default(cuid())
  name             String
  status           String   // "RASCUNHO" | "APROVADO" | "EXECUTANDO"
  createdBy        String   // Usuário que criou
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // Relações internas
  items            Json     // Itens do plano
}
```

**Campos obrigatórios**:
- `id` (cuid ou uuid)
- `createdAt` / `updatedAt` - Timestamps de auditoria
- Campo de ownership (`createdBy` ou similar)

### 2.6 Locks (`_lock`)
```prisma
model JobLock {
  id               String   @id @default(cuid())
  resourceId       String   @unique
  lockedBy         String   // Processo/job que adquiriu o lock
  lockedAt         DateTime @default(now())
  expiresAt        DateTime // Quando o lock expira
  
  @@index([resourceId, expiresAt])
}
```

**Campos obrigatórios**:
- `id` (cuid ou uuid)
- `resourceId` (unique) - Recurso sendo bloqueado
- `lockedAt` - Timestamp de aquisição
- `expiresAt` - Timestamp de expiração

---

## 3️⃣ REGRAS DE OURO DO SCHEMA (IMUTÁVEIS)

### 🔴 REGRA 1: Ownership de Escrita
```prisma
// ✅ CORRETO
model OmieProduct {
  // API 1 escreve, API 2 só lê
}

model ProductionPlan {
  // API 2 escreve, API 1 só lê
}

// ❌ PROIBIDO
model MixedOwnership {
  // NUNCA: API 1 e API 2 escrevem na mesma tabela
}
```

### 🔴 REGRA 2: Prefixos e Sufixos Obrigatórios
- `omie_` → Dados brutos do Omie (API 1 exclusive)
- `_command` → Comandos idempotentes (API 1 exclusive)
- `_integration` → Estado processado (API 1 exclusive)
- `_read_model` → Cache materializado (API 1 exclusive)
- `_lock` → Controle de concorrência (API 1 exclusive)
- **Sem prefixo** → Domínio interno (API 2 exclusive)

### 🔴 REGRA 3: Raw Payload Sempre Json
```prisma
// ✅ CORRETO
model ProductStructureCommand {
  rawPayload Json // Dados brutos, nunca normalizado
}

// ❌ PROIBIDO
model ProductStructureCommand {
  rawPayload String? // NUNCA usar String para payload
  itemCount  Int?    // NUNCA derivar campos do rawPayload
}
```

### 🔴 REGRA 4: Referência a Jobs e Syncs
```prisma
// ✅ CORRETO
model ProductionOrderIntegration {
  jobId  String? // Referência ao job que processou
  syncId String? // Referência à sincronização
}

// ❌ PROIBIDO
model ProductionOrderIntegration {
  // NUNCA omitir referências quando processado por job/sync
}
```

### 🔴 REGRA 5: Timestamps de Auditoria
Toda tabela deve ter:
- `createdAt` (obrigatório)
- `updatedAt` (obrigatório para tabelas mutáveis)
- Timestamps específicos por estado (`confirmedAt`, `failedAt`, etc.)

### 🔴 REGRA 6: Sem "Tabelinhas Auxiliares Rápidas"
```prisma
// ❌ PROIBIDO
model QuickHelperTable {
  // NUNCA criar tabelas fora da classificação canônica
  // NUNCA violar ownership para "facilitar" algo
}
```

---

## 4️⃣ RELAÇÃO PRISMA ↔ ARQUITETURA

### 4.1 Prisma é Detalhe de Implementação
```typescript
// ❌ CONCEITO ERRADO
"O Prisma schema define o padrão do projeto"

// ✅ CONCEITO CORRETO  
"Este documento define o padrão canônico
 O Prisma schema implementa este padrão"
```

### 4.2 Hierarquia de Autoridade
```
1. DB_SCHEMA_GUIDE.md (este documento)
   ↓
2. PROJECT_MANUAL.md (autoridade máxima geral)
   ↓
3. apps/api/prisma/schema.prisma (implementação)
   ↓
4. Código dos módulos (uso do schema)
```

### 4.3 Verificação de Conformidade
Todo novo `model` no Prisma schema deve:
1. **Classificar-se** em um dos 6 tipos canônicos
2. **Seguir** os campos obrigatórios do tipo
3. **Respeitar** todas as regras de ouro
4. **Manter** ownership claro e exclusivo

---

## 5️⃣ EXEMPLOS CANÔNICOS

### 5.1 Fluxo Completo: Product Structure
```prisma
// 1. Espelho do Omie
model OmieProductStructure {
  id       String @id @default(cuid())
  codigo   String @unique
  rawData  Json
  syncedAt DateTime @default(now())
}

// 2. Comando de Aplicação
model ProductStructureCommand {
  id                String   @id @default(cuid())
  externalRequestId String   @unique
  status            String   // "ACEITO" | "CONFIRMADO" | "FALHA"
  source            String   // "API2" | "JOB"
  createdAt         DateTime @default(now())
  rawPayload        Json
  codigo            String
}

// 3. Integração Processada
model ProductStructureIntegration {
  id          String   @id @default(cuid())
  externalId  String
  status      String   // "PROCESSADO"
  processedAt DateTime @default(now())
  commandId   String?
}

// 4. Read Model (opcional)
model ProductStructureReadModel {
  id          String   @id @default(cuid())
  productCode String   @unique
  structure   Json
  lastUpdated DateTime @default(now())
}
```

### 5.2 Domínio Interno: Production Planning
```prisma
// Domínio interno (API 2 exclusive)
model ProductionPlan {
  id        String   @id @default(cuid())
  name      String
  status    String   // "RASCUNHO" | "APROVADO"
  createdBy String
  items     Json     // Itens do plano
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Relacionamento com integração (consulta apenas)
model PlanOrderReference {
  id              String @id @default(cuid())
  planId          String
  omieOrderId     String // Referência, não foreign key
  internalStatus  String
  
  @@index([planId, omieOrderId])
}
```

---

## 6️⃣ MIGRAÇÕES E EVOLUÇÃO

### 6.1 Princípios de Evolução
1. **Adição**: Sempre permitida (campos novos)
2. **Remoção**: Requer análise de impacto (dados existentes)
3. **Renomeação**: Requer migração em duas fases
4. **Quebra**: Evitar ao máximo (compatibilidade)

### 6.2 Checklist de Nova Migração
```markdown
- [ ] Tabela classifica-se em tipo canônico
- [ ] Prefixo/sufixo correto
- [ ] Campos obrigatórios presentes
- [ ] Ownership claro e exclusivo
- [ ] Raw payload como Json (se aplicável)
- [ ] Timestamps de auditoria
- [ ] Referências a jobs/syncs (se aplicável)
- [ ] Não viola regras de ouro
```

### 6.3 CI Futuro (Lint de Schema)
```yaml
# Exemplo de pipeline futura
- name: Validate Schema Conformity
  run: |
    npx prisma validate
    npx schema-linter --config .schema-lint.json
```

---

## 🎯 RESUMO DE COMPLIANCE

### ✅ FAÇA
- Use prefixos/sufixos canônicos
- Mantenha ownership exclusivo
- Armazene raw payload como Json
- Inclua timestamps de auditoria
- Referencie jobs/syncs quando aplicável

### ❌ NUNCA FAÇA
- Misture ownership de escrita
- Crie tabelas fora da classificação
- Normalize raw payload
- Omita referências a jobs/syncs
- Crie "tabelinhas auxiliares rápidas"

---

**📅 Última atualização**: 2026‑06‑09  
**🔗 Documento relacionado**: [PROJECT_MANUAL.md](PROJECT_MANUAL.md)  
**🚨 Status**: Padrão canônico oficial (obrigatório)