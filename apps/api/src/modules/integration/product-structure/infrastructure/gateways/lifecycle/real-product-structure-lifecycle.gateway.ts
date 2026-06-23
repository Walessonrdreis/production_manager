// ---------------------------------------------------------------------------
// Gateway — Real Product Structure Lifecycle
// ---------------------------------------------------------------------------
// Implementação real do lifecycle gateway. Usa ProductStructureCommandStore
// para marcar comandos como CONFIRMED ou FAILED.
// Em produção, callbacks HTTP são desabilitadas (Omie gerencia assincronamente),
// mas o gateway pode ser usado internamente por jobs e workers.
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import { prisma } from "@/shared/db/prisma";
import { ProductStructureCommandStore } from "../../db/product-structure-command.store";
import type { ProductStructureLifecycleGateway } from "./product-structure-lifecycle.gateway";

const logger = getLogger("product-structure:lifecycle:real");

export class RealProductStructureLifecycleGateway
    implements ProductStructureLifecycleGateway {

    async confirm(externalRequestId: string) {
        logger.info("Confirming command", { externalRequestId });
        const store = new ProductStructureCommandStore(prisma);
        return store.markConfirmed(externalRequestId);
    }

    async fail(
        externalRequestId: string,
        err: { code: string; message: string }
    ) {
        logger.error("Failing command", { externalRequestId, code: err.code, message: err.message });
        const store = new ProductStructureCommandStore(prisma);
        return store.markFailed(externalRequestId, err);
    }
}
