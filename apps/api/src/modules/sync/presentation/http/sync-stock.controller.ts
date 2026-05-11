import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { SyncStockUseCase } from "../../application/use-cases/sync-stock.usecase";
import { SyncStockRequestSchema, SyncStockResponseSchema } from "../../application/dtos/sync-stock.dto";

export interface SyncStockControllerDependencies {
  syncStockUseCase: SyncStockUseCase;
}

export class SyncStockController {
  constructor(private readonly dependencies: SyncStockControllerDependencies) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { syncStockUseCase } = this.dependencies;

    try {
      // Validar request com Zod
      const validatedRequest = SyncStockRequestSchema.parse(request.body);

      // Executar use case
      const result = await syncStockUseCase.execute(validatedRequest);

      // Validar response com Zod
      const validatedResponse = SyncStockResponseSchema.parse(result);

      // Retornar response
      return reply.status(result.success ? 200 : 400).send(validatedResponse);
    } catch (error) {
      // Erro de validação Zod
      if (error && typeof error === 'object' && 'errors' in error) {
        return reply.status(400).send({
          success: false,
          message: "Erro de validação dos dados",
          errors: (error as any).errors,
          timestamp: new Date().toISOString(),
        });
      }

      // Erro genérico
      return reply.status(500).send({
        success: false,
        message: "Erro interno do servidor",
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export function createSyncStockController(dependencies: SyncStockControllerDependencies): SyncStockController {
  return new SyncStockController(dependencies);
}

export function registerSyncStockRoutes(
  app: FastifyInstance,
  controller: SyncStockController
) {
  app.post("/api/sync/stock", async (request, reply) => {
    return controller.handle(request, reply);
  });

  app.get("/api/sync/stock/schema", async () => {
    return {
      request: SyncStockRequestSchema,
      response: SyncStockResponseSchema,
    };
  });
}