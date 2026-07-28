import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { GetCustomerSummaryUseCase } from "../../../../application/use-cases/get-customer-summary.usecase";
import { mapOmieCustomerToSummary } from "../../../../application/mappers/map-omie-customer-to-summary";
import { fakeOmieCustomerStore } from "../../../../infrastructure/db/fake-stores.singletons";

export async function registerGetCustomerSummaryRoute(
    app: FastifyInstance
) {
    app.get("/v1/integration/customer-sync/read/summary", async (_request, reply) => {
        if (env.CUSTOMER_SYNC_GATEWAY === "fake") {
            const result = await fakeOmieCustomerStore.list({ activeOnly: true });
            const data = result.data.map((r) =>
                mapOmieCustomerToSummary({
                    omieCode: r.omieCode,
                    legalName: r.legalName,
                    tradeName: r.tradeName,
                    document: r.document,
                    personType: r.personType,
                    email: r.email,
                    phone: r.phone,
                    isActive: r.isActive,
                    isBlocked: r.isBlocked,
                    lastSyncAt: r.lastSyncAt,
                    rawPayload: null,
                }),
            );
            return reply.send({ success: true, data });
        }

        const useCase = new GetCustomerSummaryUseCase();
        const data = await useCase.execute();
        return reply.send({ success: true, data });
    });
}
