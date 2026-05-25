import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { startOmieOrdersStage20Job } from "./omie-orders-stage20.job";
import { IntelligentPollingService } from "@/shared/services/IntelligentPollingService";

describe("omie-orders-stage20.job - Integration", () => {
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
    process.env.POLLING_OMIE_ORDERS_STAGE20_SYNC_ENABLED = "true";
    process.env.POLLING_OMIE_ORDERS_STAGE20_SYNC_BASE_INTERVAL_MS = "60000";
    process.env.POLLING_OMIE_ORDERS_STAGE20_SYNC_MAX_INTERVAL_MS = "600000";
    process.env.POLLING_OMIE_ORDERS_STAGE20_SYNC_CRITICALITY = "high";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("should not run in test environment", () => {
    process.env.NODE_ENV = "test";
    
    startOmieOrdersStage20Job(mockLogger);
    
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it("should log when job is disabled via environment", () => {
    process.env.POLLING_OMIE_ORDERS_STAGE20_SYNC_ENABLED = "false";
    
    startOmieOrdersStage20Job(mockLogger);
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      {},
      "omie orders stage20 job disabled via environment"
    );
  });

  it("should register job with IntelligentPollingService when enabled", () => {
    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");
    const spyStartJob = vi.spyOn(IntelligentPollingService.prototype, "startJob");

    startOmieOrdersStage20Job(mockLogger);

    expect(spyRegisterJob).toHaveBeenCalled();
    expect(spyStartJob).toHaveBeenCalled();
    
    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.name).toBe("omie-orders-stage20-sync");
    expect(registerCall.baseIntervalMs).toBe(60000);
    expect(registerCall.maxIntervalMs).toBe(600000);
    expect(registerCall.criticality).toBe("high");
    expect(registerCall.enabled).toBe(true);
  });

  it("should use environment variables for configuration", () => {
    process.env.POLLING_OMIE_ORDERS_STAGE20_SYNC_BASE_INTERVAL_MS = "120000";
    process.env.POLLING_OMIE_ORDERS_STAGE20_SYNC_MAX_INTERVAL_MS = "1200000";
    process.env.POLLING_OMIE_ORDERS_STAGE20_SYNC_CRITICALITY = "medium";

    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startOmieOrdersStage20Job(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.baseIntervalMs).toBe(120000);
    expect(registerCall.maxIntervalMs).toBe(1200000);
    expect(registerCall.criticality).toBe("medium");
  });

  it("should handle Fastify instance as input", () => {
    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startOmieOrdersStage20Job(mockFastify);

    expect(spyRegisterJob).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it("should include retry configuration from environment", () => {
    process.env.RETRY_OMIE_ORDERS_STAGE20_SYNC_MAX_ATTEMPTS = "4";
    process.env.RETRY_OMIE_ORDERS_STAGE20_SYNC_BASE_DELAY_MS = "3000";

    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startOmieOrdersStage20Job(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.retryConfig).toBeDefined();
    expect(registerCall.retryConfig?.maxAttempts).toBe(4);
    expect(registerCall.retryConfig?.baseDelayMs).toBe(3000);
  });

  it("should log job start and registration", () => {
    startOmieOrdersStage20Job(mockLogger);

    expect(mockLogger.info).toHaveBeenCalledWith(
      { jobName: "omie-orders-stage20-sync" },
      "Job registered"
    );
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      { jobName: "omie-orders-stage20-sync" },
      "Job started"
    );
  });

  it("should handle missing environment variables with defaults", () => {
    delete process.env.POLLING_OMIE_ORDERS_STAGE20_SYNC_BASE_INTERVAL_MS;
    delete process.env.POLLING_OMIE_ORDERS_STAGE20_SYNC_MAX_INTERVAL_MS;
    delete process.env.POLLING_OMIE_ORDERS_STAGE20_SYNC_CRITICALITY;

    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startOmieOrdersStage20Job(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.baseIntervalMs).toBe(60000);
    expect(registerCall.maxIntervalMs).toBe(600000);
    expect(registerCall.criticality).toBe("high");
  });

  it("should use 1-minute interval as specified in requirements", () => {
    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startOmieOrdersStage20Job(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.baseIntervalMs).toBe(60000);
  });
});