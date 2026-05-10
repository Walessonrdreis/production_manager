import type { FastifyInstance } from "fastify";
import { AppError } from "@/shared/errors";
import { createOmieSalesOrdersModule } from "@/modules/omie-sales-orders";
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
 * Job: sincroniza pedidos Omie etapa 20 usando IntelligentPollingService
 * - Polling dinâmico baseado em criticidade
 * - Intervalo base: 1 minuto (configurável via env)
 * - Backoff exponencial em caso de falhas
 * - Polling adaptativo baseado em sucessos consecutivos
 */
export function startOmieOrdersStage20SyncJob(
  appOrLogger: FastifyInstance | LoggerLike
) {
  const log = resolveLogger(appOrLogger);

  // ✅ nunca roda em testes
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // ✅ obtém configuração do polling do ambiente
  const pollingConfigs = getPollingConfigFromEnv();
  const jobConfig = pollingConfigs["omie-orders-stage20-sync"];

  if (!jobConfig.enabled) {
    log.info({}, "omie orders stage20 sync job disabled via environment");
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
            "Fastify instance is required to run Omie Orders Stage20 job"
          );
        }

        const { useCases } = createOmieSalesOrdersModule(app);
        const result = await useCases.syncStage20Orders.execute();

        const durationMs = Date.now() - startTime;

        return {
          success: true,
          durationMs,
          data: result,
          metadata: {
            syncType: "orders-stage20",
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
              syncType: "orders-stage20",
            },
          };
        }

        return {
          success: false,
          durationMs,
          error: err.message,
          metadata: {
            errorStack: err.stack,
            syncType: "orders-stage20",
          },
        };
      }
    },
  };

  // ✅ inicia o job com polling inteligente
  pollingService.startJob("omie-orders-stage20-sync", jobHandler).catch((error) => {
    log.error(
      { error: error.message, stack: error.stack },
      "Failed to start omie orders stage20 sync job"
    );
  });

  log.info(
    { 
      baseIntervalMs: jobConfig.baseIntervalMs,
      maxIntervalMs: jobConfig.maxIntervalMs,
      criticality: jobConfig.criticality,
      adaptivePolling: jobConfig.adaptivePolling,
    },
    "omie orders stage20 sync job started with intelligent polling"
  );

  // ✅ retorna função para parar o job
  return () => {
    pollingService.stopJob("omie-orders-stage20-sync");
    log.info({}, "omie orders stage20 sync job stopped");
  };
}