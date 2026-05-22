import { OmieStockPositionGateway } from "../infrastructure/omie-stock-position.gateway";

export class GetStockPositionUseCase {
  private gateway: OmieStockPositionGateway;

  constructor() {
    this.gateway = new OmieStockPositionGateway();
  }

  async execute(command: { productId: string }) {
    return this.gateway.getPosition(command.productId);
  }
}