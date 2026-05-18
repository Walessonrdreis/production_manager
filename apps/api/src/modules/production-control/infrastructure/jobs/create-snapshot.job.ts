import type { FastifyInstance } from "fastify";
import { createProductionControlModule } from "@/modules/production-control";
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
 * Job: cria snapshots de controle de produção
 * - Polling dinâmico baseado em criticidade
 * - Intervalo base: 30 segundos (configurável via env)
 * - Integra com job existente de pedidos etapa 20
 * - Cria snapshot quando há novos dados disponíveis
 */
export function startCreateSnapshotJob(
  appOrLogger: FastifyInstance | LoggerLike
) {
  const log = resolveLogger(appOrLogger);

  // ✅ nunca roda em testes
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // ✅ obtém configuração do polling do ambiente
  const pollingConfigs = getPollingConfigFromEnv();
  const jobConfig = pollingConfigs["production-control-snapshot"];

  if (!jobConfig.enabled) {
    log.info({}, "production control snapshot job disabled via environment");
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
            "Fastify instance is required to run production control snapshot job"
          );
        }

        const { useCases } = createProductionControlModule(app);
        const result = await useCases.createSnapshot.execute();

        const durationMs = Date.now() - startTime;

        return {
          success: true,
          durationMs,
          data: result,
          metadata: {
            jobType: "production-control-snapshot",
            timestamp: new Date().toISOString(),
            snapshotId: result.snapshotId,
            newProducts: result.newProducts,
            updatedProducts: result.updatedProducts,
            completedProducts: result.completedProducts,
          },
        };
      } catch (err: any) {
        const durationMs = Date.now() - startTime;

        // ✅ trata erros específicos do módulo
        if (err.code === "NO_STAGE20_DATA") {
          return {
            success: false,
            durationMs,
            error: "No stage20 data available",
            metadata: {
              errorCode: err.code,
              jobType: "production-control-snapshot",
            },
          };
        }

        return {
          success: false,
          durationMs,
          error: err.message,
          metadata: {
            errorStack: err.stack,
            jobType: "production-control-snapshot",
          },
        };
      }
    },
  };

  // ✅ inicia o job com polling inteligente
  pollingService.startJob("production-control-snapshot", jobHandler).catch((error) => {
    log.error(
      { error: error.message, stack: error.stack },
      "Failed to start production control snapshot job"
    );
  });

  log.info(
    { 
      baseIntervalMs: jobConfig.baseIntervalMs,
      maxIntervalMs: jobConfig.maxIntervalMs,
      criticality: jobConfig.criticality,
      adaptivePolling: jobConfig.adaptivePolling,
    },
    "production control snapshot job started with intelligent polling"
  );

  // ✅ retorna função para parar o job
  return () => {
    pollingService.stopJob("production-control-snapshot");
    log.info({}, "production control snapshot job stopped");
  };
}