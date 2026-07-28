import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import {
    SalesOrderSummaryReadModelStore,
    type SalesOrderSummaryRecord,
} from "../../infrastructure/db/sales-order-summary-read-model.store";
import {
    SalesOrderStageTransitionStore,
    type CreateStageTransitionInput,
} from "../../infrastructure/db/sales-order-stage-transition.store";

export class RefreshSalesOrderSummaryReadModelUseCase {
    private readonly logger = getLogger(
        "RefreshSalesOrderSummaryReadModelUseCase"
    );

    constructor(
        private readonly readModelStore: SalesOrderSummaryReadModelStore,
        private readonly transitionStore: SalesOrderStageTransitionStore
    ) { }

    async execute() {
        this.logger.info("Starting sales-order summary read-model refresh");

        const [orders, customers, currentStagesMap] = await Promise.all([
            prisma.salesOrder.findMany({
                select: {
                    omieId: true,
                    orderNumber: true,
                    stage: true,
                    isCanceled: true,
                    isClosed: true,
                    customerOmieId: true,
                    companyOmieId: true,
                    forecastDate: true,
                    totalAmount: true,
                    lastSyncAt: true,
                    items: {
                        select: {
                            quantity: true,
                        },
                    },
                },
            }),
            prisma.omieCustomer.findMany({
                select: {
                    omieCode: true,
                    legalName: true,
                    tradeName: true,
                },
            }),
            this.transitionStore.getCurrentStagesMap(),
        ]);

        this.logger.info("Sales orders loaded for read-model", {
            totalOrders: orders.length,
            totalCustomers: customers.length,
            transitionsMapSize: currentStagesMap.size,
        });

        // 🔍 Construir mapa de customer: omieCode → nome (legalName → tradeName → fallback)
        const customerNameMap = new Map<string, string>();
        for (const c of customers) {
            const name = c.legalName || c.tradeName || `Cliente #${c.omieCode}`;
            customerNameMap.set(c.omieCode, name);
        }

        // 📝 Detectar transições de etapa
        const transitions: CreateStageTransitionInput[] = [];

        const records: SalesOrderSummaryRecord[] = orders.map((order) => {
            const totalItems = order.items.length;
            const totalQuantity = order.items.reduce(
                (sum, item) => sum + Number(item.quantity ?? 0),
                0
            );

            // Resolver nome do cliente
            const customerName = order.customerOmieId
                ? customerNameMap.get(order.customerOmieId) ?? null
                : null;

            // Detectar mudança de etapa
            const currentStage = currentStagesMap.get(order.omieId);
            if (currentStage !== undefined && currentStage !== order.stage) {
                transitions.push({
                    salesOrderOmieId: order.omieId,
                    fromStage: currentStage,
                    toStage: order.stage,
                });
            }

            return {
                omieId: order.omieId,
                orderNumber: order.orderNumber,
                stage: order.stage,
                isCanceled: order.isCanceled,
                isClosed: order.isClosed,
                customerOmieId: order.customerOmieId,
                companyOmieId: order.companyOmieId,
                customerName,
                forecastDate: order.forecastDate,
                totalAmount: order.totalAmount ? Number(order.totalAmount) : null,
                totalItems,
                totalQuantity,
                lastSyncAt: order.lastSyncAt,
            };
        });

        // 🔄 Substituir read-model
        await this.readModelStore.replaceAll(records);

        // 📝 Registrar transições detectadas
        if (transitions.length > 0) {
            const created = await this.transitionStore.createTransitions(transitions);
            this.logger.info("Stage transitions recorded", {
                detected: transitions.length,
                created,
            });
        }

        this.logger.info("Sales-order summary read-model refresh completed", {
            records: records.length,
            transitionsDetected: transitions.length,
        });

        return {
            ok: true,
            refreshedRecords: records.length,
            transitionsDetected: transitions.length,
        };
    }
}
