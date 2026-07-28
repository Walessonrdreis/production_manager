# Production Orders — Gaps Fechados (2026-06-24)

## Gaps implementados

### 1. saveMany() batch
- Adicionado `saveMany(items)` em `production-order-sync.store.ts`
- Usa `$transaction` com upsert em lote (pedido + itens)
- Mais eficiente que `save()` individual para sync de páginas inteiras
- `sync-all-production-orders.usecase.ts` executor atualizado para usar `saveMany()`

### 2. Omie error mapping no sync-page gateway
- `real-production-order-sync-page.gateway.ts` agora importa e usa:
  - `isOmieErrorResponse` — detecta faultstring/status error
  - `isRedundantFault` — detecta rate-limit Omie
  - `buildOmieFaultError` / `buildOmieRedundantError` — erros tipados
  - `isOmieHttpErrorWithSample` / `mapHttpErrorToOmieError` — HTTP errors com sample

### 3. application/mappers/
- Criado `map-production-order-to-summary.ts` seguindo padrão do product-structure
- Exporta: `ProductionOrderSummaryItem`, `ProductionOrderDetailSummary`
- Funções: `mapProductionOrderToSummary()`, `mapProductionOrderToDetail()`

## Próximos gaps opcionais
- Omie error mapping nos gateways creation, cancel, update, change-stage, consult
- (sync-page já foi feito, que é o mais crítico por ser o fluxo de sync)
