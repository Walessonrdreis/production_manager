import type { FastifyInstance } from "fastify";
import { Stage20Fetcher } from "@/modules/production-control/application/ports/stage20-fetcher.port";
import { Stage20Product } from "@/modules/production-control/application/entities/stage20-product.entity";
import { AppError } from "@/shared/errors";

export class Stage20FetcherFastify implements Stage20Fetcher {
  private app: FastifyInstance;

  constructor(app: FastifyInstance) {
    this.app = app;
  }

  async fetchStage20Products(): Promise<Stage20Product[]> {
    try {
      // ✅ Usa o endpoint legado existente através do Fastify
      // O endpoint retorna dados no formato esperado pelo módulo production-control
      const response = await this.app.inject({
        method: "GET",
        url: "/v1/admin/orders/stage20/totals/detailed",
      });

      if (response.statusCode !== 200) {
        throw new AppError({
          code: "STAGE20_FETCH_FAILED",
          message: `Failed to fetch stage20 products: ${response.statusCode}`,
          status: response.statusCode,
        });
      }

      const data = response.json();

      // ✅ Transforma os dados do endpoint legado para o formato do módulo production-control
      const stage20Products: Stage20Product[] = data.map((product: any) => ({
        description: product.description,
        totalQuantity: product.totalQuantity,
        orders: product.orders.map((order: any) => ({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          clientCode: order.clientCode,
          clientName: order.clientName,
          quantity: order.quantity,
          productCode: order.productCode,
        })),
      }));

      return stage20Products;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError({
        code: "STAGE20_FETCH_ERROR",
        message: `Error fetching stage20 products: ${error instanceof Error ? error.message : String(error)}`,
        status: 500,
      });
    }
  }

  async hasStage20Data(): Promise<boolean> {
    try {
      const products = await this.fetchStage20Products();
      return products.length > 0;
    } catch (error) {
      // Se falhar ao buscar, assume que não há dados
      return false;
    }
  }

  async getStage20ProductByDescription(description: string): Promise<Stage20Product | null> {
    try {
      const products = await this.fetchStage20Products();
      return products.find(product => product.description === description) || null;
    } catch (error) {
      return null;
    }
  }

  async getStage20OrderByOrderNumber(orderNumber: string): Promise<{
    productDescription: string;
    order: any;
  } | null> {
    try {
      const products = await this.fetchStage20Products();
      
      for (const product of products) {
        const order = product.orders.find(o => o.orderNumber === orderNumber);
        if (order) {
          return {
            productDescription: product.description,
            order,
          };
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async validateStage20Data(): Promise<{
    isValid: boolean;
    errors?: string[];
    productCount: number;
    orderCount: number;
  }> {
    try {
      const products = await this.fetchStage20Products();
      const errors: string[] = [];

      // ✅ Validações básicas
      products.forEach((product, index) => {
        if (!product.description || product.description.trim() === "") {
          errors.push(`Product at index ${index} has empty description`);
        }

        if (product.totalQuantity <= 0) {
          errors.push(`Product "${product.description}" has invalid total quantity: ${product.totalQuantity}`);
        }

        product.orders.forEach((order, orderIndex) => {
          if (!order.orderNumber || order.orderNumber.trim() === "") {
            errors.push(`Order at index ${orderIndex} in product "${product.description}" has empty order number`);
          }

          if (order.quantity <= 0) {
            errors.push(`Order "${order.orderNumber}" in product "${product.description}" has invalid quantity: ${order.quantity}`);
          }
        });
      });

      const orderCount = products.reduce((total, product) => total + product.orders.length, 0);

      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        productCount: products.length,
        orderCount,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to validate stage20 data: ${error instanceof Error ? error.message : String(error)}`],
        productCount: 0,
        orderCount: 0,
      };
    }
  }
}