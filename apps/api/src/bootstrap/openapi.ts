import type { FastifyInstance } from "fastify";

export async function registerOpenAPISwagger(app: FastifyInstance) {
  await app.register(import("@fastify/swagger"), {
    openapi: {
      info: {
        title: "Production Manager API",
        version: "1.0.0",
        description: "API Core do Production Manager",
      },
      
    },
  });

  await app.register(import("@fastify/swagger-ui"), {
    routePrefix: "/swagger",
  });
}