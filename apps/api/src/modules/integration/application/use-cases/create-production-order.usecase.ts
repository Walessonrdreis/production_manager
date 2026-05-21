import type { CreateProductionOrderRequest, CreateProductionOrderResponse } from "../../presentation/http/schemas";

export class CreateProductionOrderUseCase {
  async execute(request: CreateProductionOrderRequest): Promise<CreateProductionOrderResponse> {
    // Mock estruturado - conforme especificado no STEP 2
    // Não integra com Omie, não persiste no banco
    const response: CreateProductionOrderResponse = {
      success: true,
      data: {
        externalRequestId: request.externalRequestId,
        status: "ACCEPTED",
      },
    };

    return response;
  }
}