// ---------------------------------------------------------------------------
// Real Gateway — Product Inactivate (Omie API)
// ---------------------------------------------------------------------------
// Inativa um produto no Omie via AlterarProduto com ativo="N".
// ---------------------------------------------------------------------------

import type { ProductInactivateGateway, InactivateProductCommand } from "../../../application/ports/product-inactivate.gateway";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import {
    isOmieErrorResponse,
    isOmieHttpErrorWithSample,
    mapHttpErrorToOmieError,
    isRedundantFault,
} from "@/shared/integration/strategies/omie-error.mapper";
import { buildInactivateProductPayload } from "../../../application/mappers/map-product-to-omie-payload";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";

const logger = getLogger("RealProductInactivateGateway");

export class RealProductInactivateGateway implements ProductInactivateGateway {
    constructor(private readonly omieClient: OmieHttpClientPort) { }

    async inactivate(
        command: InactivateProductCommand
    ): Promise<{
        externalRequestId: string;
        productCode: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }> {
        if (!this.omieClient) {
            throw new Error("OMIE_CLIENT_NOT_CONFIGURED");
        }

        logger.info("Inactivating product in Omie", {
            externalRequestId: command.externalRequestId,
            productCode: command.productCode,
        });

        const payload = buildInactivateProductPayload(command);

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
                        logger.error("Omie HTTP error on inactivate", { code, message: mapped.message });
                        return {
                            externalRequestId: command.externalRequestId,
                            productCode: command.productCode,
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
                logger.error("Omie semantic error on inactivate", { faultstring });
                return {
                    externalRequestId: command.externalRequestId,
                    productCode: command.productCode,
                    status: "FAILED",
                };
            }

            // Atualiza espelho local
            await prisma.omieProduct.updateMany({
                where: {
                    OR: [
                        { omieCode: command.productCode },
                        { omieId: command.productCode },
                    ],
                },
                data: {
                    active: false,
                    rawPayload: response as Record<string, unknown>,
                },
            });

            return {
                externalRequestId: command.externalRequestId,
                productCode: command.productCode,
                status: "CONFIRMED",
            };
        } catch (error: any) {
            logger.error("Unexpected error on product inactivation", {
                message: error?.message,
            });
            return {
                externalRequestId: command.externalRequestId,
                productCode: command.productCode,
                status: "FAILED",
            };
        }
    }
}
