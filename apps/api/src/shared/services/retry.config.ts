import { RetryConfig, RetrySystem } from "./RetrySystem";

export type RetryConfigMap = Record<string, RetryConfig>;

export const DEFAULT_RETRY_CONFIGS: RetryConfigMap = {
  "omie-production-orders-sync": {
    maxAttempts: 2,
    baseDelayMs: 3000,
    maxDelayMs: 10000,
    exponentialFactor: 2,
    jitter: true,
    jitterFactor: 0.2,
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 3,
    circuitBreakerResetTimeoutMs: 60000,
  },
  "omie-orders-stage20-sync": {
    maxAttempts: 2,
    baseDelayMs: 3000,
    maxDelayMs: 10000,
    exponentialFactor: 2,
    jitter: true,
    jitterFactor: 0.2,
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 3,
    circuitBreakerResetTimeoutMs: 60000,
  },
  "stock-monitor": {
    maxAttempts: 2,
    baseDelayMs: 5000,
    maxDelayMs: 15000,
    exponentialFactor: 2,
    jitter: true,
    jitterFactor: 0.2,
    circuitBreakerEnabled: true,
    circuitBreakerThreshold: 3,
    circuitBreakerResetTimeoutMs: 60000,
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
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Determina se um erro deve ser retentado com base em sua natureza
 * Retry apenas para erros transitórios:
 * - Timeout (ETIMEDOUT)
 * - Conexão resetada (ECONNRESET)
 * - Rate limit (429)
 * - Erros de servidor (5xx)
 * 
 * NÃO retry para:
 * - Erros de cliente (400, 401, 403, 404)
 * - Erros de validação
 * - Erros de autorização
 */
export function shouldRetry(error: any): boolean {
  const status = error?.response?.status;
  const code = error?.code;
  
  // Erros de rede/timeout
  if (code === "ETIMEDOUT" || code === "ECONNRESET") {
    return true;
  }
  
  // Rate limit
  if (status === 429) {
    return true;
  }
  
  // Erros de servidor (5xx)
  if (status >= 500 && status < 600) {
    return true;
  }
  
  // NÃO retry para erros de cliente
  if (status >= 400 && status < 500) {
    return false;
  }
  
  // Por padrão, não retentar para outros tipos de erro
  return false;
}

export function getRetryConfig(jobName: string): RetryConfig {
  const envPrefix = `RETRY_${jobName.toUpperCase().replace(/-/g, "_")}_`;
  
  // Proteção para job desconhecido
  if (!DEFAULT_RETRY_CONFIGS[jobName]) {
    console.warn(`RetryConfig não encontrado para ${jobName}, usando configuração default`);
  }
  
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