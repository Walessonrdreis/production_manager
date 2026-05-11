import type { FastifyRequest, FastifyReply } from "fastify";
import type { SalesToProductionUseCase } from "../application/use-cases/sales-to-production.usecase";
import type { IntegrationStatisticsUseCase } from "../application/use-cases/integration-statistics.usecase";
import type { SalesToProductionRequest } from "../application/dtos/sales-production-integration.dto";

export class SalesProductionIntegrationController {
  constructor(
    private readonly salesToProductionUseCase: SalesToProductionUseCase,
    private readonly integrationStatisticsUseCase: IntegrationStatisticsUseCase
  ) {}

  async salesToProduction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as SalesToProductionRequest;
      
      const result = await this.salesToProductionUseCase.execute(body);
      
      if (result.success) {
        return reply.code(200).send({
          success: true,
          data: result.data,
          message: result.message,
        });
      } else {
        return reply.code(400).send({
          success: false,
          error: result.message,
          data: result.data,
        });
      }
      
    } catch (error: any) {
      request.log.error("Erro na integração vendas→produção:", error);
      
      return reply.code(500).send({
        success: false,
        error: "Erro interno na integração vendas→produção",
        details: error.message,
      });
    }
  }

  async integrationStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.integrationStatisticsUseCase.execute();
      
      return reply.code(200).send({
        success: true,
        data: result.data,
        message: result.message,
      });
      
    } catch (error: any) {
      request.log.error("Erro ao calcular estatísticas de integração:", error);
      
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao calcular estatísticas de integração",
        details: error.message,
      });
    }
  }
}