import { z } from "zod";
import { paginated, sendOk, ok } from "@/shared/http/response";

export function createOmieOrdersController(useCases: any) {
  return {
    async ping(request: any, reply: any) {
      return sendOk(request, reply, { ok: true }, {});
    },

    async syncStage20(request: any, reply: any) {
      const result = await useCases.syncStage20Orders.execute();
      return sendOk(request, reply, result, {});
    },
    
    async syncStage20Info(request: any, reply: any) {
      return sendOk(
        request,
        reply,
        {
          ok: true,
          message: "Endpoint de confirmação. Use POST para executar a sincronização.",
          methodToRun: "POST",
          endpointToRun: "/v1/admin/omie/orders/stage20/sync",
        },
        {}
      );
    },

    async listOrders(request: any, reply: any) {
      const q = z.object({
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().min(1).max(200).default(50),
      }).parse(request.query);

      const result = await useCases.listOrders.execute(q);
      return sendOk(request, reply, result, {});
    },

    async listStage20(request: any, reply: any) {
      const q = z.object({
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(200).default(50),
        q: z.string().trim().optional(),
      }).parse(request.query);

      const result = await useCases.listStage20Orders.execute(q);

      // Mantém o padrão de paginação do seu helper
      return reply.send(
        paginated(
          result.data,
          result.meta,
          {
            self: `/v1/admin/orders/stage20?page=${result.meta.page}&pageSize=${result.meta.pageSize}${
              q.q ? `&q=${encodeURIComponent(q.q)}` : ""
            }`,
          }
        )
      );
    },

    async getStage20Totals(_request: any, reply: any) {
      const data = await useCases.getStage20Totals.execute();
      return reply.send(ok(data));
    },
  };
}