// src/shared/infra/job-queue/integration.worker.ts
// Worker centralizado de integração — registra handlers de todos os módulos
// e processa jobs com concorrência e rate-limit globais.
//
// Uso no bootstrap:
//   const boss = await startJobQueue();
//   registerJobHandler("product-catalog.sync", handleSync);
//   await startWorker(boss);

import { PgBoss } from "pg-boss";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import type { JobHandler } from "./pgboss-queue";

const logger = getLogger("integration-worker");

// ─── Registry ────────────────────────────────────────────────────────

type HandlerEntry = {
    type: string;
    handler: JobHandler;
    options?: {
        /** Concorrência máxima para este tipo de job (padrão: 1) */
        concurrency?: number;
        /** Tamanho do lote na polling (padrão: 1) */
        batchSize?: number;
    };
};

const handlers: HandlerEntry[] = [];
let workerStarted = false;

/**
 * Registra um handler para um tipo de job.
 * Chamado por cada módulo durante o bootstrap (antes de startWorker).
 */
export function registerJobHandler<T = unknown>(
    type: string,
    handler: JobHandler<T>,
    options?: { concurrency?: number; batchSize?: number }
): void {
    if (workerStarted) {
        throw new Error(
            `Cannot register handler for "${type}" after worker has started`
        );
    }
    handlers.push({ type, handler: handler as JobHandler, options });
    logger.info({ msg: "Job handler registered", type });
}

/**
 * Inicia o worker: registra todos os handlers no PgBoss e começa a processar.
 * Deve ser chamado UMA vez durante o bootstrap, após todos os módulos
 * terem registrado seus handlers.
 */
export async function startWorker(boss: PgBoss): Promise<void> {
    if (workerStarted) {
        logger.warn("Worker already started, skipping");
        return;
    }

    if (handlers.length === 0) {
        logger.warn("No job handlers registered, worker will not process any jobs");
    }

    for (const entry of handlers) {
        const localConcurrency = entry.options?.concurrency ?? env.PG_BOSS_CONCURRENCY;

        // Cria a fila explicitamente antes de se inscrever (PgBoss v12+)
        await boss.createQueue(entry.type);

        await boss.work(entry.type, {
            localConcurrency,
            pollingIntervalSeconds: env.PG_BOSS_SCHEDULE_INTERVAL,
            batchSize: entry.options?.batchSize ?? 1,
        }, async (jobs) => {
            for (const job of jobs) {
                const startTime = Date.now();
                const externalRequestId =
                    (job.data as any)?.externalRequestId ?? "unknown";

                logger.debug({
                    msg: "job.start",
                    jobId: job.id,
                    type: entry.type,
                    externalRequestId,
                });

                try {
                    await entry.handler({
                        id: job.id,
                        data: job.data,
                    });

                    logger.debug({
                        msg: "job.success",
                        jobId: job.id,
                        type: entry.type,
                        externalRequestId,
                        durationMs: Date.now() - startTime,
                    });
                } catch (error) {
                    logger.warn({
                        msg: "job.fail",
                        jobId: job.id,
                        type: entry.type,
                        externalRequestId,
                        error: error instanceof Error ? error.message : String(error),
                        durationMs: Date.now() - startTime,
                    });

                    // 🔥 OBRIGATÓRIO — PgBoss só faz retry se o handler lançar erro
                    throw error;
                }
            }
        });

        logger.info({
            msg: "Worker registered",
            type: entry.type,
            localConcurrency,
        });
    }

    workerStarted = true;
    logger.info({
        msg: "Integration worker started",
        totalHandlers: handlers.length,
        globalConcurrency: env.PG_BOSS_CONCURRENCY,
    });
}

/**
 * Retorna se o worker já foi iniciado.
 */
export function isWorkerStarted(): boolean {
    return workerStarted;
}

/**
 * Retorna a lista de tipos de job registrados.
 */
export function getRegisteredTypes(): string[] {
    return handlers.map((h) => h.type);
}
