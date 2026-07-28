-- Normaliza nomes de colunas para snake_case
-- Renomeia colunas camelCase que ficaram sem @map() no schema original

ALTER TABLE "sales_order_item" RENAME COLUMN "productCode" TO "product_code";
ALTER TABLE "sales_order_item" RENAME COLUMN "salesOrderId" TO "sales_order_id";
