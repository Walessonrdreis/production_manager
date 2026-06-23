// ---------------------------------------------------------------------------
// PgBoss Handlers — Production Orders
// ---------------------------------------------------------------------------
// Registra os handlers PgBoss para processamento assíncrono dos comandos
// de ordem de produção (CREATE_OP, UPDATE_OP, CANCEL_OP, CHANGE_STAGE).
//
// Bridge pura: cria use-cases com gateways injetados e registra handlers
// que delegam para os use-cases.
//
// Deve ser chamado durante o bootstrap, ANTES de `startWorker()`.
// ---------------------------------------------------------------------------

import { prisma } from "@/shared/db/prisma";
import { env } from "@/config";
import { getLogger } from "@/shared/logger";
import { registerJobHandler } from "@/shared/infra/job-queue";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import { ProductionOrderCommandStore } from "../db/production-order-command.store";

import { ProcessCreateProductionOrderUseCase } from "../../application/use-cases/process-create-production-order.usecase";
import { ProcessUpdateProductionOrderUseCase } from "../../application/use-cases/process-update-production-order.usecase";
import { ProcessCancelProductionOrderUseCase } from "../../application/use-cases/process-cancel-production-order.usecase";
import { ProcessChangeStageProductionOrderUseCase } from "../../application/use-cases/process-change-stage-production-order.usecase";

import { RealProductionOrderCreationGateway } from "../gateways/creation/real-production-order-creation.gateway";
import { FakeProductionOrderCreationGateway } from "../gateways/creation/fake-production-order-creation.gateway";

import { RealProductionOrderUpdateGateway } from "../gateways/update/real-production-order-update.gateway";
import { FakeProductionOrderUpdateGateway } from "../gateways/update/fake-production-order-update.gateway";

import { RealProductionOrderCancelGateway } from "../gateways/cancel/real-production-order-cancel.gateway";
import { FakeProductionOrderCancelGateway } from "../gateways/cancel/fake-production-order-cancel.gateway";

import { RealProductionOrderChangeStageGateway } from "../gateways/change-stage/real-production-order-change-stage.gateway";
import { FakeProductionOrderChangeStageGateway } from "../gateways/change-stage/fake-production-order-change-stage.gateway";

import type { ProcessCreateProductionOrderData } from "../../application/use-cases/process-create-production-order.usecase";
import type { ProcessUpdateProductionOrderData } from "../../application/use-cases/process-update-production-order.usecase";
import type { ProcessCancelProductionOrderData } from "../../application/use-cases/process-cancel-production-order.usecase";
import type { ProcessChangeStageProductionOrderData } from "../../application/use-cases/process-change-stage-production-order.usecase";

const logger = getLogger("production-orders:jobs:handler");

function createGateways(omieClient: OmieHttpClientPort) {
    const isFake = env.PRODUCTION_ORDER_GATEWAY === "fake";

    const creationGateway = isFake
        ? new FakeProductionOrderCreationGateway()
        : new RealProductionOrderCreationGateway(omieClient);

    const updateGateway = isFake
        ? new FakeProductionOrderUpdateGateway()
        : new RealProductionOrderUpdateGateway(omieClient);

    const cancelGateway = isFake
        ? new FakeProductionOrderCancelGateway()
        : new RealProductionOrderCancelGateway(omieClient);

    const changeStageGateway = isFake
        ? new FakeProductionOrderChangeStageGateway()
        : new RealProductionOrderChangeStageGateway(omieClient);

    return { isFake, creationGateway, updateGateway, cancelGateway, changeStageGateway };
}

/**
 * Registra todos os handlers PgBoss para o módulo production-orders.
 * Bridge pura: cria use-cases com gateways injetados e registra handlers
 * que delegam para os use-cases.
 *
 * Deve ser chamado durante o bootstrap, ANTES de `startWorker()`.
 */
export function registerProductionOrderJobHandlers(omieClient: OmieHttpClientPort): void {
    const commandStore = new ProductionOrderCommandStore(prisma);
    const { isFake, creationGateway, updateGateway, cancelGateway, changeStageGateway } = createGateways(omieClient);

    // ── Instancia use-cases de processamento ──────────────────────────

    const createUseCase = new ProcessCreateProductionOrderUseCase(
        creationGateway, commandStore, { isFake }
    );

    const updateUseCase = new ProcessUpdateProductionOrderUseCase(
        updateGateway, commandStore, { isFake }
    );

    const cancelUseCase = new ProcessCancelProductionOrderUseCase(
        cancelGateway, commandStore, { isFake }
    );

    const changeStageUseCase = new ProcessChangeStageProductionOrderUseCase(
        changeStageGateway, commandStore, { isFake }
    );

    // ── 1. CREATE_OP ──────────────────────────────────────────────────

    registerJobHandler<ProcessCreateProductionOrderData>(
        "production-order.create-op",
        (job) => createUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    // ── 2. UPDATE_OP ──────────────────────────────────────────────────

    registerJobHandler<ProcessUpdateProductionOrderData>(
        "production-order.update-op",
        (job) => updateUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    // ── 3. CANCEL_OP ──────────────────────────────────────────────────

    registerJobHandler<ProcessCancelProductionOrderData>(
        "production-order.cancel-op",
        (job) => cancelUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    // ── 4. CHANGE_STAGE ───────────────────────────────────────────────

    registerJobHandler<ProcessChangeStageProductionOrderData>(
        "production-order.change-stage",
        (job) => changeStageUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    logger.info("Production-order PgBoss handlers registered", {
        types: [
            "production-order.create-op",
            "production-order.update-op",
            "production-order.cancel-op",
            "production-order.change-stage",
        ],
    });
}
