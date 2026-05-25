// apps/api/src/modules/product-structure/register.ts
import type { FastifyInstance } from "fastify";
import registerProductStructure from ".";

export async function registerProductStructureModule(app: FastifyInstance) {
  await registerProductStructure(app);
}