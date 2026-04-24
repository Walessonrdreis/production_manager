import { createOmieOrdersModule } from "./index";
import { createOmieOrdersController } from "./presentation/http/omie-orders.controller";
import { registerOmieOrdersRoutes } from "./presentation/http/omie-orders.routes";

export async function registerOmieOrdersModule(app: any) {
  const { useCases } = createOmieOrdersModule(app);

  const controller = createOmieOrdersController(useCases);
  await registerOmieOrdersRoutes(app, controller);

  return { useCases };
}