/*
  Warnings:

  - Changed the type of `tipo_pessoa` on the `clientes` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "tipo_pessoa",
ADD COLUMN     "tipo_pessoa" "TipoPessoa" NOT NULL;

-- DropEnum
DROP TYPE "tipo_pessoa";
