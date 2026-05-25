import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildFastify } from "@/bootstrap/app";
import type { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";

describe("Production Queue API Integration Tests", () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;

  beforeEach(async () => {
    app = await buildFastify();
    prisma = new PrismaClient();
    
    // Limpar dados de teste
    await prisma.productionQueue.deleteMany({});
  });

  afterEach(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe("POST /api/production/queue/add", () => {
    it("deve adicionar uma ordem à fila com sucesso", async () => {
      const requestBody = {
        orderId: "123e4567-e89b-12d3-a456-426614174000",
        priority: "high" as const,
        notes: "Ordem urgente de produção",
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/production/queue/add",
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toHaveProperty("id");
      expect(responseBody.data.orderId).toBe(requestBody.orderId);
      expect(responseBody.data.priority).toBe("high");
      expect(responseBody.data.status).toBe("pending");
      expect(responseBody.data.position).toBe(1);
      expect(responseBody.data).toHaveProperty("estimatedStartDate");
      expect(responseBody.message).toContain("Ordem adicionada à fila de produção");
    });

    it("deve retornar erro 400 quando ordem não existe", async () => {
      const requestBody = {
        orderId: "999e9999-e99b-99d3-a999-999999999999",
        priority: "medium" as const,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/production/queue/add",
        payload: requestBody,
      });

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain("Ordem não encontrada");
    });

    it("deve validar schema da requisição", async () => {
      const invalidRequestBody = {
        orderId: "invalid-uuid",
        priority: "invalid-priority",
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/production/queue/add",
        payload: invalidRequestBody,
      });

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain("validation");
    });
  });

  describe("GET /api/production/queue", () => {
    beforeEach(async () => {
      // Criar alguns itens de teste
      await prisma.productionQueue.createMany({
        data: [
          {
            orderId: "111e1111-e11b-11d3-a111-111111111111",
            priority: "high",
            status: "pending",
            position: 1,
            estimatedStartDate: new Date("2024-01-01T10:00:00Z"),
          },
          {
            orderId: "222e2222-e22b-22d3-a222-222222222222",
            priority: "medium",
            status: "in_progress",
            position: 2,
            estimatedStartDate: new Date("2024-01-01T11:00:00Z"),
          },
          {
            orderId: "333e3333-e33b-33d3-a333-333333333333",
            priority: "low",
            status: "pending",
            position: 3,
            estimatedStartDate: new Date("2024-01-01T12:00:00Z"),
          },
        ],
      });
    });

    it("deve listar todos os itens da fila", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/production/queue",
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.items).toHaveLength(3);
      expect(responseBody.data.pagination.totalItems).toBe(3);
      expect(responseBody.data.pagination.totalPages).toBe(1);
      expect(responseBody.data.pagination.currentPage).toBe(1);
      expect(responseBody.data.pagination.pageSize).toBe(20);
    });

    it("deve filtrar por status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/production/queue?status=pending",
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.items).toHaveLength(2);
      expect(responseBody.data.items.every((item: any) => item.status === "pending")).toBe(true);
    });

    it("deve filtrar por prioridade", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/production/queue?priority=high",
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.items).toHaveLength(1);
      expect(responseBody.data.items[0].priority).toBe("high");
    });

    it("deve suportar paginação", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/production/queue?page=1&pageSize=2",
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.items).toHaveLength(2);
      expect(responseBody.data.pagination.pageSize).toBe(2);
      expect(responseBody.data.pagination.currentPage).toBe(1);
    });
  });

  describe("PATCH /api/production/queue/:id/status", () => {
    let testItemId: string;

    beforeEach(async () => {
      // Criar um item de teste
      const testItem = await prisma.productionQueue.create({
        data: {
          orderId: "444e4444-e44b-44d3-a444-444444444444",
          priority: "medium",
          status: "pending",
          position: 1,
          estimatedStartDate: new Date("2024-01-01T10:00:00Z"),
        },
      });
      
      testItemId = testItem.id;
    });

    it("deve atualizar status de um item na fila", async () => {
      const requestBody = {
        status: "in_progress" as const,
        notes: "Iniciando produção",
      };

      const response = await app.inject({
        method: "PATCH",
        url: `/api/production/queue/${testItemId}/status`,
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.id).toBe(testItemId);
      expect(responseBody.data.status).toBe("in_progress");
      expect(responseBody.data.notes).toBe("Iniciando produção");
      expect(responseBody.message).toContain("Status atualizado com sucesso");
    });

    it("deve retornar erro 404 quando item não existe", async () => {
      const nonExistentId = "999e9999-e99b-99d3-a999-999999999999";
      const requestBody = {
        status: "completed" as const,
      };

      const response = await app.inject({
        method: "PATCH",
        url: `/api/production/queue/${nonExistentId}/status`,
        payload: requestBody,
      });

      expect(response.statusCode).toBe(404);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain("Item não encontrado");
    });

    it("deve validar transições de status", async () => {
      // Primeiro atualizar para completed
      await prisma.productionQueue.update({
        where: { id: testItemId },
        data: { status: "completed" },
      });

      const requestBody = {
        status: "cancelled" as const,
      };

      const response = await app.inject({
        method: "PATCH",
        url: `/api/production/queue/${testItemId}/status`,
        payload: requestBody,
      });

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain("Transição de status inválida");
    });
  });

  describe("GET /api/production/queue/statistics", () => {
    beforeEach(async () => {
      // Criar itens de teste com diferentes status
      await prisma.productionQueue.createMany({
        data: [
          {
            orderId: "555e5555-e55b-55d3-a555-555555555555",
            priority: "high",
            status: "pending",
            position: 1,
            estimatedStartDate: new Date("2024-01-01T10:00:00Z"),
          },
          {
            orderId: "666e6666-e66b-66d3-a666-666666666666",
            priority: "medium",
            status: "in_progress",
            position: 2,
            estimatedStartDate: new Date("2024-01-01T11:00:00Z"),
          },
          {
            orderId: "777e7777-e77b-77d3-a777-777777777777",
            priority: "low",
            status: "completed",
            position: 3,
            estimatedStartDate: new Date("2024-01-01T12:00:00Z"),
            completedAt: new Date("2024-01-01T13:00:00Z"),
          },
          {
            orderId: "888e8888-e88b-88d3-a888-888888888888",
            priority: "medium",
            status: "pending",
            position: 4,
            estimatedStartDate: new Date("2024-01-01T14:00:00Z"),
          },
        ],
      });
    });

    it("deve retornar estatísticas da fila", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/production/queue/statistics",
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toHaveProperty("totalItems");
      expect(responseBody.data).toHaveProperty("byStatus");
      expect(responseBody.data).toHaveProperty("byPriority");
      expect(responseBody.data).toHaveProperty("averageCompletionTime");
      
      expect(responseBody.data.totalItems).toBe(4);
      expect(responseBody.data.byStatus.pending).toBe(2);
      expect(responseBody.data.byStatus.in_progress).toBe(1);
      expect(responseBody.data.byStatus.completed).toBe(1);
      expect(responseBody.data.byPriority.high).toBe(1);
      expect(responseBody.data.byPriority.medium).toBe(2);
      expect(responseBody.data.byPriority.low).toBe(1);
    });
  });

  describe("POST /api/production/queue/reorder", () => {
    beforeEach(async () => {
      // Criar itens de teste
      await prisma.productionQueue.createMany({
        data: [
          {
            orderId: "999e9999-e99b-99d3-a999-999999999999",
            priority: "high",
            status: "pending",
            position: 1,
            estimatedStartDate: new Date("2024-01-01T10:00:00Z"),
          },
          {
            orderId: "000e0000-e00b-00d3-a000-000000000000",
            priority: "medium",
            status: "pending",
            position: 2,
            estimatedStartDate: new Date("2024-01-01T11:00:00Z"),
          },
        ],
      });
    });

    it("deve reordenar a fila com base em prioridade", async () => {
      const requestBody = {
        strategy: "priority" as const,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/production/queue/reorder",
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toHaveLength(2);
      expect(responseBody.message).toContain("Fila reordenada com sucesso");
    });

    it("deve validar estratégia de reordenação", async () => {
      const invalidRequestBody = {
        strategy: "invalid-strategy" as any,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/production/queue/reorder",
        payload: invalidRequestBody,
      });

      expect(response.statusCode).toBe(400);
      const responseBody = JSON.parse(response.body);
      
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain("validation");
    });
  });
});