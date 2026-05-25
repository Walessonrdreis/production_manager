import { z } from "zod";
import { paginated, sendOk, ok } from "@/shared/http/response";

/**
 * Controller do módulo legacy omie-sales-orders.
 * Mantém assinatura atual: recebe useCases já montados pelo módulo.
 */
export function createOmieSalesOrdersController(useCases: any) {
  return {
    async ping(request: any, reply: any) {
      return sendOk(request, reply, { ok: true }, {});
    },

    async syncStage20(request: any, reply: any) {
      const result = await useCases.syncStage20Orders.execute();
      return sendOk(request, reply, result, {});
    },

    async syncStage20Info(_request: any, reply: any) {
      return reply.send(
        ok({
          ok: true,
          module: "omie-sales-orders",
          operation: "stage20-sync",
          description: "Sincronização de pedidos Omie da etapa 20 para o banco local.",
          howToRun: {
            method: "POST",
            endpoint: "/v1/admin/omie/orders/stage20/sync",
            idempotent: true,
            lockStrategy: "exclusive",
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
            onSuccess: "Pedidos são persistidos/atualizados no banco",
            onLocked: "Retorna reason=LOCKED sem executar",
            onError: "Retorna AppError com código específico",
          },
        })
      );
    },

    async listOrders(request: any, reply: any) {
      const q = z
        .object({
          page: z.coerce.number().min(1).default(1),
          pageSize: z.coerce.number().min(1).max(200).default(50),
        })
        .parse(request.query);

      const result = await useCases.listOrders.execute(q);
      return sendOk(request, reply, result, {});
    },

    async listStage20(request: any, reply: any) {
      const q = z
        .object({
          page: z.coerce.number().int().min(1).default(1),
          pageSize: z.coerce.number().int().min(1).max(200).default(50),
          q: z.string().trim().optional(),
        })
        .parse(request.query);

      const result = await useCases.listStage20Orders.execute(q);

      return reply.send(
        paginated(result.data, result.meta, {
          self: `/v1/admin/orders/stage20?page=${result.meta.page}&pageSize=${result.meta.pageSize}${
            q.q ? `&q=${encodeURIComponent(q.q)}` : ""
          }`,
        })
      );
    },

    async getStage20Totals(_request: any, reply: any) {
      const data = await useCases.getStage20Totals.execute();
      return reply.send(ok(data));
    },

    async getStage20TotalsDetailed(_request: any, reply: any) {
      const data = await useCases.getStage20TotalsDetailed.execute();
      return reply.send(ok(data));
    },
  };
}

/**
 * ✅ Compat: se em algum lugar antigo tiver importado outro nome,
 * você pode manter aliases aqui (sem mudar nada no runtime).
 *
 * Exemplo: se já existia `createOmieSalesOrdersController`, está ok.
 * Se em algum momento renomearam, crie alias:
 */
// export const createOmieSalesOrdersController = createOmieSalesOrdersController;