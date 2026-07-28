-- CreateTable
CREATE TABLE "ProductStructure" (
    "id" TEXT NOT NULL,
    "codProduto" TEXT NOT NULL,
    "descrProduto" TEXT,
    "codFamilia" TEXT,
    "descrFamilia" TEXT,
    "tipoProduto" TEXT,
    "unidProduto" TEXT,
    "pesoBruto" DECIMAL(18,6),
    "pesoLiquido" DECIMAL(18,6),
    "hasStructure" BOOLEAN NOT NULL DEFAULT false,
    "idProdutoOmie" INTEGER,
    "intProdutoOmie" TEXT,
    "structureHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductStructureItem" (
    "id" TEXT NOT NULL,
    "codProdutoPai" TEXT NOT NULL,
    "codProdutoComponente" TEXT NOT NULL,
    "descrProdutoComponente" TEXT,
    "codFamiliaComponente" TEXT,
    "descrFamiliaComponente" TEXT,
    "quantidade" DECIMAL(18,6) NOT NULL,
    "unidade" TEXT,
    "tipoProdutoComponente" TEXT,
    "percentualPerda" DECIMAL(18,6),
    "idMalhaOmie" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductStructureItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductStructure_codProduto_key" ON "ProductStructure"("codProduto");

-- CreateIndex
CREATE INDEX "ProductStructure_codProduto_idx" ON "ProductStructure"("codProduto");

-- CreateIndex
CREATE INDEX "ProductStructureItem_codProdutoPai_idx" ON "ProductStructureItem"("codProdutoPai");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStructureItem_codProdutoPai_codProdutoComponente_idM_key" ON "ProductStructureItem"("codProdutoPai", "codProdutoComponente", "idMalhaOmie");

-- AddForeignKey
ALTER TABLE "ProductStructureItem" ADD CONSTRAINT "ProductStructureItem_codProdutoPai_fkey" FOREIGN KEY ("codProdutoPai") REFERENCES "ProductStructure"("codProduto") ON DELETE CASCADE ON UPDATE CASCADE;
