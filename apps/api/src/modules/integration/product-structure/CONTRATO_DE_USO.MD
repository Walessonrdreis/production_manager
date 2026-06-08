
# 🧠 CONTEXTO OFICIAL — USO CORRETO DA API 1 (INTEGRAÇÃO / OMIE)

## 🎯 Papel da API 1

A **API 1** é a **camada de integração** e **Anti‑Corruption Layer** do sistema.

Ela é a **ÚNICA** responsável por:

* ✅ Falar com o **Omie**
* ✅ Traduzir payloads do Omie para o sistema
* ✅ Aplicar idempotência, retry, timeout
* ✅ Manter **espelhos** no banco
* ✅ Expor **read‑models prontos**
* ✅ Executar **jobs de reconciliação**

### ❌ A API 1 **NÃO**:

* ❌ Implementa UX
* ❌ Espera processamento externo para responder
* ❌ Conhece intenções humanas
* ❌ É chamada diretamente pelo front

***

## 🧩 Arquitetura Geral

```
FRONTEND
   ↓
API 2  (domínio, UX, decisões humanas)
   ↓
API 1  (integração, Omie, read‑models)
   ↓
OMIE (ERP)
```

***

## ✅ REGRAS DE OURO (IMUTÁVEIS)

1. **API 2 nunca chama Omie**
2. **Front nunca chama API 1**
3. **Todo efeito colateral passa pela API 1**
4. **Read‑models não executam efeitos colaterais**
5. **Comandos SEMPRE retornam 202 Accepted**
6. **Idempotência SEMPRE via `externalRequestId`**

***

## 🧱 Banco de Dados (DB ÚNICO, ownership claro)

### 🟦 Tabelas de Integração (API 1 escreve)

* `product_structure`
* `product_structure_item`
* `product_structure_command`
* `job_lock`, `sync_lock`
* `rawPayload` do Omie

### 🟩 Tabelas de Domínio (API 2 escreve)

* metas
* filas
* status internos
* auditoria de decisões humanas

> Regra prática:  
> **Se o dado nasce no Omie → API 1**  
> **Se o dado nasce da decisão humana → API 2**

***

## 📖 READ‑MODEL (uso pelo Front via API 2)

### ✅ Readiness de Produção (Product Structure)

```
GET /v1/admin/read/products/production-readiness
```

### O que responde?

> **“Este produto pode gerar Ordem de Produção agora?”**

### Campos principais

* `hasStructure`
* `canCreateProductionOrder`

### Query params suportados

* `view=summary | data`
* `q`
* `structureStatus=with|without`
* `onlyWithoutStructure`
* `limit`, `offset`
* `sort`, `order`

### Regras

* ✅ **Não chama Omie**
* ✅ **Não escreve no banco**
* ✅ Fonte de verdade para UX

***

## ⚙️ COMANDOS DE INTEGRAÇÃO (API 2 → API 1)

Todos os comandos:

* ✅ Exigem `externalRequestId`
* ✅ São idempotentes
* ✅ Retornam `202 Accepted`
* ✅ Fake / Real controlado por env

***

### 🔹 Aplicar Estrutura (Create / Update BOM)

```
POST /v1/integration/product-structure/:productCode/apply
```

Payload:

```json
{
  "externalRequestId": "<string>",
  "structure": {
    "items": [
      { "componentCode": "<string>", "quantity": <number> }
    ]
  }
}
```

Comportamento:

* Decide **IncluirEstrutura** ou **AlterarEstrutura**
* Atualiza espelho local
* Não bloqueia UX

***

### 🔹 Sincronizar Estrutura (on‑demand)

```
POST /v1/integration/product-structure/:productCode/sync
```

Payload:

```json
{ "externalRequestId": "<string>" }
```

Uso:

* Produto sem estrutura
* Reconciliação manual
* Debug operacional

***

### 🔹 Excluir Estrutura

```
POST /v1/integration/product-structure/:productCode/delete
```

Payload:

```json
{ "externalRequestId": "<string>" }
```

Resultado:

* Remove BOM no Omie
* Atualiza espelho
* Bloqueia produto para produção

***

## 🔁 JOBS (CRON / ADMIN)

### ✅ Product Structure Sync Job

Variáveis de ambiente:

```env
ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB=true|false
OMIE_PRODUCT_STRUCTURE_SYNC_CRON=0 */12 * * *
```

Comportamento:

* Executa reconciliação automática
* Usa idempotência
* Não concorre com comandos HTTP
* Não depende da API 2

***

## 🧪 Idempotência (OBRIGATÓRIA)

Todos os comandos usam:

```
externalRequestId
```

Persistido em:

```
product_structure_command
```

Status possíveis:

* `ACCEPTED`
* `CONFIRMED`
* `FAILED`

> ⚠️ A API retorna sempre `ACCEPTED`.  
> Evolução é interna e auditável.

***

## 🎛️ Fake vs Real (Strategy Pattern)

Variável:

```env
PRODUCT_STRUCTURE_GATEWAY=fake|real
```

* `real` → chama Omie
* `fake` → simula mundo externo (preferencialmente no‑write)

⚠️ **Fake ≠ desligar job**  
Job é controlado por env próprio.

***

## 🧠 Como a API 2 deve usar a API 1

### ✅ Correto

* API 2 chama **read‑models**
* API 2 dispara **comandos**
* API 2 nunca espera Omie
* API 2 reage ao estado do read‑model

### ❌ Incorreto

* API 2 chamar Omie
* Front chamar API 1
* UX depender de resposta síncrona externa

***

## 🏁 TL;DR (para o agente)

* **API 1** = integração + Omie + read‑models
* **API 2** = domínio + UX + intenção humana
* **Read‑models** = GET
* **Comandos** = POST + `externalRequestId`
* **Jobs** = cron + env
* **Nunca bloquear UX esperando Omie**

***

✅ **Esse é o contrato oficial de uso da API 1.**  

