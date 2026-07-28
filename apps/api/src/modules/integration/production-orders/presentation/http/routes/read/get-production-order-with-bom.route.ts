// ---------------------------------------------------------------------------
// Route — Get Production Order Detail with BOM Consumption
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/:omieId/with-bom
// Retorna OP + nome do produto + itens da estrutura com consumo previsto
// e impacto no estoque dos componentes.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { prisma } from "@/shared/db/prisma";

export async function registerGetProductionOrderWithBomRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/:omieId/with-bom",
        async (request, reply) => {
            try {
                const { omieId } = request.params as { omieId: string };

                // 1. Buscar a OP com o nome do produto
                const op = await prisma.$queryRawUnsafe<
                    Array<{
                        omie_id: string;
                        order_number: string | null;
                        quantity: string;
                        forecast_date: Date | null;
                        start_date: Date | null;
                        completion_date: Date | null;
                        stage: string | null;
                        completed: boolean;
                        active: boolean;
                        product_omie_id: string | null;
                        product_name: string | null;
                        last_sync_at: Date;
                    }>
                >(
                    `SELECT
            op.omie_id,
            op.order_number,
            op.quantity,
            op.forecast_date,
            op.start_date,
            op.completion_date,
            op.stage,
            op.completed,
            op.active,
            op.product_omie_id,
            p.description AS product_name,
            op.last_sync_at
          FROM integration.omie_production_order op
          LEFT JOIN integration.omie_product p ON p.omie_id = op.product_omie_id
          WHERE op.omie_id = $1
          LIMIT 1`,
                    omieId
                );

                if (!op || op.length === 0) {
                    return reply.code(404).send({
                        success: false,
                        error: "NOT_FOUND",
                        message: `Production order ${omieId} not found`,
                    });
                }

                const order = op[0];
                const productOmieId = order.product_omie_id;
                const opQuantity = parseFloat(order.quantity) || 0;

                // 2. Buscar os itens da estrutura (BOM) com estoque atual
                //    O product_omie_id na OP é o ID numérico Omie (ex: "9116171995"),
                //    mas a product_structure usa código interno (ex: "100kg").
                //    Tentamos matching direto e também via o read-model de catálogo.
                interface BomRow {
                    component_code: string;
                    component_name: string | null;
                    unit: string | null;
                    quantity_per_unit: string;
                    loss_percent: string | null;
                    total_consumption: string;
                    current_stock: string | null;
                    stock_after_consumption: string | null;
                }

                let bomItems: BomRow[] = [];

                if (productOmieId) {
                    // Tenta match direto (código interno) e via catálogo (código Omie)
                    bomItems = await prisma.$queryRawUnsafe<BomRow[]>(
                        `SELECT
              psi.cod_produto_componente AS component_code,
              psi.descr_produto_componente AS component_name,
              psi.unidade AS unit,
              psi.quantidade::numeric AS quantity_per_unit,
              psi.percentual_perda::numeric AS loss_percent,
              (CAST($1 AS numeric) * psi.quantidade::numeric) AS total_consumption,
              ps.stock_quantity::numeric AS current_stock,
              (COALESCE(ps.stock_quantity::numeric, 0) - (CAST($1 AS numeric) * psi.quantidade::numeric)) AS stock_after_consumption
            FROM integration.product_structure_item psi
            LEFT JOIN integration.product_stock ps ON ps.product_omie_id = psi.cod_produto_componente
            WHERE psi.cod_produto_pai = $2
               OR psi.cod_produto_pai = (SELECT product_code FROM read_model.product_catalog_production_ready_read_model WHERE omie_code = $2 LIMIT 1)
            ORDER BY psi.descr_produto_componente`,
                        opQuantity,
                        productOmieId
                    );
                }

                // 3. Se não achou BOM local, buscar OP items do Omie
                const opItems = await prisma.$queryRawUnsafe<
                    Array<{
                        omie_item_code: string;
                        product_mesh_id: string | null;
                        quantity: string | null;
                        use_from_stock: string | null;
                        observation: string | null;
                    }>
                >(
                    `SELECT
            oi.omie_item_code,
            oi.product_mesh_id::text AS product_mesh_id,
            oi.quantity,
            oi.use_from_stock,
            oi.observation
          FROM integration.omie_production_order_item oi
          WHERE oi.omie_production_order_id = (
            SELECT id FROM integration.omie_production_order WHERE omie_id = $1 LIMIT 1
          )`,
                    omieId
                );

                return reply.code(200).send({
                    success: true,
                    data: {
                        order: {
                            omieId: order.omie_id,
                            orderNumber: order.order_number,
                            productOmieId: order.product_omie_id,
                            productName: order.product_name,
                            quantity: order.quantity,
                            forecastDate: order.forecast_date,
                            startDate: order.start_date,
                            completionDate: order.completion_date,
                            stage: order.stage,
                            completed: order.completed,
                            active: order.active,
                            lastSyncAt: order.last_sync_at,
                        },
                        bom: bomItems.map((item) => ({
                            componentCode: item.component_code,
                            componentName: item.component_name,
                            unit: item.unit,
                            quantityPerUnit: item.quantity_per_unit,
                            lossPercent: item.loss_percent,
                            totalConsumption: item.total_consumption,
                            currentStock: item.current_stock,
                            stockAfterConsumption: item.stock_after_consumption,
                        })),
                        opItems: opItems.map((item) => ({
                            omieItemCode: item.omie_item_code,
                            productMeshId: item.product_mesh_id,
                            quantity: item.quantity,
                            useFromStock: item.use_from_stock,
                            observation: item.observation,
                        })),
                    },
                });
            } catch (error) {
                console.error("[OP][WITH-BOM][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
