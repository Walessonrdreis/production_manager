import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import {
    SalesOrderSummaryReadModelStore,
    type SalesOrderSummaryRecord,
} from "../../infrastructure/db/sales-order-summary-read-model.store";

export class RefreshSalesOrderSummaryReadModelUseCase {
    private readonly logger = getLogger(
        "RefreshSalesOrderSummaryReadModelUseCase"
    );

    constructor(
        private readonly readModelStore: SalesOrderSummaryReadModelStore
    ) { }

    async execute() {
        this.logger.info("Starting sales-order summary read-model refresh");

        const orders = await prisma.salesOrder.findMany({
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
        });

        this.logger.info("Sales orders loaded for read-model", {
            totalOrders: orders.length,
        });

        const records: SalesOrderSummaryRecord[] = orders.map((order) => {
            const totalItems = order.items.length;
            const totalQuantity = order.items.reduce(
                (sum, item) => sum + Number(item.quantity ?? 0),
                0
            );

            return {
                omieId: order.omieId,
                orderNumber: order.orderNumber,
                stage: order.stage,
                isCanceled: order.isCanceled,
                isClosed: order.isClosed,
                customerOmieId: order.customerOmieId,
                companyOmieId: order.companyOmieId,
                forecastDate: order.forecastDate,
                totalAmount: order.totalAmount ? Number(order.totalAmount) : null,
                totalItems,
                totalQuantity,
                lastSyncAt: order.lastSyncAt,
            };
        });

        await this.readModelStore.replaceAll(records);

        this.logger.info("Sales-order summary read-model refresh completed", {
            records: records.length,
        });

        return {
            ok: true,
            refreshedRecords: records.length,
        };
    }
}
