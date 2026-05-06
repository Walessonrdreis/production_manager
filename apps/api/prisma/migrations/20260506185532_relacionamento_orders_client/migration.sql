/*
  Warnings:

  - You are about to drop the column `dAlt` on the `omie_order` table. All the data in the column will be lost.
  - You are about to drop the column `dCan` on the `omie_order` table. All the data in the column will be lost.
  - You are about to drop the column `dInc` on the `omie_order` table. All the data in the column will be lost.
  - You are about to drop the column `hAlt` on the `omie_order` table. All the data in the column will be lost.
  - You are about to drop the column `hCan` on the `omie_order` table. All the data in the column will be lost.
  - You are about to drop the column `hInc` on the `omie_order` table. All the data in the column will be lost.
  - You are about to drop the column `quantidadeItens` on the `omie_order` table. All the data in the column will be lost.
  - You are about to drop the column `uAlt` on the `omie_order` table. All the data in the column will be lost.
  - You are about to drop the column `uInc` on the `omie_order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "omie_order" DROP COLUMN "dAlt",
DROP COLUMN "dCan",
DROP COLUMN "dInc",
DROP COLUMN "hAlt",
DROP COLUMN "hCan",
DROP COLUMN "hInc",
DROP COLUMN "quantidadeItens",
DROP COLUMN "uAlt",
DROP COLUMN "uInc";

-- CreateIndex
CREATE INDEX "omie_order_codigoCliente_idx" ON "omie_order"("codigoCliente");
