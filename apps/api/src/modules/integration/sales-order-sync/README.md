# Sales Order Sync — Integration Module (API 1)

## Responsabilidades

- Sincronizar pedidos de venda do Omie
- Traduzir payload externo do Omie para modelo interno consistente
- Persistir `SalesOrder` e `SalesOrderItem`
- Garantir idempotência por `externalRequestId`
- Expor comando de sync global
- Expor status do sync

## Endpoints

### Comando
POST /v1/integration/sales-order-sync/sync-global

### Status
GET /v1/integration/sales-order-sync/sync-status/:externalRequestId

## Variáveis de ambiente

- SALES_ORDER_SYNC_GATEWAY=fake|real
- ENABLE_OMIE_SALES_ORDER_SYNC_JOB=true|false
- OMIE_SALES_ORDER_SYNC_CRON=...

## Observação

Este módulo substitui gradualmente o módulo antigo `integration/orders`, sem quebrar o que já funciona.