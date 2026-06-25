# Sales Order Sync — Integration Module (API 1)

## 🎯 Responsabilidades

- Sincronizar pedidos de venda do Omie (`sales_order` / `sales_order_item`)
- Traduzir payload externo do Omie para modelo interno consistente
- Garantir idempotência por `externalRequestId`
- Expor read-models otimizados: resumo de pedidos, transições de etapa e itens em aberto
- Expor comando de sync global
- **Nunca** chamar Omie em endpoints de leitura
- **Nunca** executar efeitos colaterais em read-models

---

## 📘 1. Read-models (GET)

---

### 🔹 Lista de pedidos (resumo)

```
GET /v1/admin/read/sales-orders
```

#### Query params

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `q` | string | Busca por número do pedido, nome do cliente ou observação |
| `stage` | string | Filtrar por etapa (ex: `20`, `30`) |
| `customerOmieId` | string | Filtrar por código do cliente Omie |
| `isCanceled` | boolean | `true` = só cancelados, `false` = só não-cancelados |
| `isClosed` | boolean | `true` = só encerrados, `false` = só abertos |
| `activeOnly` | boolean | `true` = apenas não-cancelados e não-encerrados |
| `limit` | number | Máx. itens por página (default: 100) |
| `offset` | number | Deslocamento para paginação |

#### Exemplo de uso

```bash
curl "http://localhost:3333/v1/admin/read/sales-orders?q=chocolate&limit=5&activeOnly=true"
```

#### Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": "ead3aa17-...",
      "orderNumber": "3070",
      "stage": "00",
      "customerName": "SX CORP LTDA",
      "customerOmieId": "9428243340",
      "total": 320,
      "forecastDate": "2026-05-19T00:00:00.000Z",
      "isCanceled": false,
      "isClosed": false,
      "createdAt": "2026-04-14T18:08:00.000Z",
      "updatedAt": "2026-04-14T18:08:00.000Z"
    }
  ],
  "meta": { "total": 1846, "pageSize": 5, "pageCount": 370, "offset": 0 }
}
```

---

### 🔹 Estatísticas de pedidos

```
GET /v1/admin/read/sales-orders/stats
```

#### Exemplo de uso

```bash
curl "http://localhost:3333/v1/admin/read/sales-orders/stats"
```

#### Resposta

```json
{
  "success": true,
  "data": {
    "total": 1846,
    "canceled": 28,
    "closed": 318,
    "open": 1500
  }
}
```

---

### 🔹 Transições de etapa (histórico geral)

```
GET /v1/admin/read/sales-orders/transitions
```

#### Query params

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `salesOrderOmieId` | string | Filtrar por ID do pedido |
| `toStage` | string | Filtrar por etapa de destino (ex: `20`, `30`) |
| `limit` | number | Máx. itens por página (default: 100) |
| `offset` | number | Deslocamento para paginação |

#### Exemplo de uso

```bash
curl "http://localhost:3333/v1/admin/read/sales-orders/transitions?limit=5"
```

---

### 🔹 Transições de etapa (por pedido)

```
GET /v1/admin/read/sales-orders/:omieId/transitions
```

#### Exemplo de uso

```bash
curl "http://localhost:3333/v1/admin/read/sales-orders/ead3aa17-f2b6-4c78-b94d-d611d11329eb/transitions"
```

---

### 🔹 Itens em aberto (separação/expedição)

```
GET /v1/admin/read/sales-orders/open-items
```

Lista itens de pedidos **não cancelados e não encerrados** para a equipe de separação/expedição (`picking`).

#### Query params

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `q` | string | Busca por descrição ou código do produto |
| `limit` | number | Máx. itens por página (default: 100) |
| `offset` | number | Deslocamento para paginação |

#### Exemplo de uso

```bash
curl "http://localhost:3333/v1/admin/read/sales-orders/open-items?q=chocolate&limit=5"
```

#### Resposta

```json
{
  "success": true,
  "data": [
    {
      "salesOrderId": "ead3aa17-...",
      "orderNumber": "3070",
      "stage": "00",
      "customerName": "SX CORP LTDA",
      "customerOmieId": "9428243340",
      "forecastDate": "2026-05-19T00:00:00.000Z",
      "itemId": "3632adc5-...",
      "productCode": "nat",
      "description": "Chocolate Quente Tradicional",
      "unit": "UN",
      "quantity": 2,
      "unitPrice": 20,
      "totalPrice": 0
    }
  ],
  "meta": { "total": 6, "pageSize": 5, "pageCount": 2, "offset": 0 }
}
```

---

### 🔹 Status de sync

```
GET /v1/integration/sales-order-sync/commands/:externalRequestId
```

#### Exemplo de uso

```bash
curl "http://localhost:3333/v1/integration/sales-order-sync/commands/sales-order-sync-1745000000000-abc123"
```

#### Resposta

```json
{
  "success": true,
  "data": {
    "status": "CONFIRMED",
    "externalRequestId": "sales-order-sync-1745000000000-abc123",
    "processedPages": 10,
    "totalPages": 10,
    "processedItems": 1846
  }
}
```

---

## 🚀 2. Comandos de integração (POST)

---

### 🔹 Sync global de pedidos

```
POST /v1/integration/sales-order-sync/commands/sync-global
```

#### Payload

```json
{
  "externalRequestId": "opcional-gerado-automaticamente",
  "pageSize": 100,
  "maxPages": 10000
}
```

#### Comportamento

- Busca **todas as páginas** de pedidos do Omie
- Idempotente por `externalRequestId`
- Paginação real do Omie com retry por página
- Após o sync, dispara **refresh automático** do read-model de produção (`product-catalog`)
- Após o sync, atualiza o **read-model resumido** (`sales_order_summary_read_model`)
- Registra **transições de etapa** detectadas
- Retorna `202 Accepted` (eventual-consistente)

#### Exemplo de uso

```bash
curl -X POST "http://localhost:3333/v1/integration/sales-order-sync/commands/sync-global" \
  -H "Content-Type: application/json" \
  -d '{"pageSize": 100}'
```

#### Resposta

```json
{
  "success": true,
  "data": {
    "status": "ACCEPTED",
    "externalRequestId": "sales-order-sync-1745000000000-abc123"
  }
}
```

---

## ⚙️ 3. Variáveis de Ambiente

```env
# Gateway: "fake" (não chama Omie) | "real" (chama Omie de verdade)
SALES_ORDER_SYNC_GATEWAY=fake|real

# Job automático
ENABLE_OMIE_SALES_ORDER_SYNC_JOB=true|false
OMIE_SALES_ORDER_SYNC_CRON=0 */6 * * *
```

## 📁 4. Modelos Prisma

- `SalesOrder` (`sales_order`) — espelho local dos pedidos de venda
- `SalesOrderItem` (`sales_order_item`) — itens dos pedidos
- `SalesOrderSyncCommand` (`sales_order_sync_command`) — command store com idempotência
- `SalesOrderSyncState` (`sales_order_sync_state`) — estado do último sync global
- `SalesOrderStageTransition` (`sales_order_stage_transition`) — histórico de transições de etapa
- `SalesOrderSummaryReadModel` (`sales_order_summary_read_model`) — read-model materializado

## 🔄 5. Fluxo de Atualização

Após um sync global:

1. Pedidos e itens são persistidos em `sales_order` / `sales_order_item`
2. Transições de etapa são detectadas e registradas
3. Read-model resumido é atualizado (`sales_order_summary_read_model`)
4. Read-model de produção (`product_catalog_production_ready_read_model`) é refrescado

## 📌 6. Observações

- Endpoints de leitura **nunca chamam Omie** — consomem apenas dados locais
- Comandos retornam `202 Accepted` e processam em background
- Este módulo substitui gradualmente o módulo antigo `integration/orders`
- A paginação respeita os limites da API Omie com retry automático