import type { FastifyInstance } from "fastify";
import { AppError } from "@/shared/errors";
import { createOmieProductionOrdersModule } from "@/modules/omie-production-orders";
import { IntelligentPollingService, PollingJobHandler } from "@/shared/services/IntelligentPollingService";
import { getPollingConfigFromEnv } from "@/shared/services/polling.config";

type LoggerLike = {
  info: (obj: any, msg?: string) => void;
  warn: (obj: any, msg?: string) => void;
  error: (obj: any, msg?: string) => void;
};

function resolveLogger(input: FastifyInstance | LoggerLike): LoggerLike {
  const maybeFastify = input as FastifyInstance;
  const maybeLogger = input as LoggerLike;

  if (maybeFastify && typeof (maybeFastify as any).log?.info === "function") {
    return (maybeFastify as any).log as LoggerLike;
  }

  return maybeLogger;
}

/**
 * Job: synchronizes Omie production orders usando IntelligentPollingService
 * - Polling dinâmico baseado em criticidade
 * - Intervalo base: 30 segundos (configurável via env)
 * - Backoff exponencial em caso de falhas
 * - Polling adaptativo baseado em sucessos consecutivos
 */
export function startOmieProductionOrdersSyncJob(
  appOrLogger: FastifyInstance | LoggerLike
) {
  const log = resolveLogger(appOrLogger);

  // ✅ nunca roda em testes
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // ✅ obtém configuração do polling do ambiente
  const pollingConfigs = getPollingConfigFromEnv();
  const jobConfig = pollingConfigs["omie-production-orders-sync"];

  if (!jobConfig.enabled) {
    log.info({}, "omie production orders sync job disabled via environment");
    return;
  }

  // ✅ cria serviço de polling inteligente
  const pollingService = new IntelligentPollingService(log);

  // ✅ registra o job no serviço de polling
  pollingService.registerJob(jobConfig);

  // ✅ handler para execução do job
  const jobHandler: PollingJobHandler = {
    execute: async () => {
      const startTime = Date.now();

      try {
        // ✅ obtém instância do Fastify se disponível
        const app =
          "decorate" in (appOrLogger as any)
            ? (appOrLogger as FastifyInstance)
            : null;

        if (!app) {
          throw new Error(
            "Fastify instance is required to run Omie Production Orders job"
          );
        }

        const { useCases } = createOmieProductionOrdersModule(app);
        const result = await useCases.syncProductionOrders.execute();

        const durationMs = Date.now() - startTime;

        return {
          success: true,
          durationMs,
          data: result,
          metadata: {
            syncType: "production-orders",
            timestamp: new Date().toISOString(),
          },
        };
      } catch (err: any) {
        const durationMs = Date.now() - startTime;

        if (err instanceof AppError && err.code === "SYNC_IN_PROGRESS") {
          return {
            success: false,
            durationMs,
            error: "Sync already in progress",
            metadata: {
              errorCode: err.code,
              syncType: "production-orders",
            },
          };
        }

        return {
          success: false,
          durationMs,
          error: err.message,
          metadata: {
            errorStack: err.stack,
            syncType: "production-orders",
          },
        };
      }
    },
  };

  // ✅ inicia o job com polling inteligente
  pollingService.startJob("omie-production-orders-sync", jobHandler).catch((error) => {
    log.error(
      { error: error.message, stack: error.stack },
      "Failed to start omie production orders sync job"
    );
  });

  log.info(
    { 
      baseIntervalMs: jobConfig.baseIntervalMs,
      maxIntervalMs: jobConfig.maxIntervalMs,
      criticality: jobConfig.criticality,
      adaptivePolling: jobConfig.adaptivePolling,
    },
    "omie production orders sync job started with intelligent polling"
  );

  // ✅ retorna função para parar o job
  return () => {
    pollingService.stopJob("omie-production-orders-sync");
    log.info({}, "omie production orders sync job stopped");
  };
}