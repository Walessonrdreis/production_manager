# Sales Order Sync — Routes

## 🚀 Comandos (POST)

### Sync global
```
POST /v1/integration/sales-order-sync/commands/sync-global
```
**Payload:**
```json
{
  "externalRequestId": "opcional-gerado-automaticamente",
  "pageSize": 100,
  "maxPages": 10000
}
```
**Descrição:** Sincroniza pedidos do Omie. Após sync, dispara refresh do production-ready e atualiza read-model resumido.

**Resposta (202):**
```json
{ "success": true, "data": { "status": "ACCEPTED", "externalRequestId": "..." } }
```

---

## 📘 Read-models (GET)

### Lista de pedidos
```
GET /v1/admin/read/sales-orders
```
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `q` | string | Busca por número, cliente ou observação |
| `stage` | string | Filtrar por etapa (ex: `20`) |
| `customerOmieId` | string | Filtrar por código do cliente |
| `isCanceled` | boolean | `true` = só cancelados |
| `isClosed` | boolean | `true` = só encerrados |
| `activeOnly` | boolean | `true` = não-cancelados e não-encerrados |
| `limit` | number | Máx. itens (default: 100) |
| `offset` | number | Deslocamento |

---

### Detalhe do pedido
```
GET /v1/admin/read/sales-orders/:omieId
```
**Descrição:** Retorna os detalhes de um pedido específico pelo ID Omie.

**Resposta (200):**
```json
{
  "success": true,
  "data": {
    "omieId": "1234567890",
    "orderNumber": "3070",
    "stage": "20",
    "isCanceled": false,
    "isClosed": false,
    "customerOmieId": "9428243340",
    "customerName": "SX CORP LTDA",
    "forecastDate": "2026-05-19T00:00:00.000Z",
    "totalAmount": 320.00,
    "totalItems": 1,
    "totalQuantity": 10,
    "lastSyncAt": "2026-06-24T10:00:00.000Z"
  }
}
```
**Resposta (404):** `{ "success": false, "error": "NOT_FOUND", "message": "Sales order not found" }`

---

### Estatísticas
```
GET /v1/admin/read/sales-orders/stats
```

---

### Transições (geral)
```
GET /v1/admin/read/sales-orders/transitions
```
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `salesOrderOmieId` | string | Filtrar por ID do pedido |
| `toStage` | string | Filtrar por etapa de destino |
| `limit` | number | Máx. itens (default: 100) |
| `offset` | number | Deslocamento |

---

### Transições (por pedido)
```
GET /v1/admin/read/sales-orders/:omieId/transitions
```

---

### Itens em aberto (picking)
```
GET /v1/admin/read/sales-orders/open-items
```
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `q` | string | Busca por descrição ou código do produto |
| `limit` | number | Máx. itens (default: 100) |
| `offset` | number | Deslocamento |

---

### Status do sync
```
GET /v1/integration/sales-order-sync/commands/:externalRequestId
```
| Status | Significado |
|--------|-------------|
| `ACCEPTED` | Processando |
| `CONFIRMED` | Concluído |
| `FAILED` | Falhou |