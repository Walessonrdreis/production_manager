import { FastifyReply, FastifyRequest } from "fastify";
import { AddToQueueUseCase } from "../../application/use-cases/add-to-queue.usecase";
import { ListQueueUseCase } from "../../application/use-cases/list-queue.usecase";
import { UpdateQueueStatusUseCase } from "../../application/use-cases/update-queue-status.usecase";
import { QueueStatisticsUseCase } from "../../application/use-cases/queue-statistics.usecase";
import { ReorderQueueUseCase } from "../../application/use-cases/reorder-queue.usecase";
import {
  AddToQueueRequest,
  AddToQueueRequestSchema,
  AddToQueueResponse,
  ListQueueRequest,
  ListQueueRequestSchema,
  ListQueueResponse,
  UpdateQueueStatusRequest,
  UpdateQueueStatusRequestSchema,
  UpdateQueueStatusResponse,
  QueueStatisticsRequest,
  QueueStatisticsRequestSchema,
  QueueStatisticsResponse,
  ReorderQueueRequest,
  ReorderQueueRequestSchema,
  ReorderQueueResponse,
} from "../../application/dtos/production-queue.dto";

export class ProductionQueueController {
  constructor(
    private readonly addToQueueUseCase: AddToQueueUseCase,
    private readonly listQueueUseCase: ListQueueUseCase,
    private readonly updateQueueStatusUseCase: UpdateQueueStatusUseCase,
    private readonly queueStatisticsUseCase: QueueStatisticsUseCase,
    private readonly reorderQueueUseCase: ReorderQueueUseCase
  ) {}

  async addToQueue(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as AddToQueueRequest;
      const validatedBody = AddToQueueRequestSchema.parse(body);
      
      const result = await this.addToQueueUseCase.execute(validatedBody);
      
      return reply.code(200).send({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      request.log.error("Erro ao adicionar ordem à fila:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Dados da requisição inválidos",
          details: error.message,
        });
      }
      
      if (error instanceof Error && error.message.includes("não encontrada")) {
        return reply.code(404).send({
          success: false,
          error: error.message,
        });
      }
      
      if (error instanceof Error && error.message.includes("já está na fila")) {
        return reply.code(409).send({
          success: false,
          error: error.message,
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicitação",
      });
    }
  }

  async listQueue(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as ListQueueRequest;
      const validatedQuery = ListQueueRequestSchema.parse(query);
      
      const result = await this.listQueueUseCase.execute(validatedQuery);
      
      return reply.code(200).send({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      request.log.error("Erro ao listar fila de produção:", error);
      
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

  async updateQueueStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as UpdateQueueStatusRequest;
      const validatedBody = UpdateQueueStatusRequestSchema.parse(body);
      
      const result = await this.updateQueueStatusUseCase.execute(id, validatedBody);
      
      return reply.code(200).send({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      request.log.error("Erro ao atualizar status da fila:", error);
      
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
          error: "Item da fila não encontrado",
        });
      }
      
      if (error instanceof Error && error.message.includes("inválida")) {
        return reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicitação",
      });
    }
  }

  async getQueueStatistics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as QueueStatisticsRequest;
      const validatedQuery = QueueStatisticsRequestSchema.parse(query);
      
      const result = await this.queueStatisticsUseCase.execute(validatedQuery);
      
      return reply.code(200).send({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      request.log.error("Erro ao obter estatísticas da fila:", error);
      
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

  async reorderQueue(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as ReorderQueueRequest;
      const validatedBody = ReorderQueueRequestSchema.parse(body);
      
      const result = await this.reorderQueueUseCase.execute(validatedBody);
      
      return reply.code(200).send({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      request.log.error("Erro ao reordenar fila:", error);
      
      if (error instanceof Error && error.name === "ZodError") {
        return reply.code(400).send({
          success: false,
          error: "Dados de reordenação inválidos",
          details: error.message,
        });
      }
      
      if (error instanceof Error && error.message.includes("duplicados")) {
        return reply.code(400).send({
          success: false,
          error: error.message,
        });
      }
      
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicitação",
      });
    }
  }

  async getQueueItem(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      // Em uma implementação real, usaríamos um use case específico
      // Por enquanto, retornamos um placeholder
      return reply.code(200).send({
        success: true,
        data: {
          id,
          orderId: "123e4567-e89b-12d3-a456-426614174000",
          orderNumber: "ORD-12345678",
          clientName: "Cliente Exemplo",
          totalItems: 10,
          priority: "medium",
          status: "pending",
          position: 1,
          estimatedStartDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        message: "Item da fila recuperado com sucesso",
      });
    } catch (error) {
      request.log.error("Erro ao obter item da fila:", error);
      
      return reply.code(500).send({
        success: false,
        error: "Erro interno ao processar solicitação",
      });
    }
  }
}