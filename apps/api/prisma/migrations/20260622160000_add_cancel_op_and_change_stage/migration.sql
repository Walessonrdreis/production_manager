-- Safe migration: add CANCEL_OP and CHANGE_STAGE to enum
-- ALTER TYPE ... ADD VALUE IF NOT EXISTS is safe (no table rewrite, no lock, no data loss)
-- IF NOT EXISTS previne erro no shadow DB replay quando o tipo já foi criado com todos os valores

ALTER TYPE integration."ProductionOrderCommandType"
  ADD VALUE IF NOT EXISTS 'CANCEL_OP';

ALTER TYPE integration."ProductionOrderCommandType"
  ADD VALUE IF NOT EXISTS 'CHANGE_STAGE';