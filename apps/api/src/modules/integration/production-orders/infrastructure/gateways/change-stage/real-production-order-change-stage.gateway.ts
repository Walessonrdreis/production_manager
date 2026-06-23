import { env } from "@/config";
import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";
import { productionOrderIntegrationStore, type IntegrationStatus } from "../../db/production-order-integration.store";
import type { ProductionOrderChangeStageGateway, ChangeProductionOrderStageCommand } from "./production-order-change-stage.gateway";

export class RealProductionOrderChangeStageGateway implements ProductionOrderChangeStageGateway {
  constructor(private readonly omieClient: OmieClientWithCircuitBreaker) {}

  async changeStage(
    command: ChangeProductionOrderStageCommand
  ): Promise<{ externalRequestId: string; status: IntegrationStatus }> {
    if (!this.omieClient) {
      throw new Error("OMIE_CLIENT_NOT_CONFIGURED");
    }

    const existing = await productionOrderIntegrationStore.getByExternalRequestId(
      command.externalRequestId
    );

    if (existing) {
      return { externalRequestId: existing.externalRequestId, status: existing.status };
    }

    await productionOrderIntegrationStore.upsertAccepted({
      externalRequestId: command.externalRequestId,
      productId: "",
      quantity: 0,
    });

    const payload = {
      call: "AlterarEtapaOrdemProducao",
      app_key: env.OMIE_APP_KEY,
      app_secret: env.OMIE_APP_SECRET,
      param: [
        {
          nCodigoOP: Number(command.omieCode),
          cEtapa: command.stage,
        },
      ],
    };

    try {
      const apiResponse = await this.omieClient.post<any>("/api/v1/produtos/op/", payload);
      const response = apiResponse && typeof apiResponse === "object" && "data" in apiResponse
        ? (apiResponse as any).data
        : apiResponse;

      if (response?.faultstring || response?.error || (response?.codigo_status && response.codigo_status !== "0")) {
        const message = String(response?.faultstring || response?.error || "Unknown error");
        await productionOrderIntegrationStore.markFailed(command.externalRequestId, { code: "OMIE_ERROR", message });
        return { externalRequestId: command.externalRequestId, status: "FAILED" };
      }

      return { externalRequestId: command.externalRequestId, status: "ACCEPTED" };
    } catch (error: any) {
      const message = error?.message ?? "Omie unknown error";
      await productionOrderIntegrationStore.markFailed(command.externalRequestId, { code: "OMIE_EXCEPTION", message });
      return { externalRequestId: command.externalRequestId, status: "FAILED" };
    }
  }
}
