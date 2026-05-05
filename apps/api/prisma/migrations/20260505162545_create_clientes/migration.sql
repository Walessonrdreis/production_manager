-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "codigo_cliente_omie" BIGINT NOT NULL,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "documento" TEXT NOT NULL,
    "tipoPessoa" "TipoPessoa" NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "isBillingBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAtOmie" TIMESTAMP(3),
    "updatedAtOmie" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_cliente_omie_key" ON "clientes"("codigo_cliente_omie");
