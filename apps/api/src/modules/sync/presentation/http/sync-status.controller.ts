import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { GetSyncStatusUseCase } from "../../application/use-cases/get-sync-status.usecase";
import { SyncStatusRequestSchema, SyncStatusResponseSchema } from "../../application/dtos/sync-status.dto";

export interface SyncStatusControllerDependencies {
  getSyncStatusUseCase: GetSyncStatusUseCase;
}

export class SyncStatusController {
  constructor(private readonly dependencies: SyncStatusControllerDependencies) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { getSyncStatusUseCase } = this.dependencies;

    try {
      // Validar query params com Zod
      const validatedRequest = SyncStatusRequestSchema.parse(request.query);

      // Executar use case
      const result = await getSyncStatusUseCase.execute(validatedRequest);

      // Validar response com Zod
      const validatedResponse = SyncStatusResponseSchema.parse(result);

      // Retornar response
      return reply.status(result.success ? 200 : 400).send(validatedResponse);
    } catch (error) {
      // Erro de validação Zod
      if (error instanceof Error && error.name === "ZodError") {
        return reply.status(400).send({
          success: false,
          message: "Erro de validação dos parâmetros",
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

export function createSyncStatusController(dependencies: SyncStatusControllerDependencies): SyncStatusController {
  return new SyncStatusController(dependencies);
}

export function registerSyncStatusRoutes(
  app: FastifyInstance,
  controller: SyncStatusController
) {
  app.get("/api/sync/status", async (request, reply) => {
    return controller.handle(request, reply);
  });

  app.get("/api/sync/status/schema", async () => {
    return {
      request: SyncStatusRequestSchema,
      response: SyncStatusResponseSchema,
    };
  });
}