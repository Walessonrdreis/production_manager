# Sales Order Sync — Routes

## 🚀 Comandos (POST)

### Sync global

```
POST /v1/integration/sales-order-sync/sync-global
```

**Payload:**

```json
{
  "externalRequestId": "opcional-gerado-automaticamente",
  "pageSize": 100,
  "maxPages": 10000
}
```

**Descrição:**
Sincroniza pedidos de venda do Omie e persiste em `sales_order` e `sales_order_item`.
Após o sync, dispara refresh automático do read-model de produção (`product-catalog`)
e atualiza o read-model resumido e as transições de etapa.

**Resposta (202 Accepted):**

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

## 📘 Read-models (GET)

### Lista de pedidos

```
GET /v1/admin/read/sales-orders
```

**Query params:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `q` | string | Busca por número do pedido, nome do cliente ou observação |
| `stage` | string | Filtrar por etapa (ex: `20`, `30`) |
| `customerOmieId` | string | Filtrar por código do cliente Omie |
| `isCanceled` | boolean | `true` = só cancelados |
| `isClosed` | boolean | `true` = só encerrados |
| `activeOnly` | boolean | `true` = apenas não-cancelados e não-encerrados |
| `limit` | number | Máx. itens (default: 100) |
| `offset` | number | Deslocamento |

---

### Estatísticas dos pedidos

```
GET /v1/admin/read/sales-orders/stats
```

**Descrição:**
Retorna total, cancelados, encerrados e em aberto.

---

### Transições de etapa (histórico geral)

```
GET /v1/admin/read/sales-orders/transitions
```

**Query params:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `salesOrderOmieId` | string | Filtrar por ID do pedido |
| `toStage` | string | Filtrar por etapa de destino |
| `limit` | number | Máx. itens (default: 100) |
| `offset` | number | Deslocamento |

---

### Transições de etapa (por pedido)

```
GET /v1/admin/read/sales-orders/:omieId/transitions
```

**Descrição:**
Retorna o histórico de transições de etapa de um pedido específico.

---

### Itens em aberto (separação/expedição)

```
GET /v1/admin/read/sales-orders/open-items
```

**Query params:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `q` | string | Busca por descrição ou código do produto |
| `limit` | number | Máx. itens (default: 100) |
| `offset` | number | Deslocamento |

**Descrição:**
Lista itens de pedidos não cancelados e não encerrados para a equipe de separação/expedição (picking).

---

### Status do sync

```
GET /v1/integration/sales-order-sync/sync-status/:externalRequestId
```

**Descrição:**
Consulta o status do comando:

| Status | Significado |
|--------|-------------|
| `ACCEPTED` | Comando aceito, processando |
| `CONFIRMED` | Sync concluído com sucesso |
| `FAILED` | Sync falhou |