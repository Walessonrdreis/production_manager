# 🎯 VISÃO ESTRATÉGICA - PRODUCTION MANAGER

## 1. OBJETIVO DO PROJETO

**Reduzir em ~90% a necessidade de operar diretamente o Omie**, movendo a operação diária para o sistema (Front + API 2), mantendo o Omie como **base persistente/ERP**.

### Foco atual:
- **Produção** - Gestão de ordens de produção, estoque e estruturas de produto

### Futuro:
- **Financeiro** - A mesma estratégia se estende para outras áreas

---

## 2. PRINCÍPIO FUNDAMENTAL

```
Usuário → Sistema (Front + API 2) → API 1 → Omie (ERP)
```

### Regra prática:
- **O usuário trabalha no sistema**
- **O sistema orquestra ações no Omie**
- **O Omie é a base de dados/ERP** (persistência e regras formais), mas não precisa ser a UI diária

---

## 3. ARQUITETURA MACRO

### 3.1 Componentes Principais

```
DB ÚNICO (compartilhado)
    ↑
API 1 (Fastify) - Integração com Omie
    ↑  
API 2 - Domínio/UX
    ↑
FRONTEND - Interface do usuário
```

### 3.2 Responsabilidades de Cada Camada

#### **API 1 - CAMADA DE INTEGRAÇÃO**
- **Única** que fala com Omie
- **Anti-corruption layer** - traduz payloads do Omie
- **Jobs** agendados (node-cron)
- **Read-models** estáveis
- **Comandos** idempotentes
- **Espelhos** no DB

#### **API 2 - CAMADA DE DOMÍNIO/UX**
- **Orquestra** fluxos de negócio
- **Toma decisões** baseadas em intenção humana
- **Consome** read-models da API 1
- **Dispara** comandos para API 1
- **Nunca** fala com Omie diretamente

#### **FRONTEND - INTERFACE DO USUÁRIO**
- **Interface** com usuário final
- **Nunca** chama API 1 diretamente
- **Nunca** chama Omie
- **Só** conversa com API 2

---

## 4. REGRAS DE OURO (IMUTÁVEIS)

### 4.1 Separação de Responsabilidades
1. **Front nunca chama Omie**
2. **Front nunca chama API 1 diretamente**
3. **API 2 nunca chama Omie** e não conhece payloads do Omie
4. **API 1 é a única camada que fala com Omie**

### 4.2 Padrões de Design
5. **Read-models não executam efeitos colaterais**
6. **Comandos de integração sempre usam externalRequestId** (idempotência)
7. **Comandos retornam 202 Accepted (ACK)** e o sistema é eventual-consistente

---

## 5. OWNERSHIP DO DATABASE

### 5.1 Database Único, Semântica Não

#### **TABELAS DE INTEGRAÇÃO (API 1 escreve)**
- **Espelhos do Omie** 
  - `omie_product` - Produtos do Omie
  - `omie_order` - Pedidos do Omie  
  - `omie_production_order` - Ordens de produção do Omie
- **rawPayload do Omie** - Payloads brutos das respostas
- **Tracking de comandos**
  - `production_order_integration` - Tracking de ordens de produção
  - `product_structure_command` - Tracking de estruturas de produto
- **Locks**
  - `job_lock` - Locks para jobs
  - `sync_lock` - Locks para sincronizações

#### **TABELAS DE DOMÍNIO (API 2 escreve)**
- **Metas, planos e filas internas** - Estruturas de controle do sistema
- **Status internos** - Estados que não existem no Omie
- **Auditoria de decisões humanas** - Log de ações dos usuários

### 5.2 Regra Prática de Ownership

```
Se nasce do Omie → API 1
Se nasce de decisão humana → API 2
```

### 5.3 Exemplos Concretos

#### **API 1 escreve:**
- `omie_product` - Dados vêm do Omie
- `product_structure_command` - Tracking de comandos para Omie
- `sync_lock` - Controle de sincronização com Omie

#### **API 2 escreve:**
- `production_plan` - Plano interno de produção
- `user_decision_log` - Decisões dos operadores
- `internal_status` - Estados do sistema (não existem no Omie)

---

## 6. FLUXO COMPLETO DE UMA OPERAÇÃO

### Exemplo: Aplicar estrutura de produto

```
1. USUÁRIO (Front)
   ↓ Clica "Aplicar estrutura"
   
2. FRONTEND
   ↓ POST /api2/production/product-structure/apply
   
3. API 2 (Domínio/UX)
   ↓ Valida intenção do usuário
   ↓ Cria externalRequestId
   ↓ POST /api1/integration/product-structure/:productCode/apply
   
4. API 1 (Integração)
   ↓ Verifica idempotência (CommandStore)
   ↓ Chama Omie (RealGateway)
   ↓ Persiste espelho no DB
   ↓ Retorna 202 Accepted
   
5. API 2
   ↓ Retorna ACK para Front
   ↓ Agenda polling para status
   
6. FRONTEND
   ↓ Mostra "Processando..."
   ↓ Polling para status final
```

---

## 7. PRINCÍPIOS DE DESIGN

### 7.1 Eventual Consistency
- Comandos retornam **202 Accepted** imediatamente
- Sistema processa assincronamente
- Front faz polling para status final

### 7.2 Idempotência
- Todo comando usa **externalRequestId**
- CommandStore garante execução única
- Retries são seguros

### 7.3 Separação de Concerns
- **API 1** = Integração técnica com Omie
- **API 2** = Lógica de negócio e UX
- **Front** = Interface do usuário

### 7.4 Fake/Real Strategy
- **Fake gateways** para dev/test
- **Real gateways** para produção
- Configuração via `.env` (ex: `PRODUCT_STRUCTURE_GATEWAY=fake|real`)

---

## 8. OBJETIVOS DE LONGO PRAZO

### 8.1 Redução de Dependência
- **90% menos operações diretas no Omie**
- **Sistema como interface primária** para operadores
- **Omie como backend persistente** apenas

### 8.2 Expansão de Funcionalidades
- **Produção** → **Financeiro** → **Compras** → **Vendas**
- **Mesma arquitetura** para todos os módulos
- **Integração gradual** com outros sistemas

### 8.3 Melhoria Contínua
- **Read-models** cada vez mais ricos
- **Jobs** mais inteligentes e eficientes
- **UX** baseada em feedback real dos usuários

---

**📌 NOTA:** Esta visão estratégica define os princípios fundamentais do projeto.
Qualquer implementação que viole estas regras está incorreta e deve ser corrigida.
```