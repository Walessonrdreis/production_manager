# Production Orders — API Routes

Módulo de integração de Ordens de Produção (OP) com Omie.

---

## Organização das Rotas

| Grupo | Descrição |
|---|---|
| **Commands** `POST /commands/*` | Intenções que saem do sistema → enfileiradas (Command Queue) |
| **Callbacks** `POST /callbacks/*` | Respostas que entram no sistema (Fake-only) |
| **Tracking** `GET /commands/:id` | Acompanhamento de status de comando |
| **Read-Models** `GET /read/*` | Consultas ao espelho local (sem efeito colateral) |
| **Refresh** `GET /read/*/refresh` | Consulta síncrona ao Omie + atualiza espelho |

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
  "omieCode": "9551864263",
  "quantity": 150,
  "forecastDate": "2026-08-01T00:00:00.000Z",
  "notes": "Alteração de quantidade"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `externalRequestId` | `string` | ✅ Sim | ID de idempotência |
| `omieCode` | `string` | ✅ Sim | Código da OP no Omie |
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
    "omieCode": "9551864263",
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
  "omieCode": "9551864263",
  "reason": "Cancelamento por solicitação do cliente"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `externalRequestId` | `string` | ✅ Sim | ID de idempotência |
| `omieCode` | `string` | ✅ Sim | Código da OP no Omie |
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
    "omieCode": "9551864263",
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
  "omieCode": "9551864263",
  "stage": "30"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `externalRequestId` | `string` | ✅ Sim | ID de idempotência |
| `omieCode` | `string` | ✅ Sim | Código da OP no Omie |
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
    "omieCode": "9551864263",
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

### 4.1 Listar Ordens de Produção

```
GET /v1/integration/read/production-orders?page=1&limit=20&completed=false&active=true&productCode=9468673347
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
        "omieCode": "9551864263",
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
curl.exe -s "http://localhost:3333/v1/integration/read/production-orders?page=1&limit=5&completed=false"
```

---

### 4.2 Detalhe da Ordem de Produção

```
GET /v1/integration/read/production-orders/:omieCode
```

Retorna detalhes + itens de uma OP específica.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "79db4515-...",
    "omieCode": "9551864263",
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
curl.exe -s "http://localhost:3333/v1/integration/read/production-orders/9551864263"
```

---

### 4.3 Estatísticas

```
GET /v1/integration/read/production-orders/stats
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
curl.exe -s "http://localhost:3333/v1/integration/read/production-orders/stats"
```

---

### 4.4 Status da Fila de Comandos

```
GET /v1/integration/read/production-orders/queue
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
curl.exe -s "http://localhost:3333/v1/integration/read/production-orders/queue"
```

---

### 4.5 Falhas na Fila

```
GET /v1/integration/read/production-orders/queue/failures
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
curl.exe -s "http://localhost:3333/v1/integration/read/production-orders/queue/failures"
```

---

### 4.6 Atualizar OP do Omie (Refresh)

```
GET /v1/integration/read/production-orders/:omieCode/refresh
```

Consulta a OP diretamente no Omie (`ConsultarOrdemProducao`), atualiza o espelho local e retorna dados frescos.
Rota **síncrona** — o dado é buscado do Omie e devolvido na hora.

**Path Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `omieCode` | `string` | ✅ Sim | Código numérico da OP no Omie (nCodOP) |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "omieCode": "9551864263",
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
curl.exe -s "http://localhost:3333/v1/integration/read/production-orders/9551864263/refresh"
```

---

### 4.7 Detalhe da OP com Estrutura (BOM) e Consumo

```
GET /v1/integration/production-orders/read/:omieCode/with-bom
```

Retorna a OP + nome do produto + itens da estrutura (BOM) com cálculo de consumo + itens da OP vindos do Omie.

**Path Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `omieCode` | `string` | ✅ Sim | Código numérico da OP no Omie (nCodOP) |

**Comportamento:**
- Busca a OP pelo `omieCode`
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
      "omieCode": "9529462060",
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

**Response 404:**

```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Production order 9999999999 not found"
}
```

**Exemplo curl:**

```bash
curl.exe -s "http://localhost:3333/v1/integration/production-orders/read/9529462060/with-bom"
```

---

## 5. Fluxo de Uso (Exemplo Completo)

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
curl.exe -s http://localhost:3333/v1/integration/read/production-orders/queue

# 5. Consultar OPs no espelho local
curl.exe -s "http://localhost:3333/v1/integration/read/production-orders?page=1&limit=10"
```

---

## 6. Tratamento de Erros

| Código HTTP | `error` | Significado |
|---|---|---|
| `202` | — | Comando aceito (processamento assíncrono) |
| `400` | `VALIDATION_ERROR` | Payload inválido (Zod validation) |
| `404` | `NOT_FOUND` | Recurso não encontrado |
| `405` | `METHOD_NOT_ALLOWED` | Disponível apenas em modo fake |
| `500` | `INTERNAL_ERROR` | Erro inesperado no servidor |
