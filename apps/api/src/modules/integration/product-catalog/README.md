# Product Catalog — Integration Module (API 1)

## Responsabilidades
- Manter o espelho local do catálogo de produtos do Omie
- Expor read-model para consumo pela API 2
- Permitir sync on-demand por produto
- Permitir sync global automático do catálogo
- Não chamar Omie em read-model
- Não executar efeitos colaterais em read-model

## Rotas
- GET /v1/admin/read/products/catalog
- GET /v1/admin/read/products/catalog/:productCode
- POST /v1/integration/product-catalog/:productCode/sync
- POST /v1/integration/product-catalog/sync-global

## Ambiente
- PRODUCT_CATALOG_GATEWAY=fake|real
- ENABLE_OMIE_PRODUCT_CATALOG_SYNC_JOB=true|false
- OMIE_PRODUCT_CATALOG_SYNC_CRON=...

## Observação
Este módulo usa `omie_product` como espelho canônico do catálogo.