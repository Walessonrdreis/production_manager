// ---------------------------------------------------------------------------
// Gateway — Real Production Order Lifecycle
// ---------------------------------------------------------------------------
// Implementação real do lifecycle gateway. Usa ProductionOrderCommandStore
// para marcar comandos como CONFIRMED ou FAILED.
// Em produção, callbacks HTTP são desabilitadas (Omie gerencia assincronamente),
// mas o gateway pode ser usado internamente por jobs e workers.
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { ProductionOrderCommandStore } from "../../db/production-order-command.store";
import type { ProductionOrderLifecycleGateway } from "./production-order-lifecycle.gateway";

const logger = getLogger("production-order:lifecycle:real");

export class RealProductionOrderLifecycleGateway
    implements ProductionOrderLifecycleGateway {

    async confirm(externalRequestId: string) {
        logger.info("Confirming command", { externalRequestId });
        const store = new ProductionOrderCommandStore(prisma);
        return store.markConfirmed(externalRequestId);
    }

    async fail(
        externalRequestId: string,
        err: { code: string; message: string }
    ) {
        logger.error("Failing command", { externalRequestId, code: err.code, message: err.message });
        const store = new ProductionOrderCommandStore(prisma);
        return store.markFailed(externalRequestId, err);
    }
}
