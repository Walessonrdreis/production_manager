-- AlterTable
ALTER TABLE "OmieProduct" ADD COLUMN "omieCode" VARCHAR(32);
ALTER TABLE "OmieProduct" ADD COLUMN "familyDescription" TEXT;

-- CreateIndex
CREATE INDEX "OmieProduct_omieCode_idx" ON "OmieProduct"("omieCode");

