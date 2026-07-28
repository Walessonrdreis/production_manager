import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getRetryConfig, getAllRetryConfigs, DEFAULT_RETRY_CONFIGS } from "./retry.config";

describe("retry.config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getRetryConfig", () => {
    it("should return default config for known job", () => {
      const config = getRetryConfig("omie-production-orders-sync");

      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelayMs).toBe(2000);
      expect(config.circuitBreakerEnabled).toBe(true);
    });

    it("should return default config for unknown job", () => {
      const config = getRetryConfig("unknown-job");

      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelayMs).toBe(1000);
      expect(config.circuitBreakerEnabled).toBe(true);
    });

    it("should override config with environment variables", () => {
      process.env.RETRY_OMIE_PRODUCTION_ORDERS_SYNC_MAX_ATTEMPTS = "5";
      process.env.RETRY_OMIE_PRODUCTION_ORDERS_SYNC_BASE_DELAY_MS = "5000";
      process.env.RETRY_OMIE_PRODUCTION_ORDERS_SYNC_JITTER = "false";

      const config = getRetryConfig("omie-production-orders-sync");

      expect(config.maxAttempts).toBe(5);
      expect(config.baseDelayMs).toBe(5000);
      expect(config.jitter).toBe(false);
    });

    it("should handle boolean environment variables correctly", () => {
      process.env.RETRY_OMIE_PRODUCTION_ORDERS_SYNC_CIRCUIT_BREAKER_ENABLED = "false";
      process.env.RETRY_OMIE_PRODUCTION_ORDERS_SYNC_JITTER = "true";

      const config = getRetryConfig("omie-production-orders-sync");

      expect(config.circuitBreakerEnabled).toBe(false);
      expect(config.jitter).toBe(true);
    });

    it("should handle numeric environment variables correctly", () => {
      process.env.RETRY_OMIE_PRODUCTION_ORDERS_SYNC_MAX_ATTEMPTS = "10";
      process.env.RETRY_OMIE_PRODUCTION_ORDERS_SYNC_BASE_DELAY_MS = "10000";
      process.env.RETRY_OMIE_PRODUCTION_ORDERS_SYNC_EXPONENTIAL_FACTOR = "3.5";

      const config = getRetryConfig("omie-production-orders-sync");

      expect(config.maxAttempts).toBe(10);
      expect(config.baseDelayMs).toBe(10000);
      expect(config.exponentialFactor).toBe(3.5);
    });

    it("should handle job names with hyphens correctly", () => {
      const config = getRetryConfig("stock-monitor");

      expect(config.maxAttempts).toBe(2);
      expect(config.baseDelayMs).toBe(5000);
      expect(config.circuitBreakerEnabled).toBe(false);
    });
  });

  describe("getAllRetryConfigs", () => {
    it("should return configs for all known jobs", () => {
      const configs = getAllRetryConfigs();

      expect(Object.keys(configs)).toEqual(Object.keys(DEFAULT_RETRY_CONFIGS));
      
      expect(configs["omie-production-orders-sync"].maxAttempts).toBe(3);
      expect(configs["omie-orders-stage20-sync"].maxAttempts).toBe(3);
      expect(configs["stock-monitor"].maxAttempts).toBe(2);
    });

    it("should apply environment overrides to all configs", () => {
      process.env.RETRY_OMIE_PRODUCTION_ORDERS_SYNC_MAX_ATTEMPTS = "7";
      process.env.RETRY_STOCK_MONITOR_BASE_DELAY_MS = "15000";

      const configs = getAllRetryConfigs();

      expect(configs["omie-production-orders-sync"].maxAttempts).toBe(7);
      expect(configs["stock-monitor"].baseDelayMs).toBe(15000);
      expect(configs["omie-orders-stage20-sync"].maxAttempts).toBe(3);
    });
  });

  describe("DEFAULT_RETRY_CONFIGS", () => {
    it("should have appropriate configs for production orders sync", () => {
      const config = DEFAULT_RETRY_CONFIGS["omie-production-orders-sync"];

      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelayMs).toBe(2000);
      expect(config.circuitBreakerEnabled).toBe(true);
      expect(config.circuitBreakerThreshold).toBe(3);
    });

    it("should have appropriate configs for orders stage20 sync", () => {
      const config = DEFAULT_RETRY_CONFIGS["omie-orders-stage20-sync"];

      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelayMs).toBe(2000);
      expect(config.circuitBreakerEnabled).toBe(true);
    });

    it("should have appropriate configs for stock monitor", () => {
      const config = DEFAULT_RETRY_CONFIGS["stock-monitor"];

      expect(config.maxAttempts).toBe(2);
      expect(config.baseDelayMs).toBe(5000);
      expect(config.circuitBreakerEnabled).toBe(false);
      expect(config.circuitBreakerResetTimeoutMs).toBe(120000);
    });

    it("should have jitter enabled by default", () => {
      const config = DEFAULT_RETRY_CONFIGS["omie-production-orders-sync"];
      expect(config.jitter).toBe(true);
    });

    it("should have reasonable exponential factors", () => {
      const config = DEFAULT_RETRY_CONFIGS["omie-production-orders-sync"];
      expect(config.exponentialFactor).toBe(2);
    });
  });
});