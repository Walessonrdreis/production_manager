DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'integration' AND table_name = 'product_structure_command' AND column_name = 'retryCount') THEN
    ALTER TABLE integration.product_structure_command DROP COLUMN "retryCount";
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'integration' AND table_name = 'product_structure_command' AND column_name = 'retry_count') THEN
    ALTER TABLE integration.product_structure_command ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;