# Production Orders — API Routes

Módulo de integração de Ordens de Produção (OP) com Omie.

---

## Organização das Rotas

| Grupo | Prefixo | Descrição |
|---|---|---|
| **Commands** | `POST /v1/integration/production-orders/commands/*` | Intenções que saem do sistema → enfileiradas (Command Queue) |
| **Callbacks** | `POST /v1/integration/production-orders/callbacks/*` | Respostas que entram no sistema (Fake-only) |
| **Tracking** | `GET /v1/integration/production-orders/commands/:externalRequestId` | Acompanhamento de status de comando |
| **Read-Models** | `GET /v1/integration/production-orders/read/*` | Consultas ao espelho local (sem efeito colateral) |
| **Admin** | `POST /v1/admin/production-orders/*` | Operações administrativas (refresh, rebuild) |

> **Arquitetura:** Toda intenção de escrita enfileira um comando `PENDING`. O **Queue Processor Job** consome a fila e executa contra o Omie. A resposta é assíncrona (eventual-consistente).

---

## 1. Commands (Escrita — Enfileirados)

### 1.1 Criar Ordem de Produção

```
POST /v1/integration/production-orders/commands/create
```

Enfileira uma criação de OP (`CREATE_OP`) no Command Queue.

**Request Body:**

```json
{
  "externalRequestId": "meu-id-único-001",
  "productId": "9468673347",
  "quantity": 100,
  "scheduledDate": "2026-07-15T00:00:00.000Z",
  "notes": "Produção urgente"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `externalRequestId` | `string` | ✅ Sim | ID de idempotência (cliente deve gerar) |
| `productId` | `string` | ✅ Sim | Código do produto no Omie |
| `quantity` | `number` | ✅ Sim | Quantidade (> 0) |
| `scheduledDate` | `string (ISO 8601)` | ❌ Não | Data prevista |
| `notes` | `string` | ❌ Não | Observações |

**Response 202 (Accepted):**

```json
{
  "success": true,
  "data": {
    "externalRequestId": "meu-id-único-001",
    "status": "PENDING"
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/commands/create \
  -H "Content-Type: application/json" \
  -d '{
    "externalRequestId": "create-op-001",
    "productId": "9468673347",
    "quantity": 100
  }'
```

**Response 400 (Validation Error):**

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request payload"
}
```

---

### 1.2 Atualizar Ordem de Produção

```
POST /v1/integration/production-orders/commands/update
```

Enfileira uma atualização de OP (`UPDATE_OP`) no Command Queue.

**Request Body:**

```json
{
  "externalRequestId": "meu-id-único-002",
  "omieId": "9551864263",
  "quantity": 150,
  "forecastDate": "2026-08-01T00:00:00.000Z",
  "notes": "Alteração de quantidade"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `externalRequestId` | `string` | ✅ Sim | ID de idempotência |
| `omieId` | `string` | ✅ Sim | Código da OP no Omie |
| `quantity` | `number` | ❌ Não | Nova quantidade (> 0) |
| `forecastDate` | `string (ISO 8601)` | ❌ Não | Nova data prevista |
| `notes` | `string` | ❌ Não | Observações |

**Response 202 (Accepted):**

```json
{
  "success": true,
  "data": {
    "externalRequestId": "meu-id-único-002",
    "status": "PENDING"
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/commands/update \
  -H "Content-Type: application/json" \
  -d '{
    "externalRequestId": "update-op-001",
    "omieId": "9551864263",
    "quantity": 150
  }'
```

---

### 1.3 Cancelar Ordem de Produção

```
POST /v1/integration/production-orders/commands/cancel
```

Enfileira um cancelamento de OP (`CANCEL_OP`) no Command Queue.

**Request Body:**

```json
{
  "externalRequestId": "meu-id-único-003",
  "omieId": "9551864263",
  "reason": "Cancelamento por solicitação do cliente"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `externalRequestId` | `string` | ✅ Sim | ID de idempotência |
| `omieId` | `string` | ✅ Sim | Código da OP no Omie |
| `reason` | `string` | ❌ Não | Motivo do cancelamento |

**Response 202 (Accepted):**

```json
{
  "success": true,
  "data": {
    "externalRequestId": "meu-id-único-003",
    "status": "PENDING"
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/commands/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "externalRequestId": "cancel-op-001",
    "omieId": "9551864263",
    "reason": "Cliente desistiu do pedido"
  }'
```

---

### 1.4 Alterar Etapa da Ordem de Produção

```
POST /v1/integration/production-orders/commands/change-stage
```

Enfileira uma alteração de etapa (`CHANGE_STAGE`) no Command Queue.

**Request Body:**

```json
{
  "externalRequestId": "meu-id-único-004",
  "omieId": "9551864263",
  "stage": "30"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `externalRequestId` | `string` | ✅ Sim | ID de idempotência |
| `omieId` | `string` | ✅ Sim | Código da OP no Omie |
| `stage` | `string` | ✅ Sim | Código da etapa (ex: "10", "20", "30", "60") |

**Response 202 (Accepted):**

```json
{
  "success": true,
  "data": {
    "externalRequestId": "meu-id-único-004",
    "status": "PENDING"
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/commands/change-stage \
  -H "Content-Type: application/json" \
  -d '{
    "externalRequestId": "stage-op-001",
    "omieId": "9551864263",
    "stage": "30"
  }'
```

---

### 1.5 Sincronizar Todas as Ordens de Produção

```
POST /v1/integration/production-orders/commands/sync-global
```

Dispara uma sincronização completa de todas as OPs do Omie para o espelho local.

**Request Body (opcional):**

```json
{
  "externalRequestId": "meu-sync-001",
  "pageSize": 500,
  "maxPages": 10
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `externalRequestId` | `string` | ❌ Não | Auto-gerado se omitido |
| `pageSize` | `number` | ❌ Não | Tamanho da página (default: 500) |
| `maxPages` | `number` | ❌ Não | Máx. páginas (default: todas) |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "status": "ACCEPTED",
    "externalRequestId": "meu-sync-001",
    "resourceId": "__GLOBAL__"
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/commands/sync-global \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId": "sync-manual-001"}'
```

---

## 2. Callbacks (Fake-only — Respostas)

> ⚠️ Disponíveis **apenas** quando `PRODUCTION_ORDER_GATEWAY=fake`.  
> Usadas para simular conclusão/falha em testes e desenvolvimento.

### 2.1 Confirmar Ordem de Produção

```
POST /v1/integration/production-orders/callbacks/:externalRequestId/confirm
```

Simula a confirmação bem-sucedida de uma OP no ambiente fake.

**Parâmetros de URL:**

| Parâmetro | Descrição |
|---|---|
| `externalRequestId` | ID de idempotência do comando a confirmar |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "externalRequestId": "create-op-001",
    "status": "CONFIRMED",
    "omieProductionOrderId": null
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s -X POST "http://localhost:3333/v1/integration/production-orders/callbacks/create-op-001/confirm" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 2.2 Falhar Ordem de Produção

```
POST /v1/integration/production-orders/callbacks/:externalRequestId/fail
```

Simula a falha de uma OP no ambiente fake.

**Parâmetros de URL:**

| Parâmetro | Descrição |
|---|---|
| `externalRequestId` | ID de idempotência do comando a falhar |

**Request Body:**

```json
{
  "code": "ESTOQUE_INSUFICIENTE",
  "message": "Matéria-prima não disponível"
}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "externalRequestId": "create-op-001",
    "status": "FAILED"
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s -X POST "http://localhost:3333/v1/integration/production-orders/callbacks/create-op-001/fail" \
  -H "Content-Type: application/json" \
  -d '{"code": "ESTOQUE_INSUFICIENTE", "message": "Sem matéria-prima"}'
```

---

## 3. Tracking (Acompanhamento de Comando)

### 3.1 Status do Comando

```
GET /v1/integration/production-orders/commands/:externalRequestId
```

Retorna o status atual de um comando pelo ID de idempotência.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "externalRequestId": "create-op-001",
    "productId": "9468673347",
    "quantity": 100,
    "status": "PENDING",
    "createdAt": "2026-06-22T21:02:50.786Z",
    "updatedAt": "2026-06-22T21:02:50.786Z",
    "lastError": null
  }
}
```

| Status | Significado |
|---|---|
| `PENDING` | Aguardando processamento |
| `PROCESSING` | Em processamento |
| `ACCEPTED` | Aceito pelo Omie |
| `CONFIRMED` | Confirmado (Omie → Integration Store) |
| `FAILED` | Falha (ver `lastError`) |

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/commands/create-op-001"
```

**Response 404 (Not Found):**

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Production order request not found"
}
```

---

## 4. Read-Models (Consultas — Espelho Local)

> Consultas ao banco local. Nunca chamam o Omie. Sem efeitos colaterais.
>
> **Exceção:** `…/refresh` (seção 4.6) — consulta síncrona ao Omie + atualização do espelho.

### 4.1 Listar Ordens de Produção (Legacy)

```
GET /v1/integration/production-orders/read?page=1&limit=20&completed=false&active=true&productCode=9468673347
```

Retorna lista paginada de OPs do espelho local.

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `page` | `number` | `1` | Página atual |
| `limit` | `number` | `20` | Itens por página (max: 100) |
| `completed` | `boolean` | — | Filtrar por concluídas |
| `active` | `boolean` | — | Filtrar por ativas |
| `productCode` | `string` | — | Filtrar por código do produto |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "79db4515-...",
        "omieId": "9551864263",
        "productCode": "9468673347",
        "quantity": "1",
        "stage": "10",
        "completed": false,
        "active": true,
        "forecastDate": "2026-06-12T00:00:00.000Z",
        "startDate": "2026-06-12T00:00:00.000Z",
        "completionDate": null,
        "lastSyncAt": "2026-06-22T18:03:16.376Z"
      }
    ],
    "total": 1537,
    "page": 1,
    "limit": 20
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read?page=1&limit=5&completed=false"
```

---

### 4.2 Lista Unificada com Busca Inteligente

```
GET /v1/integration/production-orders/read/list-unified?page=1&limit=20&q=9468673347&completed=false
```

Retorna lista paginada de OPs com suporte a **busca inteligente** via parâmetro `q`.  
Quando `q` é informado, o sistema detecta automaticamente o tipo de consulta e aplica scoring/ranking:

| Tipo de Consulta | Exemplo | Campos Buscados |
|---|---|---|
| `orderNumber` | `"1456"` (numérico 4 dígitos) | `orderNumber` |
| `omieId` | `"9551864263"` (numérico 10 dígitos) | `omieId` |
| `code` | `"9468673347"` ou `"Planejada"` (alfabético) | `productCode`, `productCodeNormalized`, `stageName`, `productName` |
| `text` | `"bobina 35kg"` (multitoken) | `productName`, `productNameNormalized`, `stageName` |

**Query Parameters:**

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `page` | `number` | `1` | Página atual |
| `limit` | `number` | `20` | Itens por página (max: 100) |
| `q` | `string` | — | Termo de busca (detecção automática) |
| `completed` | `boolean` | — | Filtrar por concluídas |
| `active` | `boolean` | — | Filtrar por ativas |
| `productCode` | `string` | — | Filtrar por código do produto |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "79db4515-...",
        "omieId": "9551864263",
        "productCode": "9468673347",
        "productName": "BOBINA 35KG C/ALMA 76MM",
        "quantity": "1",
        "stage": "10",
        "stageName": "Planejada",
        "stageOrder": 1,
        "stageGroup": "PLANEJAMENTO",
        "completed": false,
        "active": true,
        "forecastDate": "2026-06-12T00:00:00.000Z",
        "startDate": "2026-06-12T00:00:00.000Z",
        "completionDate": null,
        "lastSyncAt": "2026-06-22T18:03:16.376Z",
        "score": 1,
        "matchedFields": ["omieId"]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

> **Campos adicionais** (vs rota legada): `productName`, `stageName`, `stageOrder`, `stageGroup`, `score`, `matchedFields`.

**Exemplo curl:**

```bash
# Busca por código de produto
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/list-unified?q=9468673347"

# Busca por nome de produto
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/list-unified?q=bobina%2035kg"

# Busca por estágio
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/list-unified?q=planejada"
```

---

### 4.3 Autocomplete (Sugestões de Busca)

```
GET /v1/integration/production-orders/read/search-suggestions?q=bobina
```

Retorna sugestões de busca para a barra de pesquisa (autocomplete).  
Usa prefix matching com suporte a multi-token e ranqueamento por similaridade.

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `q` | `string` | ✅ Sim | Termo de busca (mín. 2 caracteres) |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      { "type": "product", "label": "BOBINA 35KG C/ALMA 76MM", "value": "9468673347" },
      { "type": "order", "label": "OP 9551864263 — BOBINA 35KG", "value": "9551864263" },
      { "type": "stage", "label": "Etapa: Planejada", "value": "Planejada" }
    ]
  }
}
```

**Tipos de sugestão:**

| `type` | Descrição |
|---|---|
| `product` | Nome do produto |
| `code` | Código do produto |
| `order` | Código da OP (omieId) |
| `stage` | Nome da etapa |

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/search-suggestions?q=bobina"
```

---

### 4.4 Detalhe da Ordem de Produção

```
GET /v1/integration/production-orders/read/:omieId
```

Retorna detalhes + itens de uma OP específica.

**Path Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `omieId` | `string` | ✅ Sim | Código numérico da OP no Omie (nCodOP) |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "79db4515-...",
    "omieId": "9551864263",
    "productCode": "9468673347",
    "quantity": "1",
    "stage": "10",
    "completed": false,
    "active": true,
    "forecastDate": "2026-06-12T00:00:00.000Z",
    "items": []
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/9551864263"
```

---

### 4.5 Detalhe da OP com Estrutura (BOM) e Consumo

```
GET /v1/integration/production-orders/read/:omieId/with-bom
```

Retorna a OP + nome do produto + itens da estrutura (BOM) com cálculo de consumo + itens da OP vindos do Omie.

**Path Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `omieId` | `string` | ✅ Sim | Código numérico da OP no Omie (nCodOP) |

**Comportamento:**
- Busca a OP pelo `omieId`
- Faz a ponte entre `product_code` (código Omie) e a estrutura (`product_structure_item`) via catálogo
- Calcula: `totalConsumption = OP.quantity * BOM.quantidade`
- Calcula: `stockAfterConsumption = currentStock - totalConsumption`
- Se não encontrar estrutura, retorna `bom: []` e tenta os OP items do Omie

**Response 200:**

```json
{
  "success": true,
  "data": {
    "order": {
      "omieId": "9529462060",
      "orderNumber": null,
      "productCode": "9116171995",
      "productName": null,
      "quantity": "10",
      "forecastDate": "2026-02-02T00:00:00.000Z",
      "startDate": "2026-02-02T00:00:00.000Z",
      "completionDate": "2026-02-02T00:00:00.000Z",
      "stage": "10",
      "completed": false,
      "active": true
    },
    "bom": [
      {
        "componentCode": "embkgmet",
        "componentName": "e Embalagem Barra 1KG METALIZADO 18x30x008",
        "unit": "UN",
        "quantityPerUnit": "1",
        "lossPercent": "0",
        "totalConsumption": "10",
        "currentStock": "50",
        "stockAfterConsumption": "40"
      }
    ],
    "opItems": [
      {
        "omieItemCode": "detail_9207068440",
        "productMeshId": "9207068440",
        "quantity": "10",
        "useFromStock": "N",
        "observation": ""
      }
    ]
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/9529462060/with-bom"
```

---

### 4.6 Atualizar OP do Omie (Refresh)

```
GET /v1/integration/production-orders/read/:omieId/refresh
```

Consulta a OP diretamente no Omie (`ConsultarOrdemProducao`), atualiza o espelho local e retorna dados frescos.
Rota **síncrona** — o dado é buscado do Omie e devolvido na hora.

**Path Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `omieId` | `string` | ✅ Sim | Código numérico da OP no Omie (nCodOP) |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "omieId": "9551864263",
    "internalCode": null,
    "orderNumber": null,
    "productCode": "9468673347",
    "productIntegrationCode": null,
    "quantity": "1",
    "forecastDate": "2026-06-12T00:00:00.000Z",
    "startDate": "2026-06-12T00:00:00.000Z",
    "completionDate": null,
    "stage": "10",
    "projectCode": null,
    "completed": false,
    "active": true,
    "items": []
  }
}
```

**Response 404:**

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Production order 9999999999 not found in Omie"
}
```

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/9551864263/refresh"
```

---

### 4.7 Consulta por Número da OP

```
GET /v1/integration/production-orders/read/by-number/:orderNumber
```

Busca uma OP pelo número do pedido (orderNumber).

**Path Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `orderNumber` | `string` | ✅ Sim | Número do pedido |

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/by-number/1456"
```

---

### 4.8 Estatísticas

```
GET /v1/integration/production-orders/read/stats
```

Retorna contagens agregadas do espelho local.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "total": 1537,
    "active": 1537,
    "completed": 1441,
    "withOrderNumber": 0
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/stats"
```

---

### 4.9 Status da Fila de Comandos

```
GET /v1/integration/production-orders/read/queue
```

Retorna contagens por status + comandos recentes da Command Queue.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "counts": {
      "pending": 3,
      "processing": 0,
      "confirmed": 5,
      "failed": 0
    },
    "recent": [
      {
        "id": "9c0bb8fc-...",
        "externalRequestId": "create-op-001",
        "commandType": "CREATE_OP",
        "status": "PENDING",
        "source": "API2",
        "createdAt": "2026-06-22T21:02:50.786Z",
        "updatedAt": "2026-06-22T21:02:50.786Z"
      }
    ]
  }
}
```

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/queue"
```

---

### 4.10 Falhas na Fila

```
GET /v1/integration/production-orders/read/queue/failures
```

Retorna comandos com falha (últimos 20).

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "abc123-...",
      "externalRequestId": "falhou-op-001",
      "commandType": "CREATE_OP",
      "status": "FAILED",
      "lastError": {
        "code": "OMIE_ERROR",
        "message": "Produto não encontrado"
      },
      "retryCount": 0,
      "createdAt": "2026-06-22T21:02:50.786Z",
      "updatedAt": "2026-06-22T21:02:50.786Z"
    }
  ]
}
```

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/queue/failures"
```

---

### 4.11 Histórico de Comandos

```
GET /v1/integration/production-orders/read/commands
```

Retorna o histórico completo de comandos da fila, com paginação.

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/commands?page=1&limit=10"
```

---

### 4.12 Estado de Sincronização

```
GET /v1/integration/production-orders/read/sync-state
```

Retorna o estado atual da sincronização com o Omie (última execução, progresso, etc.).

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/sync-state"
```

---

### 4.13 Summary (Dashboard)

```
GET /v1/integration/production-orders/read/summary
```

Retorna dados agregados para dashboard resumido.

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/summary"
```

---

### 4.14 Summary por OP

```
GET /v1/integration/production-orders/read/summary/:omieId
```

Retorna resumo agregado de uma OP específica (totais, estágio, consumo).

**Path Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `omieId` | `string` | ✅ Sim | Código numérico da OP no Omie |

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/summary/9551864263"
```

---

### 4.15 Consumption Summary (Geral)

```
GET /v1/integration/production-orders/read/consumption-summary
```

Retorna consumo agregado de materiais em todas as OPs ativas.

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/consumption-summary"
```

---

### 4.16 Consumption Summary por OP

```
GET /v1/integration/production-orders/read/consumption/:omieId
```

Retorna o consumo de materiais de uma OP específica.

**Path Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `omieId` | `string` | ✅ Sim | Código numérico da OP no Omie |

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/consumption/9551864263"
```

---

### 4.17 Problemas de Estoque

```
GET /v1/integration/production-orders/read/stock-issues
```

Retorna OPs com problemas de estoque (componentes insuficientes).

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/stock-issues"
```

---

## 5. Commands Avançados

### 5.1 Retentar Comando com Falha

```
POST /v1/integration/production-orders/commands/retry-failed
```

Re-enfileira um comando que falhou para nova tentativa.

**Request Body:**

```json
{
  "externalRequestId": "falhou-op-001"
}
```

**Exemplo curl:**

```bash
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/commands/retry-failed \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId": "falhou-op-001"}'
```

---

### 5.2 Sincronização Incremental

```
POST /v1/integration/production-orders/commands/sync-incremental
```

Dispara sincronização incremental (apenas OPs alteradas desde a última sync).

**Exemplo curl:**

```bash
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/commands/sync-incremental \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId": "sync-inc-001"}'
```

---

### 5.3 Reconciliar OPs

```
POST /v1/integration/production-orders/commands/reconcile
```

Compara OPs locais com o Omie e corrige divergências.

**Exemplo curl:**

```bash
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/commands/reconcile \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId": "reconcile-001"}'
```

---

### 5.4 Invalidar Cache

```
POST /v1/integration/production-orders/commands/invalidate
```

Invalida o cache de sincronização para forçar recarga na próxima consulta.

**Exemplo curl:**

```bash
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/commands/invalidate \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId": "invalidate-001"}'
```

---

### 5.5 Reconstruir Read Model

```
POST /v1/integration/production-orders/commands/rebuild
```

Reconstrói o read model a partir dos dados do espelho local (sem chamar Omie).

**Exemplo curl:**

```bash
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/commands/rebuild \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId": "rebuild-001"}'
```

---

## 6. Admin

### 6.1 Refresh do Read Model

```
POST /v1/admin/production-orders/read-model/refresh
```

Reconstrói todo o read model de OPs buscando dados atualizados do Omie.  
**Síncrono** — pode levar vários minutos dependendo do volume.

**Exemplo curl:**

```bash
curl.exe -s -X POST http://localhost:3333/v1/admin/production-orders/read-model/refresh \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 7. Fluxo de Uso (Exemplo Completo)

```bash
# 1. Criar uma OP
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/commands/create \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"exemplo-001","productId":"9468673347","quantity":50}'

# 2. Ver status do comando
curl.exe -s http://localhost:3333/v1/integration/production-orders/commands/exemplo-001

# 3. (Fake) Simular confirmação
curl.exe -s -X POST http://localhost:3333/v1/integration/production-orders/callbacks/exemplo-001/confirm \
  -H "Content-Type: application/json" -d '{}'

# 4. Verificar fila
curl.exe -s http://localhost:3333/v1/integration/production-orders/read/queue

# 5. Consultar OPs no espelho local
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read?page=1&limit=10"

# 6. Busca inteligente
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/list-unified?q=bobina"

# 7. Autocomplete
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/search-suggestions?q=bobina"
```

---

## 8. Tratamento de Erros

| Código HTTP | `error` | Significado |
|---|---|---|
| `202` | — | Comando aceito (processamento assíncrono) |
| `400` | `VALIDATION_ERROR` | Payload inválido (Zod validation) |
| `404` | `NOT_FOUND` | Recurso não encontrado |
| `405` | `METHOD_NOT_ALLOWED` | Disponível apenas em modo fake |
| `500` | `INTERNAL_ERROR` | Erro inesperado no servidor |
