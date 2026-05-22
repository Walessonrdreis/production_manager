import { getStockPositionController } from "./presentation/http/stock-position.controller";

export async function registerStockModule(app: any) {
  app.post(
    "/v1/integration/stock/position",
    getStockPositionController
  );
}
