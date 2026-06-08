import type { FastifyInstance } from "fastify";
import cron from "node-cron";
import { AppError } from "@/shared/errors";
import { createOmieSalesOrdersModule } from "@/modules/legacy/omie-sales-orders";

// ✅ NOVO: automação pós-sync (clientes faltantes + backfill de nomes)
// (ajuste os imports se seus caminhos forem ligeiramente diferentes)
import { createSyncMissingClientsUseCase } from "@/modules/legacy/client/application/use-cases/sync-missing-clients.usecase";
import { backfillOrderClientNames } from "@/modules/legacy/omie-sales-orders/application/use-cases/backfill-order-client-names.usecase";

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
 * Job: sincroniza pedidos Omie etapa 20 usando cron simples
 * - Executa automaticamente conforme cron configurado
 * - Sem polling inteligente que sobrecarrega
 * - Mantém funcionalidade de sincronização
 *
 * ✅ AUTOMATIZAÇÃO (novo):
 * após sincronizar orders:
 * - sincroniza clientes faltantes referenciados nas orders
 * - faz backfill de clientLegalName/clientTradeName/clientName nas orders
 */
export function startOmieOrdersStage20SyncJob(
  appOrLogger: FastifyInstance | LoggerLike
) {
  const log = resolveLogger(appOrLogger);

  // ✅ nunca roda em testes
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // ✅ flag de ativação
  const enabledValue = String(process.env.OMIE_ORDERS_STAGE_SYNC ?? "")
    .trim()
    .toLowerCase();

  const enabled = enabledValue === "true" || enabledValue === "1";
  if (!enabled) {
    log.info({}, "omie orders stage20 sync job disabled via environment");
    return;
  }

  // ✅ cron configurável
  const cronExpr =
    String(process.env.OMIE_ORDERS_STAGE20_CRON ?? "").trim() || "*/10 * * * *";

  const effectiveCronExpr = cron.validate(cronExpr) ? cronExpr : "*/10 * * * *";

  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "omie orders stage20 sync job: invalid cron expr, falling back to */10 * * * *"
    );
  }

  log.info(
    { cronExpr: effectiveCronExpr },
    "omie orders stage20 sync job scheduled"
  );

  let inFlight = false;

  const tick = async () => {
    if (inFlight) {
      log.warn(
        {},
        "omie orders stage20 sync skipped (previous run still in progress)"
      );
      return;
    }

    inFlight = true;
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

      // ✅ 1) Sync stage20 orders (Omie -> DB)
      const { useCases: omieUseCases } = createOmieSalesOrdersModule(app);
      const syncResult = await omieUseCases.syncStage20Orders.execute();

      // ✅ 2) Sync missing clients (referenced by orders but absent in 'clientes')
      // Usa DI do Fastify (decorations já existentes no registerClientModule)
      const clientRepository = (app as any).clientRepository;
      const omieClientGateway = (app as any).omieClientGateway;

      let missingClientsResult: any = null;
      if (clientRepository && omieClientGateway) {
        const syncMissingClients = createSyncMissingClientsUseCase({
          clientRepository,
          omieClientGateway,
        });

        missingClientsResult = await syncMissingClients.execute();
      } else {
        missingClientsResult = {
          ok: false,
          reason: "CLIENT_DEPS_NOT_AVAILABLE",
          message:
            "clientRepository/omieClientGateway not decorated on Fastify instance",
        };
      }

      // ✅ 3) Backfill order client names (DB-only, no Omie)
      const backfillResult = await backfillOrderClientNames();

      const durationMs = Date.now() - startTime;

      log.info(
        { durationMs, syncResult, missingClientsResult, backfillResult },
        "omie orders stage20 sync + client reconciliation completed"
      );
    } catch (err: any) {
      const durationMs = Date.now() - startTime;

      if (err instanceof AppError && err.code === "SYNC_IN_PROGRESS") {
        log.warn(
          { durationMs, errorCode: err.code },
          "omie orders stage20 sync skipped (already in progress)"
        );
      } else {
        log.error(
          { durationMs, error: err?.message, stack: err?.stack },
          "omie orders stage20 sync failed"
        );
      }
    } finally {
      inFlight = false;
    }
  };

  // ✅ Agenda execução com cron simples
  const scheduledJob = cron.schedule(effectiveCronExpr, tick, {
    timezone: "America/Sao_Paulo",
  });

  // ✅ Retorna função para parar o job
  return () => {
    scheduledJob.stop();
    log.info({}, "omie orders stage20 sync job stopped");
  };
}