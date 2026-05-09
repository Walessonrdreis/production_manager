import { z } from "zod";
import { paginated, sendOk, ok } from "@/shared/http/response";

export function createOmieProductionOrdersController(useCases: any) {
  return {
    async ping(request: any, reply: any) {
      return sendOk(request, reply, { ok: true }, {});
    },

    async syncProductionOrders(request: any, reply: any) {
      const querySchema = z.object({
        filterCompleted: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
        filterCompletionDateStart: z.string().optional(),
        filterCompletionDateEnd: z.string().optional(),
      });

      const options = querySchema.parse(request.query);
      
      const result = await useCases.syncProductionOrders.execute(options);
      return sendOk(request, reply, result, {});
    },

    async syncProductionOrdersInfo(_request: any, reply: any) {
      return reply.send(
        ok({
          ok: true,
          module: "omie-production-orders",
          operation: "production-orders-sync",

          description: "Sincronização de ordens de produção Omie para o banco local.",

          howToRun: {
            method: "POST",
            endpoint: "/v1/admin/omie/production-orders/sync",
            idempotent: true,
            lockStrategy: "exclusive",
            queryParams: {
              filterCompleted: "optional - 'true' ou 'false' para filtrar por conclusão",
              filterCompletionDateStart: "optional - data inicial para filtro por data de conclusão",
              filterCompletionDateEnd: "optional - data final para filtro por data de conclusão",
            },
          },

          status: {
            running: false,
            locked: false,
            lockedUntil: null,
          },

          lastExecution: {
            supported: false,
            note: "Ainda não há persistência de histórico de execução",
          },

          behavior: {
            onSuccess: "Ordens de produção são persistidas/atualizadas no banco",
            onLocked: "Retorna reason=LOCKED sem executar",
            onError: "Retorna AppError com código específico",
          },

          omieEndpoint: {
            path: "produtos/op/",
            call: "ListarOrdemProducao",
          },
        })
      );
    },

    async listProductionOrders(request: any, reply: any) {
      const querySchema = z.object({
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(200).default(50),
        filterCompleted: z.enum(['true', 'false']).optional().transform(val => val === 'true'),
        filterCompletionDateStart: z.string().optional(),
        filterCompletionDateEnd: z.string().optional(),
        sortBy: z.enum(['forecastDate', 'completionDate', 'stage', 'quantity']).default('forecastDate'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      });

      const query = querySchema.parse(request.query);
      
      const result = await useCases.listProductionOrders.execute(query);
      
      return reply.send(
        paginated(
          result.data,
          result.meta,
          {
            self: `/v1/admin/omie/production-orders?page=${result.meta.page}&pageSize=${result.meta.pageSize}${
              query.filterCompleted !== undefined ? `&filterCompleted=${query.filterCompleted}` : ''
            }${
              query.filterCompletionDateStart ? `&filterCompletionDateStart=${encodeURIComponent(query.filterCompletionDateStart)}` : ''
            }${
              query.filterCompletionDateEnd ? `&filterCompletionDateEnd=${encodeURIComponent(query.filterCompletionDateEnd)}` : ''
            }`,
          }
        )
      );
    },

    async getProductionOrderByCode(request: any, reply: any) {
      const paramsSchema = z.object({
        omieCode: z.string().trim().min(1),
      });

      const { omieCode } = paramsSchema.parse(request.params);
      
      const order = await useCases.getProductionOrderByCode.execute({ omieCode });
      
      if (!order) {
        return reply.status(404).send({
          error: {
            code: "PRODUCTION_ORDER_NOT_FOUND",
            message: `Ordem de produção com código ${omieCode} não encontrada`,
          },
        });
      }

      return reply.send(ok(order));
    },

    async getProductionOrdersByProductCode(request: any, reply: any) {
      const querySchema = z.object({
        productCode: z.string().trim().min(1),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(200).default(50),
      });

      const query = querySchema.parse({ ...request.query, ...request.params });
      
      const result = await useCases.getProductionOrdersByProductCode.execute(query);
      
      return reply.send(
        paginated(
          result.data,
          result.meta,
          {
            self: `/v1/admin/omie/production-orders/product/${query.productCode}?page=${result.meta.page}&pageSize=${result.meta.pageSize}`,
          }
        )
      );
    },

    async getProductionOrdersByProductIntegrationCode(request: any, reply: any) {
      const querySchema = z.object({
        integrationCode: z.string().trim().min(1),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(200).default(50),
      });

      const query = querySchema.parse({ ...request.query, ...request.params });
      
      const result = await useCases.getProductionOrdersByProductIntegrationCode.execute(query);
      
      return reply.send(
        paginated(
          result.data,
          result.meta,
          {
            self: `/v1/admin/omie/production-orders/product-integration/${query.integrationCode}?page=${result.meta.page}&pageSize=${result.meta.pageSize}`,
          }
        )
      );
    },

    async getProductionOrdersStats(_request: any, reply: any) {
      const stats = await useCases.getProductionOrdersStats.execute();
      return reply.send(ok(stats));
    },

    async getActiveProductionOrdersCount(_request: any, reply: any) {
      const count = await useCases.getActiveProductionOrdersCount.execute();
      return reply.send(ok({ count }));
    },

    async getCompletedProductionOrdersCount(request: any, reply: any) {
      const querySchema = z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      });

      const query = querySchema.parse(request.query);
      
      const count = await useCases.getCompletedProductionOrdersCount.execute(query);
      return reply.send(ok({ count }));
    },
  };
}