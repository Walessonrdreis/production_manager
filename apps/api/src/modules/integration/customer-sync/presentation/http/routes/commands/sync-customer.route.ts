import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { OmieCustomerStore, CustomerCommandStore } from "../../../../infrastructure/db";
import { fakeOmieCustomerStore, fakeCustomerCommandStore } from "../../../../infrastructure/db/fake-stores.singletons";
import { SyncCustomerUseCase } from "../../../../application/use-cases/sync-customer.usecase";
import type { IntegrationStoreContract, CommandStoreContract } from "../../../../application/use-cases/sync-customer.usecase";

import { FakeCustomerFetchGateway } from "../../../../infrastructure/gateways/customer-fetch/fake-customer-fetch.gateway";
import { RealCustomerFetchGateway } from "../../../../infrastructure/gateways/customer-fetch/real-customer-fetch.gateway";

import type {
    SyncCustomerRequestDTO,
    SyncCustomerResponseDTO,
} from "../../../../application/dto/sync-customer.dto";

export async function registerSyncCustomerRoute(app: FastifyInstance) {
    app.post("/v1/integration/customer-sync/commands/sync", async (request, reply) => {
        const { externalRequestId, customerCode } = request.body as SyncCustomerRequestDTO;

        const omieClient = (app as any).omieClient as OmieHttpClientPort;

        const useFake = env.CUSTOMER_SYNC_GATEWAY === "fake";

        const fetchGateway = useFake
            ? new FakeCustomerFetchGateway()
            : new RealCustomerFetchGateway(omieClient);

        const integrationStore: IntegrationStoreContract = useFake
            ? fakeOmieCustomerStore
            : new OmieCustomerStore();
        const commandStore: CommandStoreContract = useFake
            ? fakeCustomerCommandStore
            : new CustomerCommandStore();

        const useCase = new SyncCustomerUseCase(
            fetchGateway,
            integrationStore,
            commandStore,
        );

        const result = await useCase.execute({
            externalRequestId,
            customerCode,
            source: "API2",
        });

        const response: SyncCustomerResponseDTO = {
            status: "ACCEPTED",
            externalRequestId: result.externalRequestId,
            customerCode: result.customerCode,
        };

        return reply.code(202).send({
            success: true,
            data: response,
        });
    });
}
