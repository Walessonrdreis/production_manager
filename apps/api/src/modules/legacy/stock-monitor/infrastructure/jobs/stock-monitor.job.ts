import type { FastifyInstance } from "fastify";
import cron from "node-cron";
import { createProductsModule } from "@/modules/legacy/products";

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
 * Job: monitoramento de estoque
 * - Execução periódica via cron
 * - Detecção de estoque crítico
 * - Retry controlado em caso de falhas
 * - Execução única por job
 */
export function startStockMonitorJob(
  appOrLogger: FastifyInstance | LoggerLike
) {
  const log = resolveLogger(appOrLogger);

  // ✅ nunca roda em testes
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // ✅ flag de ativação
  const enabledValue = String(
    process.env.ENABLE_STOCK_MONITOR_JOB ?? ""
  )
    .trim()
    .toLowerCase();

  const enabled = enabledValue === "true" || enabledValue === "1";
  if (!enabled) {
    log.info({}, "stock monitor job disabled");
    return;
  }

  // ✅ cron configurável
  const cronExpr =
    String(process.env.STOCK_MONITOR_CRON ?? "").trim() ||
    "*/2 * * * *";

  const effectiveCronExpr = cron.validate(cronExpr)
    ? cronExpr
    : "*/2 * * * *";

  if (effectiveCronExpr !== cronExpr) {
    log.warn(
      { cronExpr },
      "stock monitor job: invalid cron expr, falling back to */2 * * * *"
    );
  }

  log.info(
    { cronExpr: effectiveCronExpr },
    "stock monitor job scheduled"
  );

  let inFlight = false;

  const tick = async () => {
    if (inFlight) {
      log.warn(
        {},
        "stock monitor job skipped (previous run still in progress)"
      );
      return;
    }

    inFlight = true;
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();

    log.info({ startedAt: startedAtIso }, "stock monitor job started");

    try {
      // ✅ obtém instância do Fastify se disponível
      const app =
        "decorate" in (appOrLogger as any)
          ? (appOrLogger as FastifyInstance)
          : null;

      if (!app) {
        throw new Error(
          "Fastify instance is required to run Stock Monitor job"
        );
      }

      // ✅ obtém módulo de produtos
      const { useCases } = createProductsModule(app);

      // ✅ executa refresh de estoque para obter dados atualizados
      const refreshResult = await useCases.refreshStock.execute();

      // ✅ obtém produtos com estoque crítico
      const criticalStock = await checkCriticalStock(app);

      const durationMs = Date.now() - startedAt;

      log.info(
        {
          startedAt: startedAtIso,
          finishedAt: new Date().toISOString(),
          durationMs,
          criticalItemsCount: criticalStock.length,
          refreshSuccess: refreshResult.success,
        },
        "stock monitor job finished"
      );
    } catch (err: any) {
      log.error(
        { err, stack: err?.stack, startedAt: startedAtIso },
        "stock monitor job failed"
      );
    } finally {
      inFlight = false;
    }
  };

  const task = cron.schedule(effectiveCronExpr, tick, {
    scheduled: true,
    timezone: "America/Sao_Paulo",
  });

  // ✅ permite parar o job (shutdown)
  return () => task.stop();
}

/**
 * Verifica estoque crítico baseado em regras de negócio
 */
async function checkCriticalStock(app: FastifyInstance): Promise<any[]> {
  const { useCases } = createProductsModule(app);

  try {
    // ✅ obtém todos os produtos com estoque
    const products = await useCases.listProducts.execute({
      page: 1,
      pageSize: 1000,
    });

    // ✅ filtra produtos com estoque crítico
    const criticalProducts = products.items.filter((product: any) => {
      // Regras de estoque crítico:
      // 1. Estoque atual <= estoque mínimo
      // 2. Estoque atual <= 10% do estoque máximo (se definido)
      // 3. Produto com consumo anormal (a ser implementado)

      const currentStock = product.stock?.current || 0;
      const minStock = product.stock?.min || 0;
      const maxStock = product.stock?.max || 0;

      // Regra 1: Estoque abaixo do mínimo
      if (currentStock <= minStock) {
        return true;
      }

      // Regra 2: Estoque abaixo de 10% do máximo (se máximo definido)
      if (maxStock > 0 && currentStock <= maxStock * 0.1) {
        return true;
      }

      return false;
    });

    return criticalProducts;
  } catch (error) {
    app.log.error(
      { error: error instanceof Error ? error.message : String(error) },
      "Failed to check critical stock"
    );
    return [];
  }
}

/**
 * Analisa consumo de produtos para detectar anomalias
 */
async function analyzeConsumptionPatterns(app: FastifyInstance): Promise<any> {
  // ✅ implementação futura: análise de consumo para detectar:
  // 1. Consumo acima da média histórica
  // 2. Tendência de aumento de consumo
  // 3. Sazonalidade

  return {
    analysisComplete: false,
    message: "Consumption analysis to be implemented",
  };
}

/**
 * Gera alertas para estoque crítico
 */
async function generateStockAlerts(
  app: FastifyInstance,
  criticalProducts: any[]
): Promise<void> {
  if (criticalProducts.length === 0) {
    return;
  }

  app.log.warn(
    { criticalProductsCount: criticalProducts.length },
    "Critical stock detected"
  );

  // ✅ implementação futura: enviar alertas para:
  // 1. Sistema de notificações
  // 2. Dashboard em tempo real
  // 3. Email/SMS para responsáveis

  // Log detalhado dos produtos críticos
  criticalProducts.forEach((product) => {
    app.log.warn(
      {
        productCode: product.code,
        productName: product.name,
        currentStock: product.stock?.current || 0,
        minStock: product.stock?.min || 0,
        maxStock: product.stock?.max || 0,
      },
      "Critical stock item"
    );
  });
}