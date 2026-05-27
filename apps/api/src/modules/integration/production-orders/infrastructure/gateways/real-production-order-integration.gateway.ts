import type { ProductionOrderIntegrationGateway } from "../../application/ports/production-order-integration.gateway";
import type { CreateProductionOrderRequest } from "../../presentation/http/schemas";
import { env } from "@/config";
import type { OmieClientWithCircuitBreaker } from "@/shared/integrations/omie/omie-client-with-circuit-breaker";

import { productionOrderIntegrationStore } from "../db/production-order-integration.store";

export class RealProductionOrderIntegrationGateway
  implements ProductionOrderIntegrationGateway
{
  constructor(
    private readonly omieClient: OmieClientWithCircuitBreaker
  ) {}

  async createProductionOrder(
    command: CreateProductionOrderRequest
  ): Promise<{
    externalRequestId: string;
    status: "ACCEPTED";
  }> {
    if (!this.omieClient) {
      throw new Error("OMIE_CLIENT_NOT_CONFIGURED");
    }

    console.log("[OP][REAL][GATEWAY] create", {
      externalRequestId: command.externalRequestId,
    });

    this.validateRequiredFields(command);

    // ✅ registra intenção (tracking)
    productionOrderIntegrationStore.upsertAccepted({
      externalRequestId: command.externalRequestId,
      productId: command.productId,
      quantity: command.quantity,
      scheduledDate: command.scheduledDate,
      notes: command.notes,
      omieProductionOrderId: undefined,
      lastError: undefined,
    });

    const payload = {
      call: "IncluirOrdemProducao",
      app_key: env.OMIE_APP_KEY,
      app_secret: env.OMIE_APP_SECRET,
      param: [
        {
          identificacao: {
            cCodIntOP: command.externalRequestId,
            dDtPrevisao: command.scheduledDate
              ? this.formatDate(command.scheduledDate)
              : this.getCurrentDate(),
            nCodProduto: Number(command.productId),
            nQtde: command.quantity,
          },
        },
      ],
    };

    try {
      const apiResponse = await this.omieClient.post<any>(
        "/api/v1/produtos/op/",
        payload
      );

      const response =
        apiResponse &&
        typeof apiResponse === "object" &&
        "data" in apiResponse
          ? (apiResponse as any).data
          : apiResponse;

      if (
        response?.faultstring ||
        response?.error ||
        (response?.codigo_status && response.codigo_status !== "0")
      ) {
        const message = String(
          response?.faultstring || response?.error || "Unknown error"
        );

        productionOrderIntegrationStore.markFailed(
          command.externalRequestId,
          {
            code: "OMIE_ERROR",
            message,
          }
        );

        throw new Error(message);
      }

      return {
        externalRequestId: command.externalRequestId,
        status: "ACCEPTED",
      };
    } catch (error: any) {
      const message =
        error?.message ?? "Omie unknown error";

      productionOrderIntegrationStore.markFailed(
        command.externalRequestId,
        {
          code: "OMIE_EXCEPTION",
          message,
        }
      );

      throw new Error(message);
    }
  }

  private formatDate(date: string): string {
    const parsedDate = new Date(date);
    const day = String(parsedDate.getDate()).padStart(2, "0");
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private getCurrentDate(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private validateRequiredFields(
    command: CreateProductionOrderRequest
  ): void {
    const missingFields: string[] = [];

    if (!command.productId || command.productId.trim() === "") {
      missingFields.push("productId");
    }

    if (!command.quantity || command.quantity <= 0) {
      missingFields.push("quantity");
    }

    if (
      !command.externalRequestId ||
      command.externalRequestId.trim() === ""
    ) {
      missingFields.push("externalRequestId");
    }

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required fields: ${missingFields.join(", ")}`
      );
    }
  }
}