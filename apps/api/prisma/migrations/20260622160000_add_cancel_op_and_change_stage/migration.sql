-- Safe migration: add CANCEL_OP and CHANGE_STAGE to enum
-- ALTER TYPE ... ADD VALUE is safe (no table rewrite, no lock, no data loss)
-- Must be in its own transaction block

ALTER TYPE integration."ProductionOrderCommandType"
  ADD VALUE 'CANCEL_OP';

ALTER TYPE integration."ProductionOrderCommandType"
  ADD VALUE 'CHANGE_STAGE';
