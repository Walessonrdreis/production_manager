import { createOmieProductionOrdersModule } from "./index";
import { createOmieProductionOrdersController } from "./presentation/http/omie-production-orders.controller";
import { registerOmieProductionOrdersRoutes } from "./presentation/http/omie-production-orders.routes";

export async function registerOmieProductionOrdersModule(app: any) {
  const { useCases } = createOmieProductionOrdersModule(app);

  const productionOrdersController = createOmieProductionOrdersController(useCases);
  await registerOmieProductionOrdersRoutes(app, productionOrdersController);

  return { useCases };
}