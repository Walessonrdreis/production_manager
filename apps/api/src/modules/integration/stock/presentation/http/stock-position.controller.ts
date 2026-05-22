import type { FastifyReply, FastifyRequest } from "fastify";
import { GetStockPositionUseCase } from "../../application/get-stock-position.usecase";
import { getOmieClient } from "@/shared/integrations/omie/get-omie-client"; // (LOCALIZAR) use o helper real do projeto

export async function getStockPositionController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const body: any = (req as any).body || {};
    const productId = body.productId?.toString();
    const positionDateISO = body.positionDateISO?.toString();

    if (!productId) {
      return reply.status(400).send({
        success: false,
        error: "INVALID_PAYLOAD",
        message: "productId is required"
      });
    }

    const usecase = GetStockPositionUseCase.build(getOmieClient());
    const result = await usecase.execute({ productId, positionDateISO });

    return reply.status(200).send(result);
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: "INTERNAL_ERROR",
      message: error?.message || "Unexpected error"
    });
  }
}