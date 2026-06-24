// ---------------------------------------------------------------------------
// PgBoss Registration — Product Manager
// ---------------------------------------------------------------------------
// Registra a ponte entre bootstrap e os handlers PgBoss do módulo.
// ---------------------------------------------------------------------------

import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { registerProductManagerJobHandlers } from "./product-manager-jobs.handler";

export function registerProductManagerJobs(
    omieClient: OmieHttpClientPort
): void {
    registerProductManagerJobHandlers(omieClient);
}
