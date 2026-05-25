import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { startStockMonitorJob } from "./stock-monitor.job";
import { IntelligentPollingService } from "@/shared/services/IntelligentPollingService";

describe("stock-monitor.job - Integration", () => {
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
    process.env.POLLING_STOCK_MONITOR_ENABLED = "true";
    process.env.POLLING_STOCK_MONITOR_BASE_INTERVAL_MS = "120000";
    process.env.POLLING_STOCK_MONITOR_MAX_INTERVAL_MS = "1800000";
    process.env.POLLING_STOCK_MONITOR_CRITICALITY = "medium";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("should not run in test environment", () => {
    process.env.NODE_ENV = "test";
    
    startStockMonitorJob(mockLogger);
    
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it("should log when job is disabled via environment", () => {
    process.env.POLLING_STOCK_MONITOR_ENABLED = "false";
    
    startStockMonitorJob(mockLogger);
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      {},
      "stock monitor job disabled via environment"
    );
  });

  it("should register job with IntelligentPollingService when enabled", () => {
    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");
    const spyStartJob = vi.spyOn(IntelligentPollingService.prototype, "startJob");

    startStockMonitorJob(mockLogger);

    expect(spyRegisterJob).toHaveBeenCalled();
    expect(spyStartJob).toHaveBeenCalled();
    
    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.name).toBe("stock-monitor");
    expect(registerCall.baseIntervalMs).toBe(120000);
    expect(registerCall.maxIntervalMs).toBe(1800000);
    expect(registerCall.criticality).toBe("medium");
    expect(registerCall.enabled).toBe(true);
  });

  it("should use environment variables for configuration", () => {
    process.env.POLLING_STOCK_MONITOR_BASE_INTERVAL_MS = "180000";
    process.env.POLLING_STOCK_MONITOR_MAX_INTERVAL_MS = "2400000";
    process.env.POLLING_STOCK_MONITOR_CRITICALITY = "low";

    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startStockMonitorJob(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.baseIntervalMs).toBe(180000);
    expect(registerCall.maxIntervalMs).toBe(2400000);
    expect(registerCall.criticality).toBe("low");
  });

  it("should handle Fastify instance as input", () => {
    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startStockMonitorJob(mockFastify);

    expect(spyRegisterJob).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it("should include retry configuration from environment", () => {
    process.env.RETRY_STOCK_MONITOR_MAX_ATTEMPTS = "3";
    process.env.RETRY_STOCK_MONITOR_BASE_DELAY_MS = "10000";

    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startStockMonitorJob(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.retryConfig).toBeDefined();
    expect(registerCall.retryConfig?.maxAttempts).toBe(3);
    expect(registerCall.retryConfig?.baseDelayMs).toBe(10000);
  });

  it("should log job start and registration", () => {
    startStockMonitorJob(mockLogger);

    expect(mockLogger.info).toHaveBeenCalledWith(
      { jobName: "stock-monitor" },
      "Job registered"
    );
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      { jobName: "stock-monitor" },
      "Job started"
    );
  });

  it("should handle missing environment variables with defaults", () => {
    delete process.env.POLLING_STOCK_MONITOR_BASE_INTERVAL_MS;
    delete process.env.POLLING_STOCK_MONITOR_MAX_INTERVAL_MS;
    delete process.env.POLLING_STOCK_MONITOR_CRITICALITY;

    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startStockMonitorJob(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.baseIntervalMs).toBe(120000);
    expect(registerCall.maxIntervalMs).toBe(1800000);
    expect(registerCall.criticality).toBe("medium");
  });

  it("should use 2-minute interval as specified in requirements", () => {
    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startStockMonitorJob(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.baseIntervalMs).toBe(120000);
  });

  it("should have circuit breaker disabled by default for stock monitoring", () => {
    const spyRegisterJob = vi.spyOn(IntelligentPollingService.prototype, "registerJob");

    startStockMonitorJob(mockLogger);

    const registerCall = spyRegisterJob.mock.calls[0][0];
    expect(registerCall.retryConfig?.circuitBreakerEnabled).toBe(false);
  });
});