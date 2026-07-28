import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  DEFAULT_POLLING_CONFIGS, 
  getPollingConfigFromEnv, 
  validatePollingConfig 
} from "./polling.config";
import { PollingJobConfig } from "./IntelligentPollingService";

describe("polling.config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("DEFAULT_POLLING_CONFIGS", () => {
    it("deve conter configurações padrão para todos os jobs", () => {
      expect(DEFAULT_POLLING_CONFIGS).toHaveProperty("omie-production-orders-sync");
      expect(DEFAULT_POLLING_CONFIGS).toHaveProperty("omie-orders-stage20-sync");
      expect(DEFAULT_POLLING_CONFIGS).toHaveProperty("stock-monitor");
      expect(DEFAULT_POLLING_CONFIGS).toHaveProperty("omie-product-sync");
      expect(DEFAULT_POLLING_CONFIGS).toHaveProperty("stock-refresh");
    });

    it("deve ter intervalos corretos para produção (30s)", () => {
      const config = DEFAULT_POLLING_CONFIGS["omie-production-orders-sync"];
      expect(config.baseIntervalMs).toBe(30 * 1000);
      expect(config.criticality).toBe("high");
    });

    it("deve ter intervalos corretos para pedidos (1min)", () => {
      const config = DEFAULT_POLLING_CONFIGS["omie-orders-stage20-sync"];
      expect(config.baseIntervalMs).toBe(60 * 1000);
      expect(config.criticality).toBe("high");
    });

    it("deve ter intervalos corretos para estoque (2min)", () => {
      const config = DEFAULT_POLLING_CONFIGS["stock-monitor"];
      expect(config.baseIntervalMs).toBe(2 * 60 * 1000);
      expect(config.criticality).toBe("medium");
    });

    it("deve ter intervalos corretos para sincronização de produtos (5min)", () => {
      const config = DEFAULT_POLLING_CONFIGS["omie-product-sync"];
      expect(config.baseIntervalMs).toBe(5 * 60 * 1000);
      expect(config.criticality).toBe("medium");
    });

    it("deve ter intervalos corretos para refresh de estoque (10min)", () => {
      const config = DEFAULT_POLLING_CONFIGS["stock-refresh"];
      expect(config.baseIntervalMs).toBe(10 * 60 * 1000);
      expect(config.criticality).toBe("low");
    });
  });

  describe("getPollingConfigFromEnv", () => {
    beforeEach(() => {
      process.env = {};
    });

    it("deve retornar configurações padrão quando não há variáveis de ambiente", () => {
      const configs = getPollingConfigFromEnv();
      
      expect(configs["omie-production-orders-sync"].baseIntervalMs).toBe(30 * 1000);
      expect(configs["omie-orders-stage20-sync"].baseIntervalMs).toBe(60 * 1000);
      expect(configs["stock-monitor"].baseIntervalMs).toBe(2 * 60 * 1000);
    });

    it("deve usar variáveis de ambiente para habilitar/desabilitar jobs", () => {
      process.env.OMIE_PRODUCTION_ORDERS_SYNC_ENABLED = "false";
      process.env.OMIE_ORDERS_STAGE20_SYNC_ENABLED = "0";
      process.env.STOCK_MONITOR_ENABLED = "true";

      const configs = getPollingConfigFromEnv();
      
      expect(configs["omie-production-orders-sync"].enabled).toBe(false);
      expect(configs["omie-orders-stage20-sync"].enabled).toBe(false);
      expect(configs["stock-monitor"].enabled).toBe(true);
    });

    it("deve usar variáveis de ambiente para intervalos personalizados", () => {
      process.env.OMIE_PRODUCTION_ORDERS_SYNC_BASE_INTERVAL_MS = "15000";
      process.env.OMIE_ORDERS_STAGE20_SYNC_BASE_INTERVAL_MS = "30000";
      process.env.STOCK_MONITOR_BASE_INTERVAL_MS = "90000";

      const configs = getPollingConfigFromEnv();
      
      expect(configs["omie-production-orders-sync"].baseIntervalMs).toBe(15000);
      expect(configs["omie-orders-stage20-sync"].baseIntervalMs).toBe(30000);
      expect(configs["stock-monitor"].baseIntervalMs).toBe(90000);
    });

    it("deve usar variáveis de ambiente para intervalos máximos personalizados", () => {
      process.env.OMIE_PRODUCTION_ORDERS_SYNC_MAX_INTERVAL_MS = "300000";
      process.env.OMIE_ORDERS_STAGE20_SYNC_MAX_INTERVAL_MS = "600000";

      const configs = getPollingConfigFromEnv();
      
      expect(configs["omie-production-orders-sync"].maxIntervalMs).toBe(300000);
      expect(configs["omie-orders-stage20-sync"].maxIntervalMs).toBe(600000);
    });

    it("deve lidar com valores de ambiente inválidos usando padrões", () => {
      process.env.OMIE_PRODUCTION_ORDERS_SYNC_BASE_INTERVAL_MS = "invalid";
      process.env.OMIE_PRODUCTION_ORDERS_SYNC_MAX_INTERVAL_MS = "also-invalid";

      const configs = getPollingConfigFromEnv();
      
      expect(configs["omie-production-orders-sync"].baseIntervalMs).toBe(30 * 1000);
      expect(configs["omie-production-orders-sync"].maxIntervalMs).toBe(5 * 60 * 1000);
    });
  });

  describe("validatePollingConfig", () => {
    it("deve retornar array vazio para configuração válida", () => {
      const validConfig: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
      };

      const errors = validatePollingConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it("deve detectar intervalo base negativo", () => {
      const invalidConfig: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: -1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
      };

      const errors = validatePollingConfig(invalidConfig);
      expect(errors).toContain("baseIntervalMs must be positive for job test-job");
    });

    it("deve detectar intervalo máximo negativo", () => {
      const invalidConfig: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: -5000,
        criticality: "high",
        enabled: true,
      };

      const errors = validatePollingConfig(invalidConfig);
      expect(errors).toContain("maxIntervalMs must be positive for job test-job");
    });

    it("deve detectar intervalo base maior que máximo", () => {
      const invalidConfig: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 10000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
      };

      const errors = validatePollingConfig(invalidConfig);
      expect(errors).toContain("baseIntervalMs cannot be greater than maxIntervalMs for job test-job");
    });

    it("deve detectar criticidade inválida", () => {
      const invalidConfig: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "invalid" as any,
        enabled: true,
      };

      const errors = validatePollingConfig(invalidConfig);
      expect(errors).toContain("criticality must be one of: high, medium, low for job test-job");
    });

    it("deve detectar múltiplos erros", () => {
      const invalidConfig: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: -1000,
        maxIntervalMs: -5000,
        criticality: "invalid" as any,
        enabled: true,
      };

      const errors = validatePollingConfig(invalidConfig);
      expect(errors).toHaveLength(3);
      expect(errors).toContain("baseIntervalMs must be positive for job test-job");
      expect(errors).toContain("maxIntervalMs must be positive for job test-job");
      expect(errors).toContain("criticality must be one of: high, medium, low for job test-job");
    });
  });
});