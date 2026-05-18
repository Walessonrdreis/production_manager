import { SnapshotRepository } from '../ports/snapshot.repository.port';
import { HistoryService } from '../services/history.service';
import { Product } from '../entities/product.entity';

export interface UpdateDatesParams {
  productId: string;
  scheduledDate?: Date;
  actualDate?: Date;
}

export class UpdateDatesUseCase {
  constructor(
    private readonly repository: SnapshotRepository,
    private readonly historyService: HistoryService
  ) {}

  async execute(params: UpdateDatesParams): Promise<Product> {
    const { productId, scheduledDate, actualDate } = params;

    // 1. Get the product
    const product = await this.repository.findProductById(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // 2. Record old values for history
    const oldScheduledDate = product.scheduledDate;
    const oldActualDate = product.actualDate;

    // 3. Update product dates
    const updatedProduct: Product = {
      ...product,
      scheduledDate,
      actualDate,
      updatedAt: new Date(),
    };

    await this.repository.updateProduct(updatedProduct);

    // 4. Record history for each changed date
    if (scheduledDate !== undefined && scheduledDate !== oldScheduledDate) {
      await this.historyService.recordDateUpdate(
        productId,
        'scheduledDate',
        oldScheduledDate,
        scheduledDate
      );
    }

    if (actualDate !== undefined && actualDate !== oldActualDate) {
      await this.historyService.recordDateUpdate(
        productId,
        'actualDate',
        oldActualDate,
        actualDate
      );
    }

    return updatedProduct;
  }
}