-- AlterEnum (ProductStructureCommandType)
ALTER TYPE integration."ProductStructureCommandType" ADD VALUE IF NOT EXISTS 'SYNC_GLOBAL' BEFORE 'APPLY';

-- AlterEnum (ProductStructureCommandStatus)
ALTER TYPE integration."ProductStructureCommandStatus" ADD VALUE IF NOT EXISTS 'PENDING' BEFORE 'ACCEPTED';

ALTER TYPE integration."ProductStructureCommandStatus" ADD VALUE IF NOT EXISTS 'PROCESSING' BEFORE 'ACCEPTED';

-- AlterTable: change default status
ALTER TABLE integration.product_structure_command
ALTER COLUMN status
SET DEFAULT 'PENDING';

-- AlterTable: add payload and retryCount if not exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'integration' AND table_name = 'product_structure_command' AND column_name = 'payload') THEN
    ALTER TABLE integration.product_structure_command ADD COLUMN "payload" JSONB;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'integration' AND table_name = 'product_structure_command' AND column_name = 'retry_count') THEN
    ALTER TABLE integration.product_structure_command ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;