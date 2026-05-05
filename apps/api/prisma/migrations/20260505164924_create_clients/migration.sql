/*
  Warnings:

  - You are about to drop the `clientes` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- DropTable
DROP TABLE "clientes";

-- DropEnum
DROP TYPE "TipoPessoa";

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "codigo_cliente_omie" BIGINT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "documento" TEXT NOT NULL,
    "personType" "PersonType" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isBillingBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAtOmie" TIMESTAMP(3),
    "updatedAtOmie" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_codigo_cliente_omie_key" ON "clients"("codigo_cliente_omie");
