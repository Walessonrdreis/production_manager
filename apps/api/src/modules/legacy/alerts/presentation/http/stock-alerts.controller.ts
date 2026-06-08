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
      request.log.error("Erro ao listar alertas de estoque:", error as any);
      
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
      request.log.error("Erro ao listar alertas críticos de estoque:", error as any);
      
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
      request.log.error("Erro ao configurar alertas:", error as any);
      
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
      request.log.error("Erro ao atualizar status do alerta:", error as any);
      
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
        total: (result as any).total,
        critical: (result as any).statistics?.critical || 0,
        warning: (result as any).statistics?.warning || 0,
        info: (result as any).statistics?.info || 0,
        active: (result as any).statistics?.active || 0,
        resolved: (result as any).statistics?.resolved || 0,
        acknowledged: (result as any).statistics?.acknowledged || 0,
      };
      
      return reply.code(200).send({
        success: true,
        data: statistics,
        message: "Estatísticas de alertas recuperadas com sucesso",
      });
    } catch (error) {
      request.log.error("Erro ao obter estatísticas de alertas:", error as any);
      
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