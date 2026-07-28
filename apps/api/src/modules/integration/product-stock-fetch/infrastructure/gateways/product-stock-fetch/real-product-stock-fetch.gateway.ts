// ---------------------------------------------------------------------------
// Real Gateway: RealProductStockFetchGateway
// Consulta a posição de estoque no Omie via API de estoque/consulta.
// ---------------------------------------------------------------------------

import { env } from "@/config";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type { ProductStockFetchGateway, ProductStockFetchResult } from "../../../application/ports/product-stock-fetch.gateway";
import {
    extractQuantity,
    extractProductCode,
    extractStockLocationCode,
} from "../../../application/mappers/map-omie-stock-to-domain";
import {
    isOmieErrorResponse,
    isOmieHttpErrorWithSample,
    mapHttpErrorToOmieError,
} from "@/shared/integration/strategies/omie-error.mapper";

/**
 * Data de hoje no formato DD/MM/YYYY (comum em filtros do Omie).
 */
function getTodayBr(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
}

export class RealProductStockFetchGateway implements ProductStockFetchGateway {
    constructor(private readonly omieClient: OmieHttpClientPort) { }

    async fetch(productId: string): Promise<ProductStockFetchResult> {
        const positionDate = getTodayBr();
        const allItems: any[] = [];
        let page = 1;
        const maxPagesSafety = 50;

        while (page <= maxPagesSafety) {
            const payload = {
                call: "ListarPosEstoque",
                app_key: env.OMIE_APP_KEY,
                app_secret: env.OMIE_APP_SECRET,
                param: [
                    {
                        nPagina: page,
                        nRegPorPagina: 200,
                        dDataPosicao: positionDate,
                        cExibeTodos: "S",
                        codigo_local_estoque: 0,
                    },
                ],
            };

            let response: any;

            try {
                const apiResponse = await this.omieClient.post<any>(
                    "/api/v1/estoque/consulta/",
                    payload,
                );

                response =
                    apiResponse && typeof apiResponse === "object" && "data" in apiResponse
                        ? (apiResponse as any).data
                        : apiResponse;
            } catch (httpError) {
                if (isOmieHttpErrorWithSample(httpError)) {
                    throw mapHttpErrorToOmieError(httpError);
                }
                throw httpError;
            }

            if (isOmieErrorResponse(response)) {
                throw new Error(
                    response?.faultstring || response?.error || "Omie stock API error",
                );
            }

            const items =
                (Array.isArray(response?.produtos) && response.produtos) ||
                (Array.isArray(response?.estoques) && response.estoques) ||
                (Array.isArray(response?.itens) && response.itens) ||
                [];

            allItems.push(...items);

            const totalPages =
                Number(response?.total_de_paginas) ||
                Number(response?.nTotPaginas) ||
                Number(response?.totalPaginas) ||
                1;

            if (page >= totalPages) break;
            if (items.length === 0) break;

            page += 1;
        }

        // Filtra o produto de forma defensiva
        const matching = allItems.filter((it) => {
            const candidate = extractProductCode(it);
            return candidate !== null && candidate === String(productId);
        });

        const breakdown = matching.map((it) => ({
            stockLocationCode: extractStockLocationCode(it),
            quantity: extractQuantity(it),
        }));

        const total = breakdown.reduce((sum, r) => sum + r.quantity, 0);

        return {
            productId,
            positionDate,
            total,
            breakdown,
        };
    }
}
