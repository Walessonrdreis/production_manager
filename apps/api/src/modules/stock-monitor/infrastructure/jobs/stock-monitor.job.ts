import type { FastifyInstance } from "fastify";
import { IntelligentPollingService, PollingJobHandler } from "@/shared/services/IntelligentPollingService";
import { getPollingConfigFromEnv } from "@/shared/services/polling.config";
import { createProductsModule } from "@/modules/products";

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
 * Job: monitoramento inteligente de estoque
 * - Polling dinâmico baseado em criticidade
 * - Intervalo base: 2 minutos (configurável via env)
 * - Detecção de estoque crítico
 * - Backoff exponencial em caso de falhas
 * - Polling adaptativo baseado em sucessos consecutivos
 */
export function startStockMonitorJob(
  appOrLogger: FastifyInstance | LoggerLike
) {
  const log = resolveLogger(appOrLogger);

  // ✅ nunca roda em testes
  if (process.env.NODE_ENV === "test") {
    return;
  }

  // ✅ obtém configuração do polling do ambiente
  const pollingConfigs = getPollingConfigFromEnv();
  const jobConfig = pollingConfigs["stock-monitor"];

  if (!jobConfig.enabled) {
    log.info({}, "stock monitor job disabled via environment");
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
            "Fastify instance is required to run Stock Monitor job"
          );
        }

        // ✅ obtém módulo de produtos
        const { useCases } = createProductsModule(app);

        // ✅ executa refresh de estoque para obter dados atualizados
        const refreshResult = await useCases.refreshStock.execute();

        // ✅ obtém produtos com estoque crítico
        const criticalStock = await this.checkCriticalStock(app);

        const durationMs = Date.now() - startTime;

        return {
          success: true,
          durationMs,
          data: {
            refreshResult,
            criticalStock,
            timestamp: new Date().toISOString(),
          },
          metadata: {
            jobType: "stock-monitor",
            criticalItemsCount: criticalStock.length,
            refreshSuccess: refreshResult.success,
          },
        };
      } catch (err: any) {
        const durationMs = Date.now() - startTime;

        return {
          success: false,
          durationMs,
          error: err.message,
          metadata: {
            errorStack: err.stack,
            jobType: "stock-monitor",
            timestamp: new Date().toISOString(),
          },
        };
      }
    },
  };

  // ✅ inicia o job com polling inteligente
  pollingService.startJob("stock-monitor", jobHandler).catch((error) => {
    log.error(
      { error: error.message, stack: error.stack },
      "Failed to start stock monitor job"
    );
  });

  log.info(
    { 
      baseIntervalMs: jobConfig.baseIntervalMs,
      maxIntervalMs: jobConfig.maxIntervalMs,
      criticality: jobConfig.criticality,
      adaptivePolling: jobConfig.adaptivePolling,
    },
    "stock monitor job started with intelligent polling"
  );

  // ✅ retorna função para parar o job
  return () => {
    pollingService.stopJob("stock-monitor");
    log.info({}, "stock monitor job stopped");
  };
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