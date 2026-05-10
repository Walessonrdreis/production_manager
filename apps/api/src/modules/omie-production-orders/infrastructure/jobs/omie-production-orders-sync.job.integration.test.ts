import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { startOmieProductionOrdersSyncJob } from "./omie-production-orders-sync.job";
import { IntelligentPollingService } from "@/shared/services/IntelligentPollingService";

describe("omie-production-orders-sync.job - Integration", () => {
  let mockLogger: any;
  let mockFastify: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn(() => mockLogger),
    };

    mockFastify = {
      log: mockLogger,
    };

    process.env.NODE_ENV = "development";
    process.env.POLLING_OMIE_PRODUCTION_ORDERS_SYNC_ENABLED = "true";
    process.env.POLLING_OMIE_PRODUCTION_ORDERS_SYNC_BASE_INTERVAL_MS = "30000";
    process.env.POLLING_OMIE_PRODUCTION_ORDERS_SYNC_MAX_INTERVAL_MS = "300000";
    process.env.POLLING_OMIE_PRODUCTION_ORDERS_SYNC_CRITICALITY = "high";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("should not run in test environment", () => {
    process.env.NODE_ENV = "test";
    
    startOmieProductionOrdersSyncJob(mockLogger);
    
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it("should log when job is disabled via environment", () => {
    process.env.POLLING_OMIE_PRODUCTION_ORDERS_SYNC_ENABLED = "false";
    
    startOmieProductionOrdersSyncJob(mockLogger);
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      {},
      "omie production orders sync job disabled via environment"
    );
  });

  it("should register job with IntelligentPollingService when enabled", () => {
    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");
    const spyStartJob = vi.spyOn(IntelligentPollingService.prototype, "startJob");

    startOmieProductionOrdersSyncJob(mockLogger);

    expect(spyRegisterJob).toHaveBeenCalled();
    expect(spyStartJob).toHaveBeenCalled();
    
    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.name).toBe("omie-production-orders-sync");
    expect(registerCall.baseIntervalMs).toBe(30000);
    expect(registerCall.maxIntervalMs).toBe(300000);
    expect(registerCall.criticality).toBe("high");
    expect(registerCall.enabled).toBe(true);
  });

  it("should use environment variables for configuration", () => {
    process.env.POLLING_OMIE_PRODUCTION_ORDERS_SYNC_BASE_INTERVAL_MS = "60000";
    process.env.POLLING_OMIE_PRODUCTION_ORDERS_SYNC_MAX_INTERVAL_MS = "600000";
    process.env.POLLING_OMIE_PRODUCTION_ORDERS_SYNC_CRITICALITY = "medium";

    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startOmieProductionOrdersSyncJob(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.baseIntervalMs).toBe(60000);
    expect(registerCall.maxIntervalMs).toBe(600000);
    expect(registerCall.criticality).toBe("medium");
  });

  it("should handle Fastify instance as input", () => {
    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startOmieProductionOrdersSyncJob(mockFastify);

    expect(spyRegisterJob).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it("should include retry configuration from environment", () => {
    process.env.RETRY_OMIE_PRODUCTION_ORDERS_SYNC_MAX_ATTEMPTS = "5";
    process.env.RETRY_OMIE_PRODUCTION_ORDERS_SYNC_BASE_DELAY_MS = "5000";

    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startOmieProductionOrdersSyncJob(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.retryConfig).toBeDefined();
    expect(registerCall.retryConfig?.maxAttempts).toBe(5);
    expect(registerCall.retryConfig?.baseDelayMs).toBe(5000);
  });

  it("should log job start and registration", () => {
    startOmieProductionOrdersSyncJob(mockLogger);

    expect(mockLogger.info).toHaveBeenCalledWith(
      { jobName: "omie-production-orders-sync" },
      "Job registered"
    );
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      { jobName: "omie-production-orders-sync" },
      "Job started"
    );
  });

  it("should handle missing environment variables with defaults", () => {
    delete process.env.POLLING_OMIE_PRODUCTION_ORDERS_SYNC_BASE_INTERVAL_MS;
    delete process.env.POLLING_OMIE_PRODUCTION_ORDERS_SYNC_MAX_INTERVAL_MS;
    delete process.env.POLLING_OMIE_PRODUCTION_ORDERS_SYNC_CRITICALITY;

    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startOmieProductionOrdersSyncJob(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.baseIntervalMs).toBe(30000);
    expect(registerCall.maxIntervalMs).toBe(300000);
    expect(registerCall.criticality).toBe("high");
  });
});