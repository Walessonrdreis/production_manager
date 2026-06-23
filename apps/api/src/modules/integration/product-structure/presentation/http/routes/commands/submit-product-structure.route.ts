import type { FastifyInstance } from "fastify";

export function registerSubmitProductStructureRoute(app: FastifyInstance) {
  app.post(
    "/v1/integration/product-structure/commands/submit",
    {
      schema: {
        tags: ["product-structure"],
        summary: "Submeter estrutura (workflow) para aplicação no Omie",
        description:
          "Comando de integração para workflow. No MVP, use /apply (submit será evoluído para rascunhos/aprovação).",
      },
    },
    async (_request, reply) => {
      return reply.status(501).send({
        success: false,
        error: "NOT_IMPLEMENTED",
        message: "Use /apply para aplicar a estrutura no MVP. /submit será habilitado quando houver drafts/aprovação.",
      });
    }
  );
}