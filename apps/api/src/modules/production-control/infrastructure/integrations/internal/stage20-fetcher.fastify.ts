import { FastifyInstance } from 'fastify';
import { Stage20Fetcher } from '../../../application/ports/stage20-fetcher.port';

export class Stage20FetcherFastify implements Stage20Fetcher {
  constructor(private readonly app: FastifyInstance) {}

  async fetchStage20Products(): Promise<any[]> {
    try {
      // Make internal request to the legacy endpoint
      const response = await this.app.inject({
        method: 'GET',
        url: '/v1/admin/orders/stage20/totals/detailed',
      });

      if (response.statusCode !== 200) {
        throw new Error(`Failed to fetch stage20 products: ${response.statusCode}`);
      }

      const data = response.json();
      
      // Transform the response to match our expected format
      return this.transformResponse(data);
    } catch (error) {
      console.error('Error fetching stage20 products:', error);
      throw new Error(`Failed to fetch stage20 products: ${error.message}`);
    }
  }

  private transformResponse(data: any): any[] {
    // Assuming the response has a structure like:
    // { products: [{ description, totalQuantity, orders: [{ orderNumber, clientName, quantity }] }] }
    
    if (!data || !data.products || !Array.isArray(data.products)) {
      return [];
    }

    return data.products.map((product: any) => ({
      description: product.description || '',
      totalQuantity: product.totalQuantity || 0,
      orders: (product.orders || []).map((order: any) => ({
        orderNumber: order.orderNumber || '',
        clientName: order.clientName || '',
        quantity: order.quantity || 0,
      })),
    }));
  }
}