// src/shared/infra/job-queue/pgboss-queue.ts
// Wrapper tipado em volta do PgBoss — gerencia singleton, enqueue e lifecycle.
// PgBoss é uma fila de jobs persistida em PostgreSQL com retry nativo,
// backoff exponencial e entrega via LISTEN/NOTIFY (event-driven).

import { PgBoss } from "pg-boss";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";

const logger = getLogger("job-queue");

// ─── Types ───────────────────────────────────────────────────────────

export type EnqueueOptions = {
    /** Quantidade máxima de tentativas (padrão: 5) */
    retryLimit?: number;
    /** Backoff exponencial entre retries (padrão: true) */
    retryBackoff?: boolean | number;
    /** Prioridade do job (maior = mais prioritário) */
    priority?: number;
    /** Aguardar N segundos antes de processar */
    startAfter?: number;
    /** Chave de singleton — apenas um job com essa chave pode existir por vez */
    singletonKey?: string;
};

export type JobHandler<T = unknown> = (job: {
    id: string;
    data: T;
}) => Promise<void>;

// ─── Singleton ───────────────────────────────────────────────────────

let bossInstance: PgBoss | null = null;

/**
 * Inicializa (ou retorna) a instância singleton do PgBoss.
 * Chamado automaticamente por `getJobQueue()` e `enqueueJob()`.
 */
export async function startJobQueue(): Promise<PgBoss> {
    if (bossInstance) return bossInstance;

    const connectionString = env.PG_BOSS_CONNECTION_STRING || env.DIRECT_URL || env.DATABASE_URL;

    bossInstance = new PgBoss({
        connectionString,
        schema: "job_queue",
        migrate: true,
        createSchema: true,
    });

    bossInstance.on("error", (error: Error) => {
        logger.error({ msg: "PgBoss error", error: error.message });
    });

    await bossInstance.start();
    logger.info("Job queue started (PgBoss)");
    return bossInstance;
}

/**
 * Retorna a instância do PgBoss (inicializa se necessário).
 */
export async function getJobQueue(): Promise<PgBoss> {
    if (!bossInstance) return startJobQueue();
    return bossInstance;
}

/**
 * Enfileira um job do tipo `type` com os dados `data`.
 * Retorna o ID do job ou `null` se houver conflito de singleton.
 */
export async function enqueueJob<T = Record<string, unknown>>(
    type: string,
    data: T,
    options?: EnqueueOptions
): Promise<string | null> {
    const boss = await getJobQueue();

    // Monta opções apenas com propriedades definidas (PgBoss v12 rejeita undefined)
    const sendOptions: Record<string, unknown> = {};
    if (options?.retryLimit !== undefined) sendOptions.retryLimit = options.retryLimit;
    if (options?.retryBackoff !== undefined) sendOptions.retryBackoff = options.retryBackoff;
    if (options?.priority !== undefined) sendOptions.priority = options.priority;
    if (options?.startAfter !== undefined) sendOptions.startAfter = options.startAfter;
    if (options?.singletonKey !== undefined) sendOptions.singletonKey = options.singletonKey;

    const jobId = await boss.send(type, data as object | null, sendOptions);
    logger.debug({ msg: "Job enqueued", type, jobId });
    return jobId;
}

/**
 * Para o PgBoss gracefulmente (drena jobs em andamento).
 */
export async function stopJobQueue(): Promise<void> {
    if (bossInstance) {
        await bossInstance.stop({ graceful: true, timeout: 30000 });
        bossInstance = null;
        logger.info("Job queue stopped");
    }
}
