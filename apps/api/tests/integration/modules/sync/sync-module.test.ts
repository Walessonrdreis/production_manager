import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { build } from "../../../../src/server";
import type { FastifyInstance } from "fastify";

describe("Sync Module Integration", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Endpoints", () => {
    it("deve registrar o endpoint POST /api/sync/stock", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/sync/stock/schema",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty("request");
      expect(response.json()).toHaveProperty("response");
    });

    it("deve registrar o endpoint POST /api/sync/orders", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/sync/orders/schema",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty("request");
      expect(response.json()).toHaveProperty("response");
    });

    it("deve registrar o endpoint GET /api/sync/status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/sync/status/schema",
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty("request");
      expect(response.json()).toHaveProperty("response");
    });

    it("deve retornar erro 400 para request inválido no endpoint /api/sync/stock", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/sync/stock",
        payload: {
          batchSize: "invalid", // Valor inválido (deveria ser número)
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty("success", false);
      expect(response.json()).toHaveProperty("message");
    });

    it("deve retornar erro 400 para request inválido no endpoint /api/sync/orders", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/sync/orders",
        payload: {
          orderStatus: "invalid_status", // Status inválido
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty("success", false);
      expect(response.json()).toHaveProperty("message");
    });

    it("deve retornar status de sincronização com parâmetros padrão", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/sync/status",
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("message");
      expect(data).toHaveProperty("data");
      
      if (data.success) {
        expect(data.data).toHaveProperty("summary");
        expect(data.data).toHaveProperty("recentSyncs");
        expect(data.data).toHaveProperty("syncStatsByType");
      }
    });

    it("deve aceitar parâmetros de filtro no endpoint /api/sync/status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/sync/status?syncType=stock&limit=5",
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      
      expect(data).toHaveProperty("success");
      // Mesmo que não haja dados, a estrutura deve ser válida
      expect(data).toHaveProperty("data");
    });
  });

  describe("Schema Validation", () => {
    it("deve validar request schema para /api/sync/stock", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/sync/stock/schema",
      });

      const schema = response.json();
      
      // Verificar estrutura básica do schema
      expect(schema.request).toBeDefined();
      expect(schema.response).toBeDefined();
      
      // Verificar propriedades obrigatórias
      expect(schema.request.properties).toHaveProperty("forceRefresh");
      expect(schema.request.properties).toHaveProperty("batchSize");
    });

    it("deve validar request schema para /api/sync/orders", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/sync/orders/schema",
      });

      const schema = response.json();
      
      expect(schema.request).toBeDefined();
      expect(schema.response).toBeDefined();
      
      expect(schema.request.properties).toHaveProperty("orderStatus");
      expect(schema.request.properties).toHaveProperty("includeProductionOrders");
      expect(schema.request.properties).toHaveProperty("includeSalesOrders");
    });

    it("deve validar request schema para /api/sync/status", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/sync/status/schema",
      });

      const schema = response.json();
      
      expect(schema.request).toBeDefined();
      expect(schema.response).toBeDefined();
      
      expect(schema.request.properties).toHaveProperty("syncType");
      expect(schema.request.properties).toHaveProperty("limit");
    });
  });
});