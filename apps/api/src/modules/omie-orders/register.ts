import { createOmieOrdersModule } from "./index";
import { createOmieOrdersController } from "./presentation/http/omie-orders.controller";
import { registerOmieOrdersRoutes } from "./presentation/http/omie-orders.routes";
import { createOmieProductionOrdersController } from "./presentation/http/omie-production-orders.controller";
import { registerOmieProductionOrdersRoutes } from "./presentation/http/omie-production-orders.routes";

export async function registerOmieOrdersModule(app: any) {
  const { useCases } = createOmieOrdersModule(app);

  const ordersController = createOmieOrdersController(useCases);
  await registerOmieOrdersRoutes(app, ordersController);

  const productionOrdersController = createOmieProductionOrdersController(useCases);
  await registerOmieProductionOrdersRoutes(app, productionOrdersController);

  return { useCases };
}