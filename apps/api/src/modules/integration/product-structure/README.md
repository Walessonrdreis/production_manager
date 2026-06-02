
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
│  │  └─ product-structure-fetch.gateway.ts
│  │
│  └─ use-cases
│     ├─ sync-product-structure.usecase.ts
│     └─ get-products-production-read-model.usecase.ts
│
├─ infrastructure
│  ├─ gateways
│  │  └─ fetch
│  │     ├─ product-structure-fetch.gateway.ts
│  │     ├─ fake-product-structure-fetch.gateway.ts
│  │     └─ real-product-structure-fetch.gateway.ts
│  │
│  └─ db
│     ├─ product-structure.prisma.ts
│     └─ product-structure-integration.store.ts
│
├─ presentation
│  └─ http
│     ├─ controllers
│     └─ routes.ts
│
├─ product-structure-integration-register.ts
├─ index.ts
└─ README.md

````

❌ Estruturas fora desse formato **não são aceitas**.

---

## 🔁 Padrão Real / Fake (OBRIGATÓRIO)

### ✅ Gateway representa **uma capacidade externa**
Neste módulo, a capacidade é:

- **Fetch / Sync de Estrutura de Produto**

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

## 📊 Read-Models

Este módulo expõe **read-models agregados**, por exemplo:

```
GET /v1/admin/read/products/production
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
✅ UseCase único  
✅ Fake não chama Omie  
✅ Fake simula mundo externo  
✅ Store de integração próprio  
✅ Seleção Real/Fake centralizada  
✅ Controller não conhece Omie  
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


