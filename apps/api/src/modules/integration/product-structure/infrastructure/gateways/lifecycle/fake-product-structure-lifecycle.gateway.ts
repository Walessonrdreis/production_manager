// ---------------------------------------------------------------------------
// Gateway — Fake Product Structure Lifecycle
// ---------------------------------------------------------------------------
// Implementação fake do lifecycle gateway. Usa ProductStructureCommandStore
// para marcar comandos como CONFIRMED ou FAILED.
// Usado pelas rotas de callback em ambiente fake/dev.
// ---------------------------------------------------------------------------

import { prisma } from "@/shared/db/prisma";
import { ProductStructureCommandStore } from "../../db/product-structure-command.store";
import type { ProductStructureLifecycleGateway } from "./product-structure-lifecycle.gateway";

export class FakeProductStructureLifecycleGateway
    implements ProductStructureLifecycleGateway {

    async confirm(externalRequestId: string) {
        console.log("[PS][FAKE][LIFECYCLE] confirm", { externalRequestId });
        const store = new ProductStructureCommandStore(prisma);
        return store.markConfirmed(externalRequestId);
    }

    async fail(
        externalRequestId: string,
        err: { code: string; message: string }
    ) {
        console.log("[PS][FAKE][LIFECYCLE] fail", {
            externalRequestId,
            code: err.code,
        });
        const store = new ProductStructureCommandStore(prisma);
        return store.markFailed(externalRequestId, err);
    }
}
