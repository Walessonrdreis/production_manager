import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { SyncOrdersUseCase } from "../../application/use-cases/sync-orders.usecase";
import { SyncOrdersRequestSchema, SyncOrdersResponseSchema } from "../../application/dtos/sync-orders.dto";

export interface SyncOrdersControllerDependencies {
  syncOrdersUseCase: SyncOrdersUseCase;
}

export class SyncOrdersController {
  constructor(private readonly dependencies: SyncOrdersControllerDependencies) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { syncOrdersUseCase } = this.dependencies;

    try {
      // Validar request com Zod
      const validatedRequest = SyncOrdersRequestSchema.parse(request.body);

      // Executar use case
      const result = await syncOrdersUseCase.execute(validatedRequest);

      // Validar response com Zod
      const validatedResponse = SyncOrdersResponseSchema.parse(result);

      // Retornar response
      return reply.status(result.success ? 200 : 400).send(validatedResponse);
    } catch (error) {
      // Erro de validação Zod
      if (error instanceof Error && error.name === "ZodError") {
        return reply.status(400).send({
          success: false,
          message: "Erro de validação dos dados",
          errors: error.errors,
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

export function createSyncOrdersController(dependencies: SyncOrdersControllerDependencies): SyncOrdersController {
  return new SyncOrdersController(dependencies);
}

export function registerSyncOrdersRoutes(
  app: FastifyInstance,
  controller: SyncOrdersController
) {
  app.post("/api/sync/orders", async (request, reply) => {
    return controller.handle(request, reply);
  });

  app.get("/api/sync/orders/schema", async () => {
    return {
      request: SyncOrdersRequestSchema,
      response: SyncOrdersResponseSchema,
    };
  });
}