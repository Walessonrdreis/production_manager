// ---------------------------------------------------------------------------
// Gateway — Real Production Order Consult (Omie)
// ---------------------------------------------------------------------------
// Chama ConsultarOrdemProducao via OmieClientWithCircuitBreaker, parseia
// a resposta com mapProductionOrder e retorna os dados frescos.
// ---------------------------------------------------------------------------

import { env } from "@/config";
import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import { OMIE_ENDPOINTS } from "@/shared/integrations/omie/omie.constants";
import { mapProductionOrder } from "@/shared/integrations/omie/OmieProductionOrdersAdapter";
import {
    isOmieErrorResponse,
    isOmieHttpErrorWithSample,
    mapHttpErrorToOmieError,
} from "@/shared/integration/strategies/omie-error.mapper";
import type { ProductionOrderConsultGateway, ProductionOrderConsultResult } from "../../../application/ports/production-order-consult.gateway";

export class RealProductionOrderConsultGateway
    implements ProductionOrderConsultGateway {
    constructor(private readonly omieClient: OmieClientWithCircuitBreaker) { }

    async consult(omieId: string): Promise<ProductionOrderConsultResult | null> {
        if (!this.omieClient) {
            throw new Error("OMIE_CLIENT_NOT_CONFIGURED");
        }

        const payload = {
            call: OMIE_ENDPOINTS.PRODUCTION_ORDER_CONSULT.call,
            app_key: env.OMIE_APP_KEY,
            app_secret: env.OMIE_APP_SECRET,
            param: [{ nCodOP: Number(omieId) }],
        };

        let apiResponse;
        try {
            apiResponse = await this.omieClient.post<any>(
                `/api/v1/${OMIE_ENDPOINTS.PRODUCTION_ORDER_CONSULT.path}`,
                payload
            );
        } catch (error: unknown) {
            // 🔥 Mapear OMIE_HTTP_ERROR com sample JSON para erros Omie
            if (isOmieHttpErrorWithSample(error)) {
                const mapped = mapHttpErrorToOmieError(error);
                if (mapped) {
                    console.error("[OP][CONSULT][OMIE_ERROR]", mapped.message, mapped.details);
                    return null;
                }
            }
            console.error("[OP][CONSULT][NETWORK_ERROR]", error);
            return null;
        }

        const response =
            apiResponse && typeof apiResponse === "object" && "data" in apiResponse
                ? (apiResponse as any).data
                : apiResponse;

        // 🔥 Verificar erro semântico na resposta (faultstring / status = "error")
        if (isOmieErrorResponse(response)) {
            const faultstring = String((response as any).faultstring ?? (response as any).error ?? "");
            console.error("[OP][CONSULT][OMIE_FAULT]", faultstring);
            return null;
        }

        // A resposta do ConsultarOrdemProducao retorna a OP dentro de
        // um campo "ordemProducao" (singular), diferente do ListarOrdemProducao
        // que retorna um array "ordemProducao" (plural).
        const ordemProducao = response?.ordemProducao ?? response;
        if (!ordemProducao || !ordemProducao.identificacao) {
            console.warn("[OP][CONSULT] No ordemProducao found for", omieId);
            return null;
        }

        const { order, items } = mapProductionOrder(ordemProducao);

        return {
            omieId: order.omieId,
            internalCode: order.internalCode,
            orderNumber: order.orderNumber,
            productCode: order.productCode,
            productIntegrationCode: order.productIntegrationCode,
            quantity: order.quantity,
            forecastDate: order.forecastDate,
            startDate: order.startDate,
            completionDate: order.completionDate,
            stage: order.stage,
            projectCode: order.projectCode,
            completed: order.completed,
            active: true,
            rawPayload: ordemProducao,
            items: items.map((i) => ({
                omieItemCode: i.omieItemCode,
                productMeshId: i.productMeshId ?? null,
                useFromStock: i.useFromStock ?? null,
                quantity: i.quantity ?? null,
                stockLocationCode: i.stockLocationCode ?? null,
                observation: i.observation ?? null,
            })),
        };
    }
}
