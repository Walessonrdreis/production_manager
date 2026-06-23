// src/shared/infra/job-queue/index.ts
// Barrel exports para a fila centralizada de jobs (PgBoss)

export {
    startJobQueue,
    getJobQueue,
    enqueueJob,
    stopJobQueue,
} from "./pgboss-queue";

export type {
    EnqueueOptions,
    JobHandler,
} from "./pgboss-queue";

export {
    registerJobHandler,
    startWorker,
    isWorkerStarted,
    getRegisteredTypes,
} from "./integration.worker";
