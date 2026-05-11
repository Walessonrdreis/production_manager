import { Logger } from "@/shared/logger";
import { RetrySystem, RetryConfig } from "./RetrySystem";
import { getRetryConfig } from "./retry.config";

export type PollingJobConfig = {
  name: string;
  baseIntervalMs: number;
  maxIntervalMs: number;
  criticality: "high" | "medium" | "low";
  enabled: boolean;
  adaptivePolling?: boolean;
  successThreshold?: number;
  failureThreshold?: number;
  retryConfig?: RetryConfig;
};

export type PollingJobStatus = {
  name: string;
  lastRunAt: Date | null;
  lastSuccessAt: Date | null;
  lastError: string | null;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  currentIntervalMs: number;
  isRunning: boolean;
  nextRunAt: Date | null;
  totalRuns: number;
  totalSuccesses: number;
  totalFailures: number;
  averageDurationMs: number;
  lastDurationMs: number | null;
};

export type PollingJobResult = {
  success: boolean;
  durationMs: number;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
};

export interface PollingJobHandler {
  execute(): Promise<PollingJobResult>;
}

export class IntelligentPollingService {
  private jobs = new Map<string, PollingJobConfig>();
  private status = new Map<string, PollingJobStatus>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  private logger: Logger;
  private retrySystem: RetrySystem;
  private metrics = {
    totalJobsExecuted: 0,
    totalSuccessfulJobs: 0,
    totalFailedJobs: 0,
    averageJobDurationMs: 0,
  };

  constructor(logger: Logger) {
    this.logger = logger.child ? logger.child({ service: "IntelligentPollingService" }) : logger;
    this.retrySystem = new RetrySystem(logger);
  }

  registerJob(config: PollingJobConfig): void {
    const retryConfig = config.retryConfig || getRetryConfig(config.name);
    
    const defaultConfig: PollingJobConfig = {
      adaptivePolling: true,
      successThreshold: 5,
      failureThreshold: 3,
      retryConfig,
      ...config,
    };

    this.jobs.set(config.name, defaultConfig);
    this.status.set(config.name, {
      name: config.name,
      lastRunAt: null,
      lastSuccessAt: null,
      lastError: null,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      currentIntervalMs: config.baseIntervalMs,
      isRunning: false,
      nextRunAt: null,
      totalRuns: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      averageDurationMs: 0,
      lastDurationMs: null,
    });

    this.logger.info("Job registered", { jobName: config.name });
  }

  async startJob(jobName: string, handler: PollingJobHandler): Promise<void> {
    const config = this.jobs.get(jobName);
    if (!config) {
      throw new Error(`Job ${jobName} not registered`);
    }

    if (!config.enabled) {
      this.logger.info("Job disabled, not starting", { jobName });
      return;
    }

    const jobStatus = this.status.get(jobName)!;

    const executeJob = async () => {
      if (jobStatus.isRunning) {
        this.logger.warn("Job already running, skipping", { jobName });
        return;
      }

      jobStatus.isRunning = true;
      const startTime = Date.now();

      try {
        this.logger.info("Job execution started", { jobName });

        const result = await handler.execute();

        this.updateJobMetrics(jobStatus, result, startTime);
        this.updatePollingInterval(config, jobStatus, result);

        if (result.success) {
          this.logger.info("Job execution succeeded", {
              jobName,
              durationMs: result.durationMs,
              data: result.data,
              metadata: result.metadata,
            });
        } else {
          this.logger.warn("Job execution failed", {
              jobName,
              durationMs: result.durationMs,
              error: result.error,
              metadata: result.metadata,
              consecutiveFailures: jobStatus.consecutiveFailures,
              currentIntervalMs: jobStatus.currentIntervalMs,
            });
        }

        jobStatus.lastRunAt = new Date();
      } catch (error: any) {
        this.handleJobExecutionError(jobStatus, config, error, startTime);
      } finally {
        jobStatus.isRunning = false;
        const endTime = Date.now();
        const durationMs = endTime - startTime;

        if (this.logger.debug) {
          this.logger.debug("Job execution completed", { jobName, durationMs });
        }

        this.scheduleNextRun(jobName, handler);
      }
    };

    this.scheduleNextRun(jobName, handler);
    this.logger.info("Job started", { jobName });
  }

  stopJob(jobName: string): void {
    const timeout = this.timeouts.get(jobName);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(jobName);
    }

    const jobStatus = this.status.get(jobName);
    if (jobStatus) {
      jobStatus.isRunning = false;
      jobStatus.nextRunAt = null;
    }

    this.logger.info("Job stopped", { jobName });
  }

  stopAllJobs(): void {
    for (const [jobName] of this.jobs) {
      this.stopJob(jobName);
    }

    this.logger.info("All jobs stopped");
  }

  getJobStatus(jobName: string): PollingJobStatus | null {
    return this.status.get(jobName) || null;
  }

  getAllJobStatuses(): PollingJobStatus[] {
    return Array.from(this.status.values());
  }

  private scheduleNextRun(jobName: string, handler: PollingJobHandler): void {
    const config = this.jobs.get(jobName);
    const jobStatus = this.status.get(jobName);

    if (!config || !jobStatus || !config.enabled) {
      return;
    }

    const existingTimeout = this.timeouts.get(jobName);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const nextRunInMs = jobStatus.currentIntervalMs;
    const nextRunAt = new Date(Date.now() + nextRunInMs);

    jobStatus.nextRunAt = nextRunAt;

    const timeout = setTimeout(() => {
      void this.executeJobWithRetry(jobName, handler);
    }, nextRunInMs);

    this.timeouts.set(jobName, timeout);

    if (this.logger.debug) {
      this.logger.debug("Next job run scheduled", { jobName, nextRunInMs, nextRunAt: nextRunAt.toISOString() });
    }
  }

  private async executeJobWithRetry(
    jobName: string,
    handler: PollingJobHandler
  ): Promise<void> {
    const config = this.jobs.get(jobName)!;
    const jobStatus = this.status.get(jobName)!;

    if (jobStatus.isRunning) {
      this.logger.warn("Job already running, skipping retry", { jobName });
      return;
    }

    jobStatus.isRunning = true;

    try {
      this.logger.info("Job execution with retry started", { jobName });

      let retryResult;
      
      // Se não há retry config ou maxAttempts é 0, executa diretamente
      if (!config.retryConfig || config.retryConfig.maxAttempts === 0) {
        const startTime = Date.now();
        const result = await handler.execute();
        const durationMs = Date.now() - startTime;
        
        retryResult = {
          success: result.success,
          data: result.data,
          error: result.error,
          attempts: 1,
          totalDurationMs: durationMs,
          circuitBreakerState: "closed" as const,
        };
      } else {
        // Usa o RetrySystem para tentativas com backoff
        retryResult = await this.retrySystem.executeWithRetry(
          async () => {
            const startTime = Date.now();
            const result = await handler.execute();
            const durationMs = Date.now() - startTime;
            
            return {
              ...result,
              durationMs,
            };
          },
          config.retryConfig,
          jobName
        );
      }

      if (retryResult.success) {
        jobStatus.lastSuccessAt = new Date();
        jobStatus.consecutiveFailures = 0;
        jobStatus.currentIntervalMs = config.baseIntervalMs;
        jobStatus.lastError = null;
        jobStatus.totalRuns++;
        jobStatus.totalSuccesses++;
        jobStatus.lastDurationMs = retryResult.totalDurationMs;

        this.metrics.totalJobsExecuted++;
        this.metrics.totalSuccessfulJobs++;

        this.logger.info("Job execution with retry succeeded", {
            jobName,
            durationMs: retryResult.totalDurationMs,
            attempts: retryResult.attempts,
            data: retryResult.data,
          });
      } else {
        jobStatus.consecutiveFailures++;
        jobStatus.lastError = retryResult.error || "Unknown error";
        jobStatus.totalRuns++;
        jobStatus.totalFailures++;
        jobStatus.lastDurationMs = retryResult.totalDurationMs;

        this.metrics.totalJobsExecuted++;
        this.metrics.totalFailedJobs++;

        const newInterval = this.calculateBackoffInterval(
          config.baseIntervalMs,
          config.maxIntervalMs,
          jobStatus.consecutiveFailures
        );
        jobStatus.currentIntervalMs = newInterval;

        this.logger.warn("Job execution with retry failed", {
            jobName,
            durationMs: retryResult.totalDurationMs,
            attempts: retryResult.attempts,
            error: retryResult.error,
            consecutiveFailures: jobStatus.consecutiveFailures,
            newIntervalMs: newInterval,
            circuitBreakerState: retryResult.circuitBreakerState,
          });
      }

      jobStatus.lastRunAt = new Date();
    } catch (error: any) {
      jobStatus.consecutiveFailures++;
      jobStatus.lastError = error.message;
      jobStatus.totalRuns++;
      jobStatus.totalFailures++;

      this.metrics.totalJobsExecuted++;
      this.metrics.totalFailedJobs++;

      const newInterval = this.calculateBackoffInterval(
        config.baseIntervalMs,
        config.maxIntervalMs,
        jobStatus.consecutiveFailures
      );
      jobStatus.currentIntervalMs = newInterval;

      this.logger.error("Job execution with retry threw unexpected error", {
          jobName,
          error: error.message,
          stack: error.stack,
          consecutiveFailures: jobStatus.consecutiveFailures,
          newIntervalMs: newInterval,
        });
    } finally {
      jobStatus.isRunning = false;

      if (this.logger.debug) {
        this.logger.debug("Job execution with retry completed", { jobName });
      }

      this.scheduleNextRun(jobName, handler);
    }
  }

  private updateJobMetrics(
    jobStatus: PollingJobStatus,
    result: PollingJobResult,
    startTime: number
  ): void {
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    jobStatus.totalRuns++;
    jobStatus.lastDurationMs = durationMs;

    if (result.success) {
      jobStatus.lastSuccessAt = new Date();
      jobStatus.consecutiveSuccesses++;
      jobStatus.consecutiveFailures = 0;
      jobStatus.totalSuccesses++;
      jobStatus.lastError = null;

      this.metrics.totalSuccessfulJobs++;
    } else {
      jobStatus.consecutiveFailures++;
      jobStatus.consecutiveSuccesses = 0;
      jobStatus.totalFailures++;
      jobStatus.lastError = result.error || "Unknown error";

      this.metrics.totalFailedJobs++;
    }

    this.metrics.totalJobsExecuted++;
    
    const totalDuration = jobStatus.averageDurationMs * (jobStatus.totalRuns - 1) + durationMs;
    jobStatus.averageDurationMs = totalDuration / jobStatus.totalRuns;

    const globalTotalDuration = this.metrics.averageJobDurationMs * (this.metrics.totalJobsExecuted - 1) + durationMs;
    this.metrics.averageJobDurationMs = globalTotalDuration / this.metrics.totalJobsExecuted;
  }

  private updatePollingInterval(
    config: PollingJobConfig,
    jobStatus: PollingJobStatus,
    result: PollingJobResult
  ): void {
    if (!config.adaptivePolling) {
      return;
    }

    if (result.success) {
      if (jobStatus.consecutiveSuccesses >= (config.successThreshold || 5)) {
        const reducedInterval = Math.max(
          config.baseIntervalMs * 0.5,
          config.baseIntervalMs * 0.8
        );
        jobStatus.currentIntervalMs = reducedInterval;
        
        this.logger.info("Reduced polling interval due to consistent success", { 
            jobName: jobStatus.name,
            newIntervalMs: reducedInterval,
            consecutiveSuccesses: jobStatus.consecutiveSuccesses
          });
      } else {
        jobStatus.currentIntervalMs = config.baseIntervalMs;
      }
    } else {
      const newInterval = this.calculateBackoffInterval(
        config.baseIntervalMs,
        config.maxIntervalMs,
        jobStatus.consecutiveFailures
      );
      jobStatus.currentIntervalMs = newInterval;

      if (jobStatus.consecutiveFailures >= (config.failureThreshold || 3)) {
        this.logger.warn("Increased polling interval due to consecutive failures", { 
            jobName: jobStatus.name,
            newIntervalMs: newInterval,
            consecutiveFailures: jobStatus.consecutiveFailures
          });
      }
    }
  }

  private handleJobExecutionError(
    jobStatus: PollingJobStatus,
    config: PollingJobConfig,
    error: any,
    startTime: number
  ): void {
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    jobStatus.totalRuns++;
    jobStatus.totalFailures++;
    jobStatus.lastDurationMs = durationMs;
    jobStatus.consecutiveFailures++;
    jobStatus.consecutiveSuccesses = 0;
    jobStatus.lastError = error.message;

    this.metrics.totalJobsExecuted++;
    this.metrics.totalFailedJobs++;

    const newInterval = this.calculateBackoffInterval(
      config.baseIntervalMs,
      config.maxIntervalMs,
      jobStatus.consecutiveFailures
    );
    jobStatus.currentIntervalMs = newInterval;

    this.logger.error("Job execution threw unexpected error", {
        jobName: jobStatus.name,
        error: error.message,
        stack: error.stack,
        durationMs,
        consecutiveFailures: jobStatus.consecutiveFailures,
        newIntervalMs: newInterval,
      });
  }

  private calculateBackoffInterval(
    baseIntervalMs: number,
    maxIntervalMs: number,
    consecutiveFailures: number
  ): number {
    if (consecutiveFailures === 0) {
      return baseIntervalMs;
    }

    const backoffFactor = Math.pow(2, Math.min(consecutiveFailures - 1, 10));
    const calculatedInterval = baseIntervalMs * backoffFactor;

    return Math.min(calculatedInterval, maxIntervalMs);
  }

  getRetryMetrics() {
    return this.retrySystem.getMetrics();
  }

  getRetryCircuitBreakerState(jobName: string) {
    return this.retrySystem.getCircuitBreakerState();
  }

  getServiceMetrics() {
    return { ...this.metrics };
  }
}