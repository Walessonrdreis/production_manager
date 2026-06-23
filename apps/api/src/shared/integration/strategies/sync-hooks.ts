// ---------------------------------------------------------------------------
// Sync Hooks — Mecanismo compartilhado de side-effect chaining
// ---------------------------------------------------------------------------
// Permite que módulos de integração executem hooks opcionais após um sync
// global, sem acoplamento direto entre módulos.
//
// Uso típico no job handler:
//
//   import { SyncHooksRunner } from "@/shared/integration/strategies/sync-hooks";
//   import { RefreshProductCatalogProductionReadyUseCase } from "...";
//
//   const hooks = new SyncHooksRunner();
//
//   if (env.FORCE_PRODUCTION_READY_REFRESH_ON_SYNC) {
//     hooks.add({
//       name: "refresh-production-ready",
//       execute: async () => {
//         const useCase = new RefreshProductCatalogProductionReadyUseCase(...);
//         await useCase.execute();
//       },
//     });
//   }
//
//   await executeSync(...args..., hooks);
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import type { AfterSyncHook } from "./types";

const log = getLogger("SyncHooksRunner");

export class SyncHooksRunner {
    private hooks: AfterSyncHook[] = [];

    /**
     * Registra um hook opcional.
     * Retorna `this` para chamadas encadeadas (fluent API).
     */
    add(hook: AfterSyncHook): this {
        this.hooks.push(hook);
        return this;
    }

    /**
     * Executa todos os hooks registrados em sequência.
     * Cada hook é logado individualmente com sucesso/erro.
     */
    async runAll(context: { externalRequestId: string }): Promise<void> {
        const { externalRequestId } = context;

        for (const hook of this.hooks) {
            log.info("Running sync hook", {
                externalRequestId,
                hook: hook.name,
            });

            try {
                await hook.execute(context);
                log.info("Sync hook completed", {
                    externalRequestId,
                    hook: hook.name,
                });
            } catch (error) {
                log.error("Sync hook failed", {
                    externalRequestId,
                    hook: hook.name,
                    error,
                });
            }
        }
    }

    /**
     * True se nenhum hook foi registrado.
     */
    get empty(): boolean {
        return this.hooks.length === 0;
    }

    /**
     * True se há pelo menos um hook registrado.
     */
    get any(): boolean {
        return this.hooks.length > 0;
    }
}
