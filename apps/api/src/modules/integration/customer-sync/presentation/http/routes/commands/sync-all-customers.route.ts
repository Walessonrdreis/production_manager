import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { prisma } from "@/shared/db/prisma";
import { PrismaSyncStateStore } from "@/shared/integration/strategies/sync-state.store";

import type {
    SyncAllCustomersRequestDTO,
    SyncAllCustomersResponseDTO,
} from "../../../../application/dto/sync-all-customers.dto";

import { SyncAllCustomersUseCase } from "../../../../application/use-cases/sync-all-customers.usecase";
import type { IntegrationStoreContract, CommandStoreContract } from "../../../../application/use-cases/sync-all-customers.usecase";
import { OmieCustomerStore, CustomerCommandStore } from "../../../../infrastructure/db";
import { fakeOmieCustomerStore, fakeCustomerCommandStore } from "../../../../infrastructure/db/fake-stores.singletons";

import { FakeCustomerFetchPageGateway } from "../../../../infrastructure/gateways/customer-fetch-page/fake-customer-fetch-page.gateway";
import { RealCustomerFetchPageGateway } from "../../../../infrastructure/gateways/customer-fetch-page/real-customer-fetch-page.gateway";

function buildExternalRequestId() {
    return `customer-sync-global-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const logger = getLogger("sync-all-customers.route");

export async function registerSyncAllCustomersRoute(app: FastifyInstance) {
    app.post("/v1/integration/customer-sync/commands/sync-global", async (request, reply) => {
        const body = (request.body as SyncAllCustomersRequestDTO | undefined) ?? {};

        const externalRequestId =
            body.externalRequestId ?? buildExternalRequestId();

        const omieClient = (app as any).omieClient as OmieHttpClientPort;

        const useFake = env.CUSTOMER_SYNC_GATEWAY === "fake";

        const fetchPageGateway = useFake
            ? new FakeCustomerFetchPageGateway()
            : new RealCustomerFetchPageGateway(omieClient);

        const integrationStore: IntegrationStoreContract = useFake
            ? fakeOmieCustomerStore
            : new OmieCustomerStore();
        const commandStore: CommandStoreContract = useFake
            ? fakeCustomerCommandStore
            : new CustomerCommandStore();
        const stateStore = new PrismaSyncStateStore(prisma.customerSyncState, "global");

        const useCase = new SyncAllCustomersUseCase(
            fetchPageGateway,
            integrationStore,
            commandStore,
            stateStore,
            { noWrite: useFake },
        );

        const result = await useCase.execute({
            externalRequestId,
            pageSize: body.pageSize,
            maxPages: body.maxPages,
            source: "API2",
        });

        const response: SyncAllCustomersResponseDTO = {
            status: "ACCEPTED",
            externalRequestId: result.externalRequestId,
            resourceId: "__GLOBAL__",
        };

        logger.info("Customer sync-global ACCEPTED", {
            externalRequestId,
        });

        return reply.code(202).send({
            success: true,
            data: response,
        });
    });
}
