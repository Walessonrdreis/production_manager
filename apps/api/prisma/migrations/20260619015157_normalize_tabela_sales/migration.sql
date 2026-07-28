-- RenameForeignKey
ALTER TABLE "sales_order_item" RENAME CONSTRAINT "sales_order_item_salesOrderId_fkey" TO "sales_order_item_sales_order_id_fkey";

-- RenameIndex
ALTER INDEX "sales_order_item_productCode_idx" RENAME TO "sales_order_item_product_code_idx";

-- RenameIndex
ALTER INDEX "sales_order_item_salesOrderId_idx" RENAME TO "sales_order_item_sales_order_id_idx";
