// ---------------------------------------------------------------------------
// Route — Change Production Order Stage (Command)
// ---------------------------------------------------------------------------
// Enfileira o comando CHANGE_STAGE no CommandStore (PENDING) e retorna 202.
// O Queue Processor job executa contra o Omie depois.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { ChangeProductionOrderStageRequestSchema } from "../../schemas";

import { prisma } from "@/shared/db/prisma";
import { ProductionOrderCommandStore } from "../../../../infrastructure/db/production-order-command.store";

export async function registerChangeProductionOrderStageRoute(app: FastifyInstance) {
  app.post("/v1/integration/production-order/commands/change-stage", async (request, reply) => {
    try {
      const validatedData = ChangeProductionOrderStageRequestSchema.parse(request.body);

      const commandStore = new ProductionOrderCommandStore(prisma);

      const { record, created } = await commandStore.enqueue({
        externalRequestId: validatedData.externalRequestId,
        commandType: "CHANGE_STAGE",
        source: "API2",
        payload: {
          omieCode: validatedData.omieCode,
          stage: validatedData.stage,
        },
      });

      return reply.code(202).send({
        success: true,
        data: {
          externalRequestId: record.externalRequestId,
          status: created ? "PENDING" : record.status,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Invalid request payload",
        });
      }

      console.error("[OP][CHANGE_STAGE][ERROR]", error);

      return reply.code(500).send({
        success: false,
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      });
    }
  });
}
