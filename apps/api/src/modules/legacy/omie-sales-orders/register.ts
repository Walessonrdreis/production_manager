import { createOmieSalesOrdersModule } from "./index";
import { createOmieSalesOrdersController } from "./presentation/http/omie-sales-orders.controller";
import { registerOmieSalesOrdersRoutes } from "./presentation/http/omie-sales-orders.routes";

export async function registerOmieSalesOrdersModule(app: any) {
  const { useCases } = createOmieSalesOrdersModule(app);

  const salesOrdersController = createOmieSalesOrdersController(useCases);
  await registerOmieSalesOrdersRoutes(app, salesOrdersController);

  return { useCases };
}