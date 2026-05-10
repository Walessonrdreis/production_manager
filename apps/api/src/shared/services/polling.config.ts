import { PollingJobConfig } from "./IntelligentPollingService";

export const DEFAULT_POLLING_CONFIGS: Record<string, PollingJobConfig> = {
  "omie-production-orders-sync": {
    name: "omie-production-orders-sync",
    baseIntervalMs: 30 * 1000, // 30 segundos
    maxIntervalMs: 5 * 60 * 1000, // 5 minutos
    criticality: "high",
    enabled: true,
  },
  "omie-orders-stage20-sync": {
    name: "omie-orders-stage20-sync",
    baseIntervalMs: 60 * 1000, // 1 minuto
    maxIntervalMs: 10 * 60 * 1000, // 10 minutos
    criticality: "high",
    enabled: true,
  },
  "stock-monitor": {
    name: "stock-monitor",
    baseIntervalMs: 2 * 60 * 1000, // 2 minutos
    maxIntervalMs: 30 * 60 * 1000, // 30 minutos
    criticality: "medium",
    enabled: true,
  },
  "omie-product-sync": {
    name: "omie-product-sync",
    baseIntervalMs: 5 * 60 * 1000, // 5 minutos
    maxIntervalMs: 60 * 60 * 1000, // 60 minutos
    criticality: "medium",
    enabled: true,
  },
  "stock-refresh": {
    name: "stock-refresh",
    baseIntervalMs: 10 * 60 * 1000, // 10 minutos
    maxIntervalMs: 120 * 60 * 1000, // 120 minutos
    criticality: "low",
    enabled: true,
  },
};

export function getPollingConfigFromEnv(): Record<string, PollingJobConfig> {
  const configs: Record<string, PollingJobConfig> = {};

  for (const [key, defaultConfig] of Object.entries(DEFAULT_POLLING_CONFIGS)) {
    const envKey = key.toUpperCase().replace(/-/g, "_");
    
    const enabledEnv = process.env[`${envKey}_ENABLED`];
    const baseIntervalEnv = process.env[`${envKey}_BASE_INTERVAL_MS`];
    const maxIntervalEnv = process.env[`${envKey}_MAX_INTERVAL_MS`];

    const enabled = enabledEnv 
      ? enabledEnv.toLowerCase() === "true" || enabledEnv === "1"
      : defaultConfig.enabled;

    const baseIntervalMs = baseIntervalEnv 
      ? (() => {
          const parsed = parseInt(baseIntervalEnv, 10);
          return isNaN(parsed) || parsed <= 0 ? defaultConfig.baseIntervalMs : parsed;
        })()
      : defaultConfig.baseIntervalMs;

    const maxIntervalMs = maxIntervalEnv 
      ? (() => {
          const parsed = parseInt(maxIntervalEnv, 10);
          return isNaN(parsed) || parsed <= 0 ? defaultConfig.maxIntervalMs : parsed;
        })()
      : defaultConfig.maxIntervalMs;

    configs[key] = {
      ...defaultConfig,
      enabled,
      baseIntervalMs,
      maxIntervalMs,
    };
  }

  return configs;
}

export function validatePollingConfig(config: PollingJobConfig): string[] {
  const errors: string[] = [];

  if (config.baseIntervalMs <= 0) {
    errors.push(`baseIntervalMs must be positive for job ${config.name}`);
  }

  if (config.maxIntervalMs <= 0) {
    errors.push(`maxIntervalMs must be positive for job ${config.name}`);
  }

  if (config.baseIntervalMs > config.maxIntervalMs) {
    errors.push(`baseIntervalMs cannot be greater than maxIntervalMs for job ${config.name}`);
  }

  if (!["high", "medium", "low"].includes(config.criticality)) {
    errors.push(`criticality must be one of: high, medium, low for job ${config.name}`);
  }

  return errors;
}