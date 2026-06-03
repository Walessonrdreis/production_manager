import { FastifyRequest, FastifyReply } from "fastify";
import { GetProductsProductionReadModelUseCase } from "../../../application/use-cases/get-products-production-read-model.usecase";

export class GetProductsProductionSummaryController {
  constructor(
    private readonly useCase: GetProductsProductionReadModelUseCase
  ) {}

  async handle(_request: FastifyRequest, reply: FastifyReply) {
    const result = await this.useCase.execute();
    return reply.send({
      success: true,
      data: result.summary,
    });
  }
}