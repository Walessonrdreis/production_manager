# Sales Order Sync — Routes

## 🚀 Comandos (POST)

### Sync global
POST /v1/integration/sales-order-sync/sync-global

Payload:
{
  "externalRequestId": "opcional",
  "pageSize": 100,
  "maxPages": 10000
}

Descrição:
Sincroniza pedidos de venda do Omie e persiste em `sales_order` e `sales_order_item`.

---

## 📘 Read-model / Status (GET)

### Status do sync
GET /v1/integration/sales-order-sync/sync-status/:externalRequestId

Descrição:
Consulta o status do comando:
- ACCEPTED
- CONFIRMED
- FAILED