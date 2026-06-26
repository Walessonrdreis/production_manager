// ---------------------------------------------------------------------------
// Real Gateway — Product Update (Omie API)
// ---------------------------------------------------------------------------
// Altera um produto no Omie via chamada AlterarProduto.
// ---------------------------------------------------------------------------

import type { ProductUpdateGateway, UpdateProductCommand } from "../../../application/ports/product-update.gateway";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import {
    isOmieErrorResponse,
    isOmieHttpErrorWithSample,
    mapHttpErrorToOmieError,
    isRedundantFault,
} from "@/shared/integration/strategies/omie-error.mapper";
import { buildUpdateProductPayload } from "../../../application/mappers/map-product-to-omie-payload";
import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";

const logger = getLogger("RealProductUpdateGateway");

export class RealProductUpdateGateway implements ProductUpdateGateway {
    constructor(private readonly omieClient: OmieHttpClientPort) { }

    async update(
        command: UpdateProductCommand
    ): Promise<{
        externalRequestId: string;
        productCode: string;
        status: "ACCEPTED" | "CONFIRMED" | "FAILED";
    }> {
        if (!this.omieClient) {
            throw new Error("OMIE_CLIENT_NOT_CONFIGURED");
        }

        logger.info("Updating product in Omie", {
            externalRequestId: command.externalRequestId,
            productCode: command.productCode,
        });

        const payload = buildUpdateProductPayload(command);

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
                        logger.error("Omie HTTP error on update", { code, message: mapped.message });
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
                logger.error("Omie semantic error on update", { faultstring });
                return {
                    externalRequestId: command.externalRequestId,
                    productCode: command.productCode,
                    status: "FAILED",
                };
            }

            // Atualiza o espelho local (OmieProduct)
            const updateData: Record<string, unknown> = {};
            if (command.description !== undefined) updateData.description = command.description;
            if (command.sku !== undefined) updateData.sku = command.sku;
            if (command.familyDescription !== undefined) updateData.familyDescription = command.familyDescription;
            if (command.brand !== undefined) updateData.brand = command.brand;
            if (command.unit !== undefined) updateData.unit = command.unit;
            if (command.ncm !== undefined) updateData.ncm = command.ncm;
            updateData.rawPayload = response as Record<string, unknown>;

            await prisma.omieProduct.updateMany({
                where: {
                    OR: [
                        { omieCode: command.productCode },
                        { omieId: command.productCode },
                    ],
                },
                data: updateData as any,
            });

            return {
                externalRequestId: command.externalRequestId,
                productCode: command.productCode,
                status: "CONFIRMED",
            };
        } catch (error: any) {
            logger.error("Unexpected error on product update", {
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
