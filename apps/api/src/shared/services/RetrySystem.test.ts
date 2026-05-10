import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RetrySystem, RetryConfig } from "./RetrySystem";
import { Logger } from "@/shared/logger";

describe("RetrySystem", () => {
  let retrySystem: RetrySystem;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child: vi.fn(() => mockLogger),
    } as unknown as Logger;

    retrySystem = new RetrySystem(mockLogger);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createDefaultConfig = (): RetryConfig => ({
    maxAttempts: 3,
    baseDelayMs: 100,
    maxDelayMs: 1000,
    exponentialFactor: 2,
    jitter: false,
    jitterFactor: 0.1,
    circuitBreakerEnabled: false,
    circuitBreakerThreshold: 5,
    circuitBreakerResetTimeoutMs: 60000,
  });

  it("should execute operation successfully on first attempt", async () => {
    const config = createDefaultConfig();
    const operation = vi.fn().mockResolvedValue("success");

    const result = await retrySystem.executeWithRetry(operation, config, "test-operation");

    expect(result.success).toBe(true);
    expect(result.data).toBe("success");
    expect(result.attempts).toBe(1);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("should retry operation on failure and succeed", async () => {
    const config = createDefaultConfig();
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("First attempt failed"))
      .mockResolvedValueOnce("success");

    const result = await retrySystem.executeWithRetry(operation, config, "test-operation");

    expect(result.success).toBe(true);
    expect(result.data).toBe("success");
    expect(result.attempts).toBe(2);
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("should fail after max attempts", async () => {
    const config = createDefaultConfig();
    const operation = vi.fn().mockRejectedValue(new Error("Always fails"));

    const result = await retrySystem.executeWithRetry(operation, config, "test-operation");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Operation failed after all retry attempts");
    expect(result.attempts).toBe(config.maxAttempts);
    expect(operation).toHaveBeenCalledTimes(config.maxAttempts);
  });

  it("should apply exponential backoff with jitter", async () => {
    const config = createDefaultConfig();
    config.jitter = true;
    config.baseDelayMs = 100;
    config.exponentialFactor = 2;

    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValueOnce("success");

    const executePromise = retrySystem.executeWithRetry(operation, config, "test-operation");

    await vi.advanceTimersByTimeAsync(100);
    expect(operation).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(200);
    expect(operation).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(400);
    expect(operation).toHaveBeenCalledTimes(3);

    const result = await executePromise;
    expect(result.success).toBe(true);
  }, { timeout: 10000 });

  it("should trip circuit breaker after threshold failures", async () => {
    const config = createDefaultConfig();
    config.circuitBreakerEnabled = true;
    config.circuitBreakerThreshold = 2;

    const operation = vi.fn().mockRejectedValue(new Error("Always fails"));

    await retrySystem.executeWithRetry(operation, config, "test-operation");
    await retrySystem.executeWithRetry(operation, config, "test-operation");

    const result = await retrySystem.executeWithRetry(operation, config, "test-operation");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Circuit breaker is open");
    expect(result.circuitBreakerState).toBe("open");
  });

  it("should reset circuit breaker after timeout", async () => {
    const config = createDefaultConfig();
    config.circuitBreakerEnabled = true;
    config.circuitBreakerThreshold = 1;
    config.circuitBreakerResetTimeoutMs = 1000;

    const operation = vi.fn().mockRejectedValue(new Error("Always fails"));

    await retrySystem.executeWithRetry(operation, config, "test-operation");

    vi.advanceTimersByTime(1000);

    const result = await retrySystem.executeWithRetry(operation, config, "test-operation");

    expect(result.circuitBreakerState).toBe("half-open");
  });

  it("should close circuit breaker after successful operation in half-open state", async () => {
    const config = createDefaultConfig();
    config.circuitBreakerEnabled = true;
    config.circuitBreakerThreshold = 1;
    config.circuitBreakerResetTimeoutMs = 1000;

    const failingOperation = vi.fn().mockRejectedValue(new Error("Fails"));
    const succeedingOperation = vi.fn().mockResolvedValue("success");

    await retrySystem.executeWithRetry(failingOperation, config, "test-operation");

    vi.advanceTimersByTime(1000);

    const result = await retrySystem.executeWithRetry(succeedingOperation, config, "test-operation");

    expect(result.success).toBe(true);
    expect(result.circuitBreakerState).toBe("closed");
  });

  it("should track metrics correctly", async () => {
    const config = createDefaultConfig();
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockResolvedValueOnce("success");

    await retrySystem.executeWithRetry(operation, config, "test-operation");

    const metrics = retrySystem.getMetrics();
    expect(metrics.totalRetries).toBe(1);
    expect(metrics.successfulRetries).toBe(1);
    expect(metrics.failedRetries).toBe(0);
  });

  it("should create default config with static method", () => {
    const defaultConfig = RetrySystem.createDefaultConfig();

    expect(defaultConfig.maxAttempts).toBe(3);
    expect(defaultConfig.baseDelayMs).toBe(1000);
    expect(defaultConfig.exponentialFactor).toBe(2);
    expect(defaultConfig.jitter).toBe(true);
    expect(defaultConfig.circuitBreakerEnabled).toBe(true);
  });

  it("should reset circuit breaker manually", () => {
    retrySystem.resetCircuitBreaker();

    const state = retrySystem.getCircuitBreakerState();
    expect(state).toBe("closed");
  });
});