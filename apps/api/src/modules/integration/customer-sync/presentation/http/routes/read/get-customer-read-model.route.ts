import type { FastifyInstance } from "fastify";
import { env } from "@/config";
import { OmieCustomerStore } from "../../../../infrastructure/db";
import { fakeOmieCustomerStore } from "../../../../infrastructure/db/fake-stores.singletons";
import { GetCustomerReadModelUseCase } from "../../../../application/use-cases/get-customer-read-model.usecase";
import { parseBoolean, parseNumber } from "../../../../application/utils/query.utils";

export async function registerGetCustomerReadModelRoute(app: FastifyInstance) {
    const store = env.CUSTOMER_SYNC_GATEWAY === "fake"
        ? fakeOmieCustomerStore
        : new OmieCustomerStore();
    const useCase = new GetCustomerReadModelUseCase(store);

    app.get("/v1/admin/read/customers", async (request, reply) => {
        const query = request.query as Record<string, unknown>;

        const params = {
            view: query.view as "summary" | "data" | undefined,
            q: query.q ? String(query.q) : null,
            activeOnly: parseBoolean(query.activeOnly, false),
            customerCodes: query.customerCodes
                ? String(query.customerCodes).split(",")
                : null,
            document: query.document ? String(query.document) : null,
            limit: parseNumber(query.limit, 50),
            offset: parseNumber(query.offset, 0),
            sort: (query.sort as any) ?? "legalName",
            order: (query.order as any) ?? "asc",
            since: query.since ? String(query.since) : null,
            fields: query.fields
                ? String(query.fields).split(",")
                : null,
            includeRaw: parseBoolean(query.includeRaw, false),
        };

        const result = await useCase.execute(params);

        return reply.send({
            success: true,
            ...result,
        });
    });

    app.get("/v1/admin/read/customers/:customerCode", async (request, reply) => {
        const { customerCode } = request.params as { customerCode: string };
        const query = request.query as Record<string, unknown>;

        const data = await useCase.executeByCustomerCode(customerCode, {
            includeRaw: parseBoolean(query.includeRaw, false),
        });

        if (!data) {
            return reply.code(404).send({
                success: false,
                error: {
                    code: "CUSTOMER_NOT_FOUND",
                    message: "Cliente não encontrado",
                    details: { customerCode },
                },
            });
        }

        return reply.send({
            success: true,
            data,
        });
    });
}
