-- CreateIndex
CREATE INDEX "idx_prorm_open_stage" ON "read_model"."production_order_read_model"("is_open", "stage");

-- CreateIndex
CREATE INDEX "idx_prorm_has_stock_issue" ON "read_model"."production_order_read_model"("has_stock_issue");

-- CreateIndex
CREATE INDEX "idx_prorm_has_missing_materials" ON "read_model"."production_order_read_model"("has_missing_materials");

-- CreateIndex
CREATE INDEX "idx_prorm_has_critical_material" ON "read_model"."production_order_read_model"("has_critical_material");
