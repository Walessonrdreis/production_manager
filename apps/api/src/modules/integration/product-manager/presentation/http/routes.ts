// ---------------------------------------------------------------------------
// Routes — Product Manager Integration
// ---------------------------------------------------------------------------
// Commands → routes/commands/ (intenções que saem do sistema)
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";

import { registerCreateProductRoute } from "./routes/commands/create-product.route";
import { registerUpdateProductRoute } from "./routes/commands/update-product.route";
import { registerInactivateProductRoute } from "./routes/commands/inactivate-product.route";

export async function productManagerIntegrationRoutes(app: FastifyInstance) {
    await registerCreateProductRoute(app);
    await registerUpdateProductRoute(app);
    await registerInactivateProductRoute(app);
}
