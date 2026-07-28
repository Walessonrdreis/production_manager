-- Rename omieCode to omieId in OmieProductionOrder and ProductionOrderReadModel
-- omieCode stores nCodOP (numeric ID), not a visible code
-- Drop dead omieId column (was never populated)

-- OmieProductionOrder: DROP dead omie_id, RENAME omie_code TO omie_id
ALTER TABLE integration.omie_production_order
DROP COLUMN IF EXISTS omie_id;

ALTER TABLE integration.omie_production_order
RENAME COLUMN omie_code TO omie_id;

-- Recreate unique index with new name
ALTER INDEX integration.omie_production_order_omie_code_key
RENAME TO omie_production_order_omie_id_key;

-- ProductionOrderReadModel: RENAME omie_code TO omie_id
ALTER TABLE read_model.production_order_read_model
RENAME COLUMN omie_code TO omie_id;

-- Rename index to match new column name
ALTER INDEX read_model.production_order_read_model_omie_code_key
RENAME TO production_order_read_model_omie_id_key;