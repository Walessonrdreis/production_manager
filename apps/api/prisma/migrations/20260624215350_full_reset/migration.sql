/*
  Warnings:

  - You are about to drop the `bam` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job_common` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job_dependency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `queue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `version` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `warning` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "integration"."queue" DROP CONSTRAINT "queue_dead_letter_fkey";

-- DropForeignKey
ALTER TABLE "integration"."schedule" DROP CONSTRAINT "schedule_name_fkey";

-- DropForeignKey
ALTER TABLE "integration"."subscription" DROP CONSTRAINT "subscription_name_fkey";

-- DropTable
DROP TABLE "integration"."bam";

-- DropTable
DROP TABLE "integration"."job";

-- DropTable
DROP TABLE "integration"."job_common";

-- DropTable
DROP TABLE "integration"."job_dependency";

-- DropTable
DROP TABLE "integration"."queue";

-- DropTable
DROP TABLE "integration"."schedule";

-- DropTable
DROP TABLE "integration"."subscription";

-- DropTable
DROP TABLE "integration"."version";

-- DropTable
DROP TABLE "integration"."warning";

-- DropEnum
DROP TYPE "integration"."job_state";

-- RenameIndex
ALTER INDEX "integration"."omie_production_order_item_omie_item_code_omie_production_order" RENAME TO "omie_production_order_item_omie_item_code_omie_production_o_key";
