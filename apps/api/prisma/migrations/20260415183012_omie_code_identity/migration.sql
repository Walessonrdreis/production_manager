/*
  Warnings:

  - You are about to alter the column `omieId` on the `OmieProduct` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.
  - A unique constraint covering the columns `[omieCode]` on the table `OmieProduct` will be added. If there are existing duplicate values, this will fail.
  - Made the column `omieCode` on table `OmieProduct` required. This step will fail if there are existing NULL values in that column.

*/
-- Normalize/Backfill
UPDATE "OmieProduct"
SET
  "omieCode" = NULLIF(BTRIM("omieCode"), ''),
  "omieId" = NULLIF(BTRIM("omieId"), '');

UPDATE "OmieProduct"
SET "omieCode" = COALESCE(
  NULLIF(BTRIM("omieCode"), ''),
  NULLIF(BTRIM("rawPayload"->>'codigo'), ''),
  NULLIF(BTRIM("rawPayload"->>'cod_int'), ''),
  NULLIF(BTRIM("rawPayload"->>'codigo_item'), ''),
  NULLIF(BTRIM("rawPayload"->>'codigo_produto'), ''),
  NULLIF(BTRIM("rawPayload"->>'id'), ''),
  NULLIF(BTRIM("omieId"), '')
)
WHERE "omieCode" IS NULL OR BTRIM("omieCode") = '';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "OmieProduct" WHERE "omieCode" IS NULL OR BTRIM("omieCode") = '') THEN
    RAISE EXCEPTION 'Cannot enforce OmieProduct.omieCode NOT NULL: still has NULL/empty values after backfill';
  END IF;
END $$;

-- Safety: do not auto-merge multiple managed Products per omieCode (would violate Product.omieProductId unique)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Product" p
    JOIN "OmieProduct" o ON o.id = p."omieProductId"
    WHERE o."omieCode" IS NOT NULL
    GROUP BY o."omieCode"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot dedupe OmieProduct: multiple Product rows exist for the same omieCode. Resolve manually before applying migration.';
  END IF;
END $$;

-- Deduplicate OmieProduct by omieCode (keep row that is referenced by Product when possible)
WITH ranked AS (
  SELECT
    o.id,
    o."omieCode",
    CASE WHEN p.id IS NULL THEN 0 ELSE 1 END AS has_product
  FROM "OmieProduct" o
  LEFT JOIN "Product" p ON p."omieProductId" = o.id
  WHERE o."omieCode" IS NOT NULL
),
canon AS (
  SELECT DISTINCT ON ("omieCode")
    "omieCode",
    id AS keep_id
  FROM ranked
  ORDER BY "omieCode", has_product DESC, id ASC
),
dupes AS (
  SELECT o.id AS drop_id, o."omieCode", c.keep_id
  FROM "OmieProduct" o
  JOIN canon c ON c."omieCode" = o."omieCode"
  WHERE o.id <> c.keep_id
)
UPDATE "Product" p
SET "omieProductId" = d.keep_id
FROM dupes d
WHERE p."omieProductId" = d.drop_id;

WITH ranked AS (
  SELECT
    o.id,
    o."omieCode",
    CASE WHEN p.id IS NULL THEN 0 ELSE 1 END AS has_product
  FROM "OmieProduct" o
  LEFT JOIN "Product" p ON p."omieProductId" = o.id
  WHERE o."omieCode" IS NOT NULL
),
canon AS (
  SELECT DISTINCT ON ("omieCode")
    "omieCode",
    id AS keep_id
  FROM ranked
  ORDER BY "omieCode", has_product DESC, id ASC
),
dupes AS (
  SELECT o.id AS drop_id
  FROM "OmieProduct" o
  JOIN canon c ON c."omieCode" = o."omieCode"
  WHERE o.id <> c.keep_id
)
DELETE FROM "OmieProduct" o
USING dupes d
WHERE o.id = d.drop_id;

-- DropIndex
DROP INDEX "OmieProduct_omieCode_idx";

-- DropIndex
DROP INDEX "OmieProduct_omieId_key";

-- AlterTable
ALTER TABLE "OmieProduct"
  ALTER COLUMN "omieId" DROP NOT NULL,
  ALTER COLUMN "omieId" SET DATA TYPE VARCHAR(64),
  ALTER COLUMN "omieCode" SET NOT NULL,
  ALTER COLUMN "omieCode" SET DATA TYPE VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "OmieProduct_omieCode_key" ON "OmieProduct"("omieCode");
