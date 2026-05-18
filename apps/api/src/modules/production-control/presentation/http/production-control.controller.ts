import type { FastifyInstance } from "fastify";
import { createProductionControlModule } from "@/modules/production-control";
import { ok, paginated } from "@/lib/http";
import { AppError } from "@/shared/errors";

export function createProductionControlController(app: FastifyInstance) {
  const { useCases } = createProductionControlModule(app);

  return {
    async listSnapshots(request: any, reply: any) {
      try {
        const { limit = 50, offset = 0, orderBy = "createdAt", orderDirection = "desc" } = request.query;

        const snapshots = await useCases.listSnapshots.execute({
          limit: Number(limit),
          offset: Number(offset),
          orderBy,
          orderDirection,
        });

        const total = await useCases.countSnapshots.execute();

        return reply.send(
          paginated(snapshots, {
            limit: Number(limit),
            offset: Number(offset),
            total,
          })
        );
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError({
          code: "LIST_SNAPSHOTS_ERROR",
          message: `Error listing snapshots: ${error instanceof Error ? error.message : String(error)}`,
          status: 500,
        });
      }
    },

    async getSnapshotById(request: any, reply: any) {
      try {
        const { id } = request.params;

        const snapshot = await useCases.getSnapshotById.execute({ id });

        if (!snapshot) {
          throw new AppError({
            code: "SNAPSHOT_NOT_FOUND",
            message: `Snapshot with id ${id} not found`,
            status: 404,
          });
        }

        return reply.send(ok(snapshot));
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError({
          code: "GET_SNAPSHOT_ERROR",
          message: `Error getting snapshot: ${error instanceof Error ? error.message : String(error)}`,
          status: 500,
        });
      }
    },

    async getSnapshotProducts(request: any, reply: any) {
      try {
        const { id } = request.params;
        const { status, limit = 100, offset = 0 } = request.query;

        const products = await useCases.getSnapshotProducts.execute({
          snapshotId: id,
          status,
          limit: Number(limit),
          offset: Number(offset),
        });

        const total = await useCases.countSnapshotProducts.execute({
          snapshotId: id,
          status,
        });

        return reply.send(
          paginated(products, {
            limit: Number(limit),
            offset: Number(offset),
            total,
          })
        );
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError({
          code: "GET_SNAPSHOT_PRODUCTS_ERROR",
          message: `Error getting snapshot products: ${error instanceof Error ? error.message : String(error)}`,
          status: 500,
        });
      }
    },

    async getProductDetails(request: any, reply: any) {
      try {
        const { productId } = request.params;

        const product = await useCases.getProductDetails.execute({ productId });

        if (!product) {
          throw new AppError({
            code: "PRODUCT_NOT_FOUND",
            message: `Product with id ${productId} not found`,
            status: 404,
          });
        }

        return reply.send(ok(product));
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError({
          code: "GET_PRODUCT_DETAILS_ERROR",
          message: `Error getting product details: ${error instanceof Error ? error.message : String(error)}`,
          status: 500,
        });
      }
    },

    async toggleOrderCheck(request: any, reply: any) {
      try {
        const { orderId } = request.params;

        const result = await useCases.toggleOrderCheck.execute({ orderId });

        if (!result) {
          throw new AppError({
            code: "ORDER_NOT_FOUND",
            message: `Order with id ${orderId} not found`,
            status: 404,
          });
        }

        return reply.send(ok(result));
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError({
          code: "TOGGLE_ORDER_CHECK_ERROR",
          message: `Error toggling order check: ${error instanceof Error ? error.message : String(error)}`,
          status: 500,
        });
      }
    },

    async toggleProductCheck(request: any, reply: any) {
      try {
        const { productId } = request.params;

        const result = await useCases.toggleProductCheck.execute({ productId });

        if (!result) {
          throw new AppError({
            code: "PRODUCT_NOT_FOUND",
            message: `Product with id ${productId} not found`,
            status: 404,
          });
        }

        return reply.send(ok(result));
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError({
          code: "TOGGLE_PRODUCT_CHECK_ERROR",
          message: `Error toggling product check: ${error instanceof Error ? error.message : String(error)}`,
          status: 500,
        });
      }
    },

    async updateProductDates(request: any, reply: any) {
      try {
        const { productId } = request.params;
        const { scheduledDate, actualDate } = request.body;

        const result = await useCases.updateProductDates.execute({
          productId,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
          actualDate: actualDate ? new Date(actualDate) : undefined,
        });

        if (!result) {
          throw new AppError({
            code: "PRODUCT_NOT_FOUND",
            message: `Product with id ${productId} not found`,
            status: 404,
          });
        }

        return reply.send(ok(result));
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError({
          code: "UPDATE_PRODUCT_DATES_ERROR",
          message: `Error updating product dates: ${error instanceof Error ? error.message : String(error)}`,
          status: 500,
        });
      }
    },

    async getProductHistory(request: any, reply: any) {
      try {
        const { productId } = request.params;
        const { limit = 100, offset = 0, action } = request.query;

        const history = await useCases.getProductHistory.execute({
          productId,
          limit: Number(limit),
          offset: Number(offset),
          action,
        });

        const total = await useCases.countProductHistory.execute({
          productId,
          action,
        });

        return reply.send(
          paginated(history, {
            limit: Number(limit),
            offset: Number(offset),
            total,
          })
        );
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError({
          code: "GET_PRODUCT_HISTORY_ERROR",
          message: `Error getting product history: ${error instanceof Error ? error.message : String(error)}`,
          status: 500,
        });
      }
    },

    async getOrderHistory(request: any, reply: any) {
      try {
        const { orderId } = request.params;
        const { limit = 100, offset = 0, action } = request.query;

        const history = await useCases.getOrderHistory.execute({
          orderId,
          limit: Number(limit),
          offset: Number(offset),
          action,
        });

        const total = await useCases.countOrderHistory.execute({
          orderId,
          action,
        });

        return reply.send(
          paginated(history, {
            limit: Number(limit),
            offset: Number(offset),
            total,
          })
        );
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError({
          code: "GET_ORDER_HISTORY_ERROR",
          message: `Error getting order history: ${error instanceof Error ? error.message : String(error)}`,
          status: 500,
        });
      }
    },

    async createSnapshot(request: any, reply: any) {
      try {
        const { description } = request.body;

        const result = await useCases.createSnapshot.execute({
          description,
        });

        return reply.send(ok(result));
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError({
          code: "CREATE_SNAPSHOT_ERROR",
          message: `Error creating snapshot: ${error instanceof Error ? error.message : String(error)}`,
          status: 500,
        });
      }
    },

    async cleanupOldData(request: any, reply: any) {
      try {
        const { olderThanDays = 30, keepLast = 100 } = request.body;

        const result = await useCases.cleanupOldData.execute({
          olderThanDays: Number(olderThanDays),
          keepLast: Number(keepLast),
        });

        return reply.send(ok(result));
      } catch (error) {
        if (error instanceof AppError) {
          throw error;
        }

        throw new AppError({
          code: "CLEANUP_OLD_DATA_ERROR",
          message: `Error cleaning up old data: ${error instanceof Error ? error.message : String(error)}`,
          status: 500,
        });
      }
    },
  };
}