// ---------------------------------------------------------------------------
// PgBoss Handlers — Product Manager
// ---------------------------------------------------------------------------
// Registra os handlers PgBoss para processamento assíncrono dos comandos
// de produto (CREATE, UPDATE, INACTIVATE).
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

import { ProductManagerCommandStore } from "../db/product-manager-command.store";

import { ProcessCreateProductUseCase } from "../../application/use-cases/process-create-product.usecase";
import { ProcessUpdateProductUseCase } from "../../application/use-cases/process-update-product.usecase";
import { ProcessInactivateProductUseCase } from "../../application/use-cases/process-inactivate-product.usecase";

import { RealProductCreationGateway } from "../gateways/creation/real-product-creation.gateway";
import { FakeProductCreationGateway } from "../gateways/creation/fake-product-creation.gateway";

import { RealProductUpdateGateway } from "../gateways/update/real-product-update.gateway";
import { FakeProductUpdateGateway } from "../gateways/update/fake-product-update.gateway";

import { RealProductInactivateGateway } from "../gateways/inactivate/real-product-inactivate.gateway";
import { FakeProductInactivateGateway } from "../gateways/inactivate/fake-product-inactivate.gateway";

import type { ProcessCreateProductData } from "../../application/dto/create-product.dto";
import type { ProcessUpdateProductData } from "../../application/dto/update-product.dto";
import type { ProcessInactivateProductData } from "../../application/dto/inactivate-product.dto";

const logger = getLogger("product-manager:jobs:handler");

function createGateways(omieClient: OmieHttpClientPort) {
    const isFake = env.PRODUCT_MANAGER_GATEWAY === "fake";

    const creationGateway = isFake
        ? new FakeProductCreationGateway()
        : new RealProductCreationGateway(omieClient);

    const updateGateway = isFake
        ? new FakeProductUpdateGateway()
        : new RealProductUpdateGateway(omieClient);

    const inactivateGateway = isFake
        ? new FakeProductInactivateGateway()
        : new RealProductInactivateGateway(omieClient);

    return { isFake, creationGateway, updateGateway, inactivateGateway };
}

/**
 * Registra todos os handlers PgBoss para o módulo product-manager.
 * Bridge pura: cria use-cases com gateways injetados e registra handlers
 * que delegam para os use-cases.
 */
export function registerProductManagerJobHandlers(
    omieClient: OmieHttpClientPort
): void {
    const commandStore = new ProductManagerCommandStore(prisma);
    const { isFake, creationGateway, updateGateway, inactivateGateway } =
        createGateways(omieClient);

    // ── Instancia use-cases de processamento ──────────────────────────

    const createUseCase = new ProcessCreateProductUseCase(
        creationGateway,
        commandStore,
        { isFake }
    );

    const updateUseCase = new ProcessUpdateProductUseCase(
        updateGateway,
        commandStore,
        { isFake }
    );

    const inactivateUseCase = new ProcessInactivateProductUseCase(
        inactivateGateway,
        commandStore,
        { isFake }
    );

    // ── 1. CREATE ─────────────────────────────────────────────────────

    registerJobHandler<ProcessCreateProductData>(
        "product-manager.create",
        (job) => createUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    // ── 2. UPDATE ─────────────────────────────────────────────────────

    registerJobHandler<ProcessUpdateProductData>(
        "product-manager.update",
        (job) => updateUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    // ── 3. INACTIVATE ─────────────────────────────────────────────────

    registerJobHandler<ProcessInactivateProductData>(
        "product-manager.inactivate",
        (job) => inactivateUseCase.execute(job.data),
        { concurrency: 1, batchSize: 1 }
    );

    logger.info("Product-manager PgBoss handlers registered", {
        types: [
            "product-manager.create",
            "product-manager.update",
            "product-manager.inactivate",
        ],
    });
}
