import { RetryConfig, RetrySystem } from "./RetrySystem";

export type RetryConfigMap = Record<string, RetryConfig>;

export const DEFAULT_RETRY_CONFIGS: RetryConfigMap = {
  "omie-production-orders-sync": {
    maxAttempts: 3,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    exponentialFactor: 2,
    jitter: true,
    jitterFactor: 0.1,
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 3,
    circuitBreakerResetTimeoutMs: 60000,
  },
  "omie-orders-stage20-sync": {
    maxAttempts: 3,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    exponentialFactor: 2,
    jitter: true,
    jitterFactor: 0.1,
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 3,
    circuitBreakerResetTimeoutMs: 60000,
  },
  "stock-monitor": {
    maxAttempts: 2,
    baseDelayMs: 5000,
    maxDelayMs: 60000,
    exponentialFactor: 2,
    jitter: true,
    jitterFactor: 0.2,
    circuitBreakerEnabled: false,
    circuitBreakerThreshold: 5,
    circuitBreakerResetTimeoutMs: 120000,
  },
};

function safeParseInt(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
}

function safeParseFloat(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
}

export function getRetryConfig(jobName: string): RetryConfig {
  const envPrefix = `RETRY_${jobName.toUpperCase().replace(/-/g, "_")}_`;
  
  const config = DEFAULT_RETRY_CONFIGS[jobName] || RetrySystem.createDefaultConfig();

  return {
    maxAttempts: safeParseInt(process.env[`${envPrefix}MAX_ATTEMPTS`], config.maxAttempts),
    baseDelayMs: safeParseInt(process.env[`${envPrefix}BASE_DELAY_MS`], config.baseDelayMs),
    maxDelayMs: safeParseInt(process.env[`${envPrefix}MAX_DELAY_MS`], config.maxDelayMs),
    exponentialFactor: safeParseFloat(process.env[`${envPrefix}EXPONENTIAL_FACTOR`], config.exponentialFactor),
    jitter: process.env[`${envPrefix}JITTER`] ? process.env[`${envPrefix}JITTER`] === "true" : config.jitter,
    jitterFactor: safeParseFloat(process.env[`${envPrefix}JITTER_FACTOR`], config.jitterFactor),
    circuitBreakerEnabled: process.env[`${envPrefix}CIRCUIT_BREAKER_ENABLED`] 
      ? process.env[`${envPrefix}CIRCUIT_BREAKER_ENABLED`] === "true" 
      : config.circuitBreakerEnabled,
    circuitBreakerThreshold: safeParseInt(process.env[`${envPrefix}CIRCUIT_BREAKER_THRESHOLD`], config.circuitBreakerThreshold),
    circuitBreakerResetTimeoutMs: safeParseInt(process.env[`${envPrefix}CIRCUIT_BREAKER_RESET_TIMEOUT_MS`], config.circuitBreakerResetTimeoutMs),
  };
}

export function getAllRetryConfigs(): RetryConfigMap {
  const configs: RetryConfigMap = {};

  for (const jobName in DEFAULT_RETRY_CONFIGS) {
    configs[jobName] = getRetryConfig(jobName);
  }

  return configs;
}