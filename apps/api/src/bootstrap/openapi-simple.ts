import type { FastifyInstance } from "fastify";

export function registerOpenAPIDocumentation(app: FastifyInstance) {
  app.get(
    "/docs",
    {
      schema: {
        hide: true,
      },
    },
    async (_request, reply) => {
      const documentation = `
# Production Manager API

## Rotas principais

### Read-models
- GET /v1/admin/read/products/production-readiness

### Comandos de integração
- POST /v1/integration/product-structure/:productCode/sync
- POST /v1/integration/product-structure/:productCode/apply
- POST /v1/integration/product-structure/:productCode/delete
`;

      reply.header("content-type", "text/markdown; charset=utf-8");
      return reply.send(documentation);
    }
  );
}