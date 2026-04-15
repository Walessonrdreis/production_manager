/*
  Warnings:

  - You are about to alter the column `sku` on the `OmieProduct` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.

*/
-- AlterTable
ALTER TABLE "OmieProduct" ALTER COLUMN "sku" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "omieCode" SET DATA TYPE VARCHAR(64);
