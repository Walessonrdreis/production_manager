// ---------------------------------------------------------------------------
// Real Gateway — Product Creation (Omie API)
// ---------------------------------------------------------------------------
// Cria um produto no Omie via chamada IncluirProduto.
// Inclui idempotência, mapeamento de erro Omie e persistência do espelho.
// ---------------------------------------------------------------------------

import type { ProductCreationGateway, CreateProductCommand } from "../../../application/ports/product-creation.gateway";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import {
    isOmieErrorResponse,
    isOmieHttpErrorWithSample,
    mapHttpErrorToOmieError,
    isRedundantFault,
} from "@/shared/integration/strategies/omie-error.mapper";
import { buildCreateProductPayload } from "../../../application/mappers/map-product-to-omie-payload";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";

const logger = getLogger("RealProductCreationGateway");

export class RealProductCreationGateway implements ProductCreationGateway {
    constructor(private readonly omieClient: OmieHttpClientPort) { }

    async create(
        command: CreateProductCommand
    ): Promise<{
        externalRequestId: string;
        productCode: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }> {
        if (!this.omieClient) {
            throw new Error("OMIE_CLIENT_NOT_CONFIGURED");
        }

        logger.info("Creating product in Omie", {
            externalRequestId: command.externalRequestId,
        });

        const payload = buildCreateProductPayload(command);

        try {
            let apiResponse;
            try {
                apiResponse = await this.omieClient.post<any>(
                    "/api/v1/geral/produtos/",
                    payload
                );
            } catch (error: unknown) {
                if (isOmieHttpErrorWithSample(error)) {
                    const mapped = mapHttpErrorToOmieError(error);
                    if (mapped) {
                        const code = isRedundantFault(mapped.message) ? "OMIE_REDUNDANT" : "OMIE_FAULT";
                        logger.error("Omie HTTP error on create", { code, message: mapped.message });
                        return {
                            externalRequestId: command.externalRequestId,
                            productCode: "",
                            status: "FAILED",
                        };
                    }
                }
                throw error;
            }

            const response =
                apiResponse && typeof apiResponse === "object" && "data" in apiResponse
                    ? (apiResponse as any).data
                    : apiResponse;

            if (isOmieErrorResponse(response)) {
                const faultstring = String(response?.faultstring || "Unknown error");
                logger.error("Omie semantic error on create", { faultstring });
                return {
                    externalRequestId: command.externalRequestId,
                    productCode: "",
                    status: "FAILED",
                };
            }

            const productCode = String(response?.codigo_produto || "");

            // Atualiza o espelho local (OmieProduct)
            if (productCode) {
                await prisma.omieProduct.upsert({
                    where: { omieCode: productCode },
                    create: {
                        omieCode: productCode,
                        description: command.description,
                        sku: command.sku ?? null,
                        familyDescription: command.familyDescription ?? null,
                        active: true,
                        rawPayload: response as Record<string, unknown>,
                    },
                    update: {
                        description: command.description,
                        sku: command.sku ?? null,
                        familyDescription: command.familyDescription ?? null,
                        active: true,
                        rawPayload: response as Record<string, unknown>,
                    },
                });
            }

            return {
                externalRequestId: command.externalRequestId,
                productCode,
                status: "CONFIRMED",
            };
        } catch (error: any) {
            logger.error("Unexpected error on product creation", {
                message: error?.message,
            });
            return {
                externalRequestId: command.externalRequestId,
                productCode: "",
                status: "FAILED",
            };
        }
    }
}
