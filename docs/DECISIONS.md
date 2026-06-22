# 🧠 DECISIONS.md — Architectural Decisions Record (ADR)

Este documento registra **decisões arquiteturais importantes, conscientes e não‑óbvias**
tomadas no projeto **Production Manager**.

📌 **Objetivo**
- Preservar o *racional* por trás das decisões
- Evitar reabrir discussões já resolvidas
- Ajudar novos devs, revisores e agentes AI a entender *por que* o sistema é assim
- Diferenciar **decisões imutáveis** de **decisões contextuais**

📌 **Escopo**
- Arquitetura (API 1 / API 2 / DB / Omie)
- Padrões estruturais
- Decisões que afetam crescimento e manutenção

📌 **Não é**
- Um guia de uso
- Um tutorial
- Um changelog

---

## 📐 Convenção de Registro

Cada decisão segue o formato:

- **ID**
- **Status**: ✅ Aceita | 🟡 Contextual | ❌ Rejeitada
- **Data**
- **Contexto**
- **Decisão**
- **Justificativa**
- **Consequências**
- **Alternativas Consideradas**

---

## ✅ ADR‑001 — Banco de Dados Único com Ownership por Tipo de Dado

**Status:** ✅ Aceita  
**Data:** 2026‑06  
**Categoria:** Arquitetura de Dados

### Contexto
O sistema possui duas APIs (API 1 e API 2) que precisam compartilhar dados,
mas com responsabilidades diferentes:
- integração com Omie
- domínio interno e decisões humanas

### Decisão
Adotar **um banco de dados único**, com **ownership estrito por tipo de dado**:

- **API 1 escreve exclusivamente**:
  - espelhos do Omie
  - comandos de integração
  - integrações processadas
  - read‑models de integração
  - locks e controle de jobs

- **API 2 escreve exclusivamente**:
  - dados de domínio interno
  - decisões humanas
  - estados que não existem no Omie

❗ Nunca existe escrita concorrente de API 1 e API 2 na mesma tabela.

### Justificativa
- Evita sincronização complexa entre bancos
- Mantém integridade referencial
- Ownership explícito elimina conflitos
- Facilita observabilidade e auditoria

### Consequências
✅ Simplicidade operacional  
✅ Forte disciplina arquitetural  
⚠️ Exige respeito rigoroso às regras de escrita

### Alternativas Consideradas
❌ Banco separado por API (complexidade de sync)  
❌ Micro‑bancos por módulo (overhead desnecessário)

---

## ✅ ADR‑002 — Separação Clara entre API 1 (Integração) e API 2 (Domínio)

**Status:** ✅ Aceita  
**Data:** 2026‑06  
**Categoria:** Arquitetura de Serviços

### Contexto
O Omie é um ERP externo, instável e com payloads próprios.
Misturar isso com domínio interno gera acoplamento e fragilidade.

### Decisão
- **API 1** é a **única camada que fala com Omie**
- **API 2** nunca chama Omie e nunca conhece payloads do Omie
- API 2 consome API 1 como um serviço interno

### Justificativa
- Anti‑corruption layer explícita
- Domínio interno protegido de mudanças externas
- Facilidade de teste e simulação

### Consequências
✅ Domínio limpo  
✅ Integrações isoladas  
⚠️ Mais hops de rede (aceitável)

### Alternativas Consideradas
❌ Frontend chamando Omie  
❌ API 2 integrando direto com Omie

---

## ✅ ADR‑003 — Gateway representa CAPACIDADE, não Módulo

**Status:** ✅ Aceita  
**Data:** 2026‑06  
**Categoria:** Design de Integração

### Contexto
Gateways genéricos tendem a crescer demais e misturar responsabilidades.

### Decisão
Cada gateway representa **uma capacidade externa específica**, por exemplo:
- `ProductStructureApplyGateway`
- `ProductionOrderCreationGateway`

❌ Não existem gateways genéricos por módulo.

### Justificativa
- Responsabilidade única
- Substituição independente
- Fake/Real granular

### Consequências
✅ Código mais explícito  
✅ Testes mais precisos  
⚠️ Mais arquivos (intencional)

---

## ✅ ADR‑004 — Strategy Fake / Real por Capacidade

**Status:** ✅ Aceita  
**Data:** 2026‑06  
**Categoria:** Operação / Testes

### Contexto
É necessário desenvolver e testar sem depender do Omie,
mas mantendo comportamento realista.

### Decisão
- Cada capacidade externa pode ter:
  - **Gateway Real**
  - **Gateway Fake**
- Seleção via variável de ambiente
- Use case é único
- Fake **simula o mundo externo**, não é no‑op

### Justificativa
- Desenvolvimento rápido
- Testes determinísticos
- Produção segura

### Consequências
✅ Ambiente previsível  
✅ Menos bugs de integração  
⚠️ Fake precisa ser bem mantido

---

## ✅ ADR‑005 — Idempotência Obrigatória em Comandos de Integração

**Status:** ✅ Aceita  
**Data:** 2026‑06  
**Categoria:** Confiabilidade

### Contexto
Chamadas externas podem falhar, repetir ou sofrer retry.

### Decisão
Todo comando de integração:
- exige `externalRequestId`
- é idempotente
- retorna **202 Accepted**

### Justificativa
- Segurança contra duplicações
- Retry seguro
- Eventual consistency explícita

### Consequências
✅ Robustez  
✅ Observabilidade  
⚠️ Mais código de controle

---

## ✅ ADR‑006 — `index.ts` só exporta `register` em módulos com registro explícito

**Status:** ✅ Aceita  
**Data:** 2026‑06  
**Categoria:** Organização de Código

### Contexto
Barrel imports causaram registro duplicado de rotas no passado.

### Decisão
Quando existir `{modulo}-register.ts`:
- `index.ts` **só exporta o register**
- Nunca reexporta rotas, gateways ou controllers

### Justificativa
- Evita bugs silenciosos
- Registro previsível

---

## ❌ ADR‑007 — Frontend chamando Omie diretamente

**Status:** ❌ Rejeitada  
**Data:** 2026‑06  

### Motivo
- Acoplamento extremo
- Falta de controle
- Payloads instáveis
- Quebra completa da arquitetura

---

## ✅ ADR-008 — Command Queue Pattern para Rate-Limit e Concorrência

**Status:** ✅ Aceita  
**Data:** 2026-06  
**Categoria:** Confiabilidade / Concorrência

### Contexto
O Omie impõe rate-limit de aproximadamente 1 chamada/segundo por endpoint. Sem controle de concorrência:

- Chamadas simultâneas geram erros 429 (rate-limit)
- Jobs concorrentes podem processar o mesmo item
- Sem recuperação automática em caso de falha
- Sem visibilidade do estado de comandos em andamento

### Decisão
Adotar **Command Queue Pattern** com fila no PostgreSQL (próprio banco de integração):

**Fluxo:**
1. Comando é enfileirado com status `PENDING` (via `enqueue()`)
2. Queue Processor (job cron `* * * * * *`) executa `dequeue()` com `FOR UPDATE SKIP LOCKED`
3. Comando transiciona para `PROCESSING`
4. Executa chamada Omie via gateway
5. Sucesso → `CONFIRMED` | Falha → `FAILED`
6. Sleep de 1 segundo entre comandos (rate-limit)

**Garantias:**
- `dequeue()` atômico — sem concorrência entre workers
- `createJobLock()` — apenas um processor roda por vez
- Idempotência via `externalRequestId` (mesmo `enqueue()` sendo seguro)
- Stale processing detection (comandos `PROCESSING` há mais de N segundos)

### Justificativa
- Rate-limit de 1 chamada/segundo exige fila
- `FOR UPDATE SKIP LOCKED` evita locks em tabela
- Sem dependência externa (Redis, SQS, RabbitMQ)
- Banco de dados único → transação consistente
- Visibilidade total do estado de cada comando

### Consequências
✅ Latência controlada (1 comando/segundo)  
✅ Sem concorrência destrutiva  
✅ Recuperação automática (retry em próxima execução do cron)  
✅ Observabilidade (status counts, listRecent, listFailures)  
⚠️ Complexidade adicional de fila (Store + Processor + Schemas)  
⚠️ Throughput limitado a 1 chamada/segundo (aceitável por rate-limit)

### Alternativas Consideradas
❌ **Locks distribuídos** (Redis) — dependência externa, complexidade operacional  
❌ **Filas externas** (Redis/SQS/RabbitMQ) — infraestrutura extra, latência de rede  
❌ **JobLock simples sem fila** — sem visibilidade, sem retry granular, sem fila

---

## 📌 Decisões Futuras (Placeholder)

Use esta seção para decisões ainda em discussão:

- Cache distribuído?
- Versionamento de integrações?
- Multi‑tenant no DB?

---

## ✅ Regra Final

Se uma decisão:
- **impacta arquitetura**
- **não é óbvia**
- **pode gerar discussão no futuro**

👉 **ela deve ser registrada aqui**.

Este documento evolui lentamente e conscientemente.