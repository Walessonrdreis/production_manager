
# 📦 Product Structure — Integration Module

> **Este módulo segue o PADRÃO CANÔNICO DE INTEGRAÇÃO do projeto.**  
> Qualquer implementação que não respeite este padrão está incorreta.

---

## 🎯 Objetivo

Este módulo representa a **capacidade externa de Estrutura de Produto (BOM / Malha)**,
cuja fonte de verdade é o **Omie (ERP)**.

Ele é responsável por:
- Buscar/sincronizar estrutura de produto no Omie
- Persistir o estado de integração
- Expor read-models estáveis para consumo da API 2
- Proteger o domínio contra inconsistências externas

---

## 🧠 Classificação Arquitetural

✅ **Tipo A — Módulo de Integração Externa**

Critérios atendidos:
- Fala com Omie
- Dados não nascem no domínio
- Pode falhar por indisponibilidade externa
- Precisa de Fake para DEV / TEST / UX

👉 **Por definição, este módulo DEVE usar o padrão Real/Fake.**

---

## 🧱 Estrutura Obrigatória

```

modules/integration/product-structure/
├─ application
│  ├─ ports
│  │  ├─ product-structure-fetch.gateway.ts
│  │  ├─ product-structure-fetch-page.gateway.ts
│  │  ├─ product-structure-apply.gateway.ts
│  │  ├─ product-structure-delete.gateway.ts
│  │  └─ product-structure-consult.gateway.ts
│  │
│  ├─ use-cases
│  │  ├─ sync-product-structure.usecase.ts
│  │  ├─ sync-all-product-structures.usecase.ts
│  │  ├─ apply-product-structure.usecase.ts
│  │  ├─ delete-product-structure.usecase.ts
│  │  └─ get-products-production-read-model.usecase.ts
│  │
│  └─ dto
│     ├─ sync-product-structure.dto.ts
│     ├─ sync-all-product-structure.dto.ts
│     ├─ apply-product-structure.dto.ts
│     └─ delete-product-structure.dto.ts
│
├─ infrastructure
│  ├─ gateways
│  │  ├─ fetch / fetch-page / apply / delete
│  │  ├─ consult
│  │  │  ├─ product-structure-consult.gateway.ts
│  │  │  ├─ real-product-structure-consult.gateway.ts
│  │  │  └─ fake-product-structure-consult.gateway.ts
│  │  └─ lifecycle
│  │     ├─ product-structure-lifecycle.gateway.ts
│  │     └─ fake-product-structure-lifecycle.gateway.ts
│  │
│  ├─ db
│  │  ├─ product-structure-command.store.ts
│  │  └─ product-structure-integration.store.ts
│  │
│  └─ jobs
│     ├─ reconcile-product-structures.job.ts
│     └─ product-structure-jobs.register.ts
│
├─ presentation
│  └─ http
│     ├─ schemas.ts
│     ├─ routes.ts
│     └─ routes/
│        ├─ commands/          (sync, sync-all, apply, delete, submit)
│        ├─ callbacks/         (confirm, fail)
│        └─ read/              (summary, sync-status, production-readiness, refresh)
│
├─ product-structure-integration-register.ts
├─ index.ts
└─ README.md

````

❌ Estruturas fora desse formato **não são aceitas**.

---

## 🔁 Padrão Real / Fake (OBRIGATÓRIO)

### ✅ Gateway representa **uma capacidade externa**
Neste módulo, as capacidades são:

- **Fetch / Sync de Estrutura de Produto** (consulta paginada + individual)
- **Consult** (consulta ao vivo com Circuit Breaker — usado pelo refresh)
- **Apply** (criação/atualização de estrutura)
- **Delete** (exclusão de estrutura)
- **Lifecycle** (confirm/fail de comandos via callback)

Cada capacidade externa:
- possui **1 interface**
- possui **1 implementação Real**
- possui **1 implementação Fake**

---

### ✅ Real Gateway
- Chama Omie
- Pode falhar
- Pode usar retry / timeout / circuit breaker
- Retorna payload real
- Não decide regra de negócio

---

### ✅ Fake Gateway
- **NUNCA chama Omie**
- Simula o comportamento do mundo externo
- Pode escrever em store de integração
- Retorna dados previsíveis
- Permite DEV / TEST / UX avançarem

> Fake ≠ desligar Omie  
> Fake = simular o mundo externo

---

## 🧠 Responsabilidades por Camada

### ✅ UseCase (ÚNICO)
- Decide **quando** chamar a integração
- Escolhe **qual gateway usar**
- Orquestra persistência
- Calcula flags (`hasStructure`, `canCreateProductionOrder`)
- Não conhece Omie diretamente

---

### ✅ Gateway
- Executa efeito colateral externo
- Mapeia payload Omie → formato interno
- Não decide regra
- Não seleciona Real/Fake

---

### ✅ Store de Integração
- Persiste estado da integração
- Permite idempotência e reconciliação
- Não contém regra de domínio
- Não chama Omie

---

## 🎛️ Seleção Real / Fake

A seleção ocorre **em um único ponto**, normalmente no `register`:

```ts
const gateway =
  env.USE_FAKE_OMIE === "true"
    ? new FakeProductStructureFetchGateway()
    : new RealProductStructureFetchGateway(app.omieClient);
````

✅ O **env apenas seleciona a estratégia**  
✅ O **contrato e o fluxo não mudam**

❌ Proibido:

* `if` dentro do gateway
* `if` no controller
* gateway decidir se é fake ou real

***

## 📊 Read-Models + Rotas

Este módulo expõe **read-models agregados** e **comandos de integração**:

```
# Commands (POST) — enfileiram job PgBoss, retornam 202
POST /v1/integration/product-structure/commands/sync
POST /v1/integration/product-structure/commands/sync-global
POST /v1/integration/product-structure/commands/apply
POST /v1/integration/product-structure/commands/delete
POST /v1/integration/product-structure/commands/submit          (501 - não implementado)

# Callbacks (POST) — worker marca CONFIRMED/FAILED
POST /v1/integration/product-structure/callbacks/:externalRequestId/confirm
POST /v1/integration/product-structure/callbacks/:externalRequestId/fail

# Read-Models (GET) — espelho local (sem side effects)
GET  /v1/admin/read/products/production-readiness
GET  /v1/integration/product-structure/commands/:externalRequestId
GET  /v1/integration/product-structure/read/summary

# Refresh (GET) — consulta Omie ao vivo + atualiza espelho
GET  /v1/integration/product-structure/read/:productCode/refresh
```

Read-models:

* ✅ Leem apenas o banco
* ✅ Respondem perguntas prontas
* ✅ São consumidos pela API 2

❌ Read-model:

* NÃO chama Omie
* NÃO substitui gateway
* NÃO elimina Real/Fake

***

## 🔐 Ownership de Dados

* Dados de Omie → **API 1**
* Dados de domínio humano → **API 2**
* DB é compartilhado, **semântica não**

***

## ✅ Checklist de Validação (Code Review)

Um PR neste módulo **SÓ pode ser aprovado se TODAS forem verdadeiras**:

✅ Gateway com interface  
✅ Gateway Real  
✅ Gateway Fake  
✅ Consult Gateway (com Circuit Breaker)  
✅ Lifecycle Gateway (confirm/fail)  
✅ Refresh Route (consulta Omie + atualiza espelho)  
✅ UseCase único  
✅ Fake não chama Omie  
✅ Fake simula mundo externo  
✅ Store de integração próprio  
✅ Command Store (idempotência + tracking)  
✅ Seleção Real/Fake centralizada  
✅ Controller não conhece Omie  
✅ Schemas Zod centralizados  
✅ API 2 não acessa tabela direta

Se **1 item falhar**, o PR está incorreto.

***

## 🧠 Regra Final (imutável)

> **Capacidade externa → Gateway → Real/Fake**  
> **UseCase decide**  
> **Store persiste estado**  
> **Read-model responde perguntas**  
> **Espelho não decide nada**

***

## ✅ Observação Final

Este README **define contrato arquitetural**, não documentação opcional.


