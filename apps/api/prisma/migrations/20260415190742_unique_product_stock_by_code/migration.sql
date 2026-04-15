/*
  Warnings:

  - A unique constraint covering the columns `[omieCode]` on the table `product_stock` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `product_stock` table without a default value. This is not possible if the table is not empty.

*/
-- Deduplicate by omieCode (keep latest capturedAt per code)
WITH ranked AS (
  SELECT
    ctid,
    "omieCode",
    "capturedAt",
    ROW_NUMBER() OVER (
      PARTITION BY "omieCode"
      ORDER BY "capturedAt" DESC, id DESC
    ) AS rn
  FROM "product_stock"
)
DELETE FROM "product_stock" ps
USING ranked r
WHERE ps.ctid = r.ctid
  AND r.rn > 1;

-- DropIndex
DROP INDEX "product_stock_omieCode_capturedAt_idx";

-- DropIndex
DROP INDEX "product_stock_omieCode_idx";

-- AlterTable
ALTER TABLE "product_stock"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "product_stock"
SET "updatedAt" = "capturedAt";

-- CreateIndex
CREATE UNIQUE INDEX "product_stock_omieCode_key" ON "product_stock"("omieCode");
