-- CreateTable
CREATE TABLE "omie_order" (
    "id" TEXT NOT NULL,
    "omieCode" VARCHAR(64) NOT NULL,
    "numeroPedido" VARCHAR(64),
    "codigoCliente" VARCHAR(64),
    "codigoEmpresa" VARCHAR(64),
    "etapa" VARCHAR(10) NOT NULL,
    "cancelado" CHAR(1) NOT NULL DEFAULT 'N',
    "encerrado" CHAR(1) NOT NULL DEFAULT 'N',
    "dataPrevisao" TIMESTAMP(3),
    "dCan" TIMESTAMP(3),
    "hCan" VARCHAR(16),
    "dInc" TIMESTAMP(3),
    "hInc" VARCHAR(16),
    "uInc" VARCHAR(64),
    "dAlt" TIMESTAMP(3),
    "hAlt" VARCHAR(16),
    "uAlt" VARCHAR(64),
    "quantidadeItens" INTEGER,
    "rawPayload" JSONB NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "omie_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "omie_order_item" (
    "id" TEXT NOT NULL,
    "omieItemCode" VARCHAR(64) NOT NULL,
    "omieOrderId" TEXT NOT NULL,
    "omieProductCode" VARCHAR(64),
    "sku" VARCHAR(128),
    "description" TEXT NOT NULL,
    "unit" VARCHAR(16),
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,6),
    "totalPrice" DECIMAL(18,2),
    "rawPayload" JSONB NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "omie_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "omie_order_etapa_idx" ON "omie_order"("etapa");

-- CreateIndex
CREATE INDEX "omie_order_cancelado_encerrado_idx" ON "omie_order"("cancelado", "encerrado");

-- CreateIndex
CREATE UNIQUE INDEX "omie_order_omieCode_key" ON "omie_order"("omieCode");

-- CreateIndex
CREATE INDEX "omie_order_item_omieOrderId_idx" ON "omie_order_item"("omieOrderId");

-- CreateIndex
CREATE INDEX "omie_order_item_omieProductCode_idx" ON "omie_order_item"("omieProductCode");

-- CreateIndex
CREATE INDEX "omie_order_item_description_idx" ON "omie_order_item"("description");

-- CreateIndex
CREATE UNIQUE INDEX "omie_order_item_omieItemCode_key" ON "omie_order_item"("omieItemCode");

-- AddForeignKey
ALTER TABLE "omie_order_item" ADD CONSTRAINT "omie_order_item_omieOrderId_fkey" FOREIGN KEY ("omieOrderId") REFERENCES "omie_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
