# Módulo de Integração de Ordens de Produção

Este módulo gerencia a integração de ordens de produção com sistemas externos (Omie), seguindo o padrão Clean Architecture.

## 📋 Rotas Disponíveis

### 1. **POST** `/v1/integration/production-order`
Cria uma nova ordem de produção.

**Request Body:**
```json
{
  "productId": "string",
  "quantity": "number > 0",
  "externalRequestId": "string",
  "scheduledDate": "string (ISO datetime, optional)",
  "notes": "string (optional)"
}
```

**Responses:**
- `202 Accepted`: Ordem aceita para processamento
  ```json
  {
    "success": true,
    "data": {
      "externalRequestId": "string",
      "status": "ACCEPTED"
    }
  }
  ```
- `400 Bad Request`: Erro de validação
  ```json
  {
    "success": false,
    "error": "VALIDATION_ERROR",
    "message": "Invalid request payload"
  }
  ```
- `500 Internal Server Error`: Erro interno
  ```json
  {
    "success": false,
    "error": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
  ```

---

### 2. **GET** `/v1/integration/production-orders/:externalRequestId`
Consulta o status de uma ordem de produção.

**Path Parameters:**
- `externalRequestId`: ID externo da ordem

**Responses:**
- `200 OK`: Status encontrado
  ```json
  {
    "success": true,
    "data": {
      "externalRequestId": "string",
      "productId": "string",
      "quantity": "number",
      "scheduledDate": "string (optional)",
      "notes": "string (optional)",
      "status": "ACCEPTED | CONFIRMED | FAILED",
      "omieProductionOrderId": "number (optional)",
      "createdAt": "string (ISO datetime)",
      "updatedAt": "string (ISO datetime)",
      "lastError": {
        "code": "string",
        "message": "string"
      } (optional)
    }
  }
  ```
- `404 Not Found`: Ordem não encontrada
  ```json
  {
    "success": false,
    "error": "NOT_FOUND",
    "message": "Production order request not found"
  }
  ```

---

### 3. **POST** `/v1/integration/production-orders/:externalRequestId/confirm`
**FAKE ONLY** - Confirma uma ordem de produção (disponível apenas quando `PRODUCTION_ORDER_GATEWAY=fake`).

**Path Parameters:**
- `externalRequestId`: ID externo da ordem

**Responses:**
- `200 OK`: Ordem confirmada
  ```json
  {
    "success": true,
    "data": {
      "externalRequestId": "string",
      "productId": "string",
      "quantity": "number",
      "scheduledDate": "string (optional)",
      "notes": "string (optional)",
      "status": "CONFIRMED",
      "omieProductionOrderId": "number (optional)",
      "createdAt": "string (ISO datetime)",
      "updatedAt": "string (ISO datetime)"
    }
  }
  ```
- `404 Not Found`: Ordem não encontrada
- `405 Method Not Allowed`: Quando `PRODUCTION_ORDER_GATEWAY=real`

---

### 4. **POST** `/v1/integration/production-orders/:externalRequestId/fail`
**FAKE ONLY** - Marca uma ordem de produção como falha (disponível apenas quando `PRODUCTION_ORDER_GATEWAY=fake`).

**Path Parameters:**
- `externalRequestId`: ID externo da ordem

**Request Body:**
```json
{
  "code": "string",
  "message": "string"
}
```

**Responses:**
- `200 OK`: Ordem marcada como falha
  ```json
  {
    "success": true,
    "data": {
      "externalRequestId": "string",
      "productId": "string",
      "quantity": "number",
      "scheduledDate": "string (optional)",
      "notes": "string (optional)",
      "status": "FAILED",
      "omieProductionOrderId": "number (optional)",
      "createdAt": "string (ISO datetime)",
      "updatedAt": "string (ISO datetime)",
      "lastError": {
        "code": "string",
        "message": "string"
      }
    }
  }
  ```
- `404 Not Found`: Ordem não encontrada
- `405 Method Not Allowed`: Quando `PRODUCTION_ORDER_GATEWAY=real`

---

## 🏗️ Arquitetura

```
production-orders/
├── application/
│   ├── ports/
│   │   └── production-order-integration.gateway.ts
│   └── use-cases/
│       └── create-production-order.usecase.ts
├── infrastructure/
│   ├── db/
│   │   └── production-order-integration.store.ts
│   └── gateways/
│       ├── creation/
│       │   ├── fake-production-order-creation.gateway.ts
│       │   ├── production-order-creation.gateway.ts
│       │   └── real-production-order-creation.gateway.ts
│       ├── lifecycle/
│       │   ├── fake-production-order-lifecycle.gateway.ts
│       │   └── production-order-lifecycle.gateway.ts
│       └── query/
│           ├── fake-production-order-query.gateway.ts
│           └── production-order-query.gateway.ts
├── presentation/
│   └── http/
│       ├── controllers/
│       │   ├── create-production-order.controller.ts
│       │   ├── get-production-order-status.controller.ts
│       │   ├── confirm-production-order.controller.ts
│       │   └── fail-production-order.controller.ts
│       ├── routes.ts
│       └── schemas.ts
├── index.ts
├── production-orders-integration-register.ts
└── README.md
```

---

## ⚙️ Configuração

**Variáveis de Ambiente:**
- `PRODUCTION_ORDER_GATEWAY`: `"fake"` (default) ou `"real"`
- `OMIE_APP_KEY`: Chave da API Omie (apenas para gateway real)
- `OMIE_APP_SECRET`: Segredo da API Omie (apenas para gateway real)
- `OMIE_BASE_URL`: URL base da API Omie (apenas para gateway real)

---

## 🔄 Fluxo de Integração

1. **API 2** → Envia comando para **API 1** via `POST /v1/integration/production-order`
2. **API 1** → Valida payload e seleciona gateway (fake/real)
3. **Gateway Fake** → Retorna `ACCEPTED` imediatamente (simulação)
4. **Gateway Real** → Chama API Omie (`IncluirOrdemProducao`)
5. **API 1** → Retorna resposta para **API 2**

---

## 🧪 Endpoints de Teste (Fake Only)

Quando `PRODUCTION_ORDER_GATEWAY=fake`, endpoints adicionais estão disponíveis para simulação:

1. **Confirmar Ordem**: `POST /v1/integration/production-orders/:id/confirm`
2. **Falhar Ordem**: `POST /v1/integration/production-orders/:id/fail`

Estes endpoints são **bloqueados** quando `PRODUCTION_ORDER_GATEWAY=real`.

---

## 📊 Status da Ordem

- `ACCEPTED`: Ordem aceita para processamento
- `CONFIRMED`: Ordem confirmada pelo sistema externo (fake only)
- `FAILED`: Falha na integração (fake only)

---

## 🔒 Segurança

- **API 1** é a única responsável por integrações externas
- **API 2** nunca faz chamadas diretas a sistemas externos
- Endpoints fake são protegidos por variável de ambiente

---

## 🚀 Uso em Produção

Para usar integração real com Omie:
1. Configure `PRODUCTION_ORDER_GATEWAY=real`
2. Forneça credenciais válidas da API Omie
3. Teste em ambiente de staging antes de produção

Para desenvolvimento/teste:
1. Mantenha `PRODUCTION_ORDER_GATEWAY=fake`
2. Use endpoints fake para simular diferentes cenários
