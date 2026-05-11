import { FastifyReply, FastifyRequest } from "fastify";
import { ListStockAlertsUseCase } from "../../application/use-cases/list-stock-alerts.usecase";
import { ConfigureAlertsUseCase } from "../../application/use-cases/configure-alerts.usecase";
import { UpdateAlertStatusUseCase } from "../../application/use-cases/update-alert-status.usecase";
import {
  StockAlertsRequest,
  StockAlertsRequestSchema,
  StockAlertsResponse,
  AlertConfigRequest,
  AlertConfigRequestSchema,
  AlertConfigResponse,
  AlertStatusRequest,
  AlertStatusRequestSchema,
  AlertStatusResponse,
} from "../../application/dtos/stock-alerts.dto";

export class StockAlertsController {
  constructor(
    private readonly listStockAlertsUseCase: ListStockAlertsUseCase,
    private readonly configureAlertsUseCase: ConfigureAlertsUseCase,
    private readonly updateAlertStatusUseCase: UpdateAlertStatusUseCase
  ) {}

  async listStockAlerts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as StockAlertsRequest;
      const validatedQuery = StockAlertsRequestSchema.parse(query);
      
      const result = await this.listStockAlertsUseCase.execute(validatedQuery);
      
      return reply.code(200).send({
        success: true,
        data: result,
        message: "Alertas de estoque recuperados com sucesso",
      });
    } catch (error) {
      request.log.error("Erro ao listar alertas de estoque:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Parâmetros de consulta inválidos",
          details: error.message,
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicitação",
      });
    }
  }

  async listCriticalStockAlerts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as StockAlertsRequest;
      const validatedQuery = StockAlertsRequestSchema.parse(query);
      
      const result = await this.listStockAlertsUseCase.execute({
        ...validatedQuery,
        severity: "critical",
        resolved: false,
      });
      
      return reply.code(200).send({
        success: true,
        data: result,
        message: "Alertas críticos de estoque recuperados com sucesso",
      });
    } catch (error) {
      request.log.error("Erro ao listar alertas críticos de estoque:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Parâmetros de consulta inválidos",
          details: error.message,
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicitação",
      });
    }
  }

  async configureAlerts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as AlertConfigRequest;
      const validatedBody = AlertConfigRequestSchema.parse(body);
      
      const result = await this.configureAlertsUseCase.execute(validatedBody);
      
      return reply.code(200).send({
        success: true,
        data: result,
        message: "Configuração de alertas atualizada com sucesso",
      });
    } catch (error) {
      request.log.error("Erro ao configurar alertas:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Dados de configuração inválidos",
          details: error.message,
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicitação",
      });
    }
  }

  async updateAlertStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as AlertStatusRequest;
      const validatedBody = AlertStatusRequestSchema.parse(body);
      
      const result = await this.updateAlertStatusUseCase.execute(id, validatedBody);
      
      return reply.code(200).send({
        success: true,
        data: result,
        message: "Status do alerta atualizado com sucesso",
      });
    } catch (error) {
      request.log.error("Erro ao atualizar status do alerta:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Dados de atualização inválidos",
          details: error.message,
        });
      }
      
      if (error instanceof Error && error.message.includes("não encontrado")) {
        return reply.code(404).send({
          success: false,
          error: "Alerta não encontrado",
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicitação",
      });
    }
  }

  async getAlertStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as StockAlertsRequest;
      const validatedQuery = StockAlertsRequestSchema.parse(query);
      
      const result = await this.listStockAlertsUseCase.execute(validatedQuery);
      
      const statistics = {
        total: result.total,
        critical: result.statistics.critical,
        warning: result.statistics.warning,
        info: result.statistics.info,
        active: result.statistics.active,
        resolved: result.statistics.resolved,
        acknowledged: result.statistics.acknowledged,
      };
      
      return reply.code(200).send({
        success: true,
        data: statistics,
        message: "Estatísticas de alertas recuperadas com sucesso",
      });
    } catch (error) {
      request.log.error("Erro ao obter estatísticas de alertas:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Parâmetros de consulta inválidos",
          details: error.message,
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicitação",
      });
    }
  }
}