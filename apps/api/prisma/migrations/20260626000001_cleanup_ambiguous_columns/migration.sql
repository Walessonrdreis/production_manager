-- Cleanup ambiguous columns after migration to productOmieId
-- Part of Fase 4 — removing legacy confusing column names

-- ProductStock: omie_code was confusing (contains numeric ID, not visible code)
ALTER TABLE integration.product_stock
DROP COLUMN IF EXISTS omie_code;

ALTER TABLE integration.product_stock
ALTER COLUMN product_omie_id
SET
    NOT NULL;

ALTER TABLE integration.product_stock
ADD CONSTRAINT uq_product_stock_omie_id UNIQUE (product_omie_id);

-- OmieProductionOrder: product_code was confusing (contains numeric ID, not visible code)
ALTER TABLE integration.omie_production_order
DROP COLUMN IF EXISTS product_code;

-- ProductStockCommand: product_id was legacy field superseded by product_omie_id
DELETE FROM integration.product_stock_command
WHERE
    product_omie_id IS NULL;

ALTER TABLE integration.product_stock_command
DROP COLUMN IF EXISTS product_id;

ALTER TABLE integration.product_stock_command
ALTER COLUMN product_omie_id
SET
    NOT NULL;