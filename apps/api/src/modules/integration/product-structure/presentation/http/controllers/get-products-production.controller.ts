// apps/api/src/modules/integration/product-structure/presentation/http/controllers/get-products-production.controller.ts

import { FastifyRequest, FastifyReply } from "fastify";
import { GetProductsProductionReadModelUseCase } from "../../../application/use-cases/get-products-production-read-model.usecase";

export class GetProductsProductionController {
  constructor(
    private readonly useCase: GetProductsProductionReadModelUseCase
  ) {}

  async handle(_request: FastifyRequest, reply: FastifyReply) {
    const data = await this.useCase.execute();
    return reply.send({ success: true, data });
  }
}
``