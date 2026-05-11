import { Logger } from "@/shared/logger";

export type RetryConfig = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialFactor: number;
  jitter: boolean;
  jitterFactor: number;
  circuitBreakerEnabled: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerResetTimeoutMs: number;
};

export type RetryResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
  totalDurationMs: number;
  lastAttemptAt: Date;
  circuitBreakerState?: "closed" | "open" | "half-open";
};

export type RetryMetrics = {
  totalRetries: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryDurationMs: number;
  circuitBreakerTrips: number;
  circuitBreakerResets: number;
};

export class RetrySystem {
  private logger: Logger;
  private metrics: RetryMetrics = {
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0,
    averageRetryDurationMs: 0,
    circuitBreakerTrips: 0,
    circuitBreakerResets: 0,
  };

  private circuitBreakerState: "closed" | "open" | "half-open" = "closed";
  private consecutiveFailures = 0;
  private circuitBreakerOpenedAt: Date | null = null;

  constructor(logger: Logger) {
    this.logger = logger.child({ service: "RetrySystem" });
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    operationName: string
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    let attempts = 0;

    this.logger.info("Starting retry operation", { operationName, config });

    while (attempts < config.maxAttempts) {
      attempts++;

      if (this.shouldBlockOperation(config)) {
        this.logger.warn("Operation blocked by circuit breaker", { operationName, attempts, circuitBreakerState: this.circuitBreakerState });

        return {
          success: false,
          error: "Circuit breaker is open",
          attempts,
          totalDurationMs: Date.now() - startTime,
          lastAttemptAt: new Date(),
          circuitBreakerState: this.circuitBreakerState,
        };
      }

      try {
        this.logger.debug("Executing operation attempt", { operationName, attempt: attempts, totalAttempts: config.maxAttempts });

        const data = await operation();
        
        this.handleSuccess(config);
        this.updateMetrics(true, Date.now() - startTime);

        return {
          success: true,
          data,
          attempts,
          totalDurationMs: Date.now() - startTime,
          lastAttemptAt: new Date(),
          circuitBreakerState: this.circuitBreakerState,
        };
      } catch (error: any) {
        lastError = error;
        this.handleFailure(config);

        this.logger.warn("Operation attempt failed", {
            operationName,
            attempt: attempts,
            error: error.message,
            consecutiveFailures: this.consecutiveFailures,
            circuitBreakerState: this.circuitBreakerState,
          });

        if (attempts < config.maxAttempts) {
          const delay = this.calculateDelay(config, attempts);
          await this.delay(delay);

          this.logger.debug("Waiting before next retry attempt", { operationName, delayMs: delay, nextAttempt: attempts + 1 });
        }
      }
    }

    this.updateMetrics(false, Date.now() - startTime);

    return {
      success: false,
      error: lastError?.message || "Operation failed after all retry attempts",
      attempts,
      totalDurationMs: Date.now() - startTime,
      lastAttemptAt: new Date(),
      circuitBreakerState: this.circuitBreakerState,
    };
  }

  private shouldBlockOperation(config: RetryConfig): boolean {
    if (!config.circuitBreakerEnabled) {
      return false;
    }

    if (this.circuitBreakerState === "open") {
      if (this.circuitBreakerOpenedAt) {
        const timeSinceOpen = Date.now() - this.circuitBreakerOpenedAt.getTime();
        if (timeSinceOpen >= config.circuitBreakerResetTimeoutMs) {
          this.circuitBreakerState = "half-open";
          this.circuitBreakerOpenedAt = null;
          this.metrics.circuitBreakerResets++;
          
          this.logger.info("Circuit breaker moved to half-open state", { timeSinceOpenMs: timeSinceOpen });
        } else {
          return true;
        }
      }
    }

    return false;
  }

  private handleSuccess(config: RetryConfig): void {
    if (this.circuitBreakerState === "half-open") {
      this.circuitBreakerState = "closed";
      this.consecutiveFailures = 0;
      
      this.logger.info("Circuit breaker closed after successful operation", { consecutiveFailures: this.consecutiveFailures });
    } else {
      this.consecutiveFailures = 0;
    }
  }

  private handleFailure(config: RetryConfig): void {
    this.consecutiveFailures++;

    if (
      config.circuitBreakerEnabled &&
      this.consecutiveFailures >= config.circuitBreakerThreshold &&
      this.circuitBreakerState !== "open"
    ) {
      this.circuitBreakerState = "open";
      this.circuitBreakerOpenedAt = new Date();
      this.metrics.circuitBreakerTrips++;

      this.logger.error("Circuit breaker tripped to open state", {
          consecutiveFailures: this.consecutiveFailures,
          threshold: config.circuitBreakerThreshold,
        });
    }
  }

  private calculateDelay(config: RetryConfig, attempt: number): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(config.exponentialFactor, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

    if (!config.jitter) {
      return cappedDelay;
    }

    const jitterRange = cappedDelay * config.jitterFactor;
    const jitter = Math.random() * jitterRange - (jitterRange / 2);
    
    return Math.max(config.baseDelayMs, cappedDelay + jitter);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateMetrics(success: boolean, durationMs: number): void {
    this.metrics.totalRetries++;

    if (success) {
      this.metrics.successfulRetries++;
    } else {
      this.metrics.failedRetries++;
    }

    const totalDuration = this.metrics.averageRetryDurationMs * (this.metrics.totalRetries - 1) + durationMs;
    this.metrics.averageRetryDurationMs = totalDuration / this.metrics.totalRetries;
  }

  getMetrics(): RetryMetrics {
    return { ...this.metrics };
  }

  getCircuitBreakerState(): "closed" | "open" | "half-open" {
    return this.circuitBreakerState;
  }

  resetCircuitBreaker(): void {
    this.circuitBreakerState = "closed";
    this.consecutiveFailures = 0;
    this.circuitBreakerOpenedAt = null;
    
    this.logger.info({}, "Circuit breaker manually reset");
  }

  static createDefaultConfig(): RetryConfig {
    return {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      exponentialFactor: 2,
      jitter: true,
      jitterFactor: 0.1,
      circuitBreakerEnabled: true,
      circuitBreakerThreshold: 5,
      circuitBreakerResetTimeoutMs: 60000,
    };
  }
}