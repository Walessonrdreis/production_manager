import {
  planIdParamsSchema,
  createPlanBodySchema,
  addPlanItemBodySchema,
} from "./plans.schemas";
import { paginated, wantsLegacyResponse } from "@/shared/http/response";

export function createPlansController(useCases: any) {
  return {
    async create(request: any, reply: any) {
      const body = createPlanBodySchema.parse(request.body);
      const plan = await useCases.createPlan.execute(body);
      return reply.status(201).send(plan);
    },

    async list(request: any, reply: any) {
      const plans = await useCases.listPlans.execute();

      if (wantsLegacyResponse(request)) {
        return reply.send({ items: plans });
      }

      return reply.send(
        paginated(plans, {
          page: 1,
          pageSize: plans.length,
          total: plans.length,
        })
      );
    },

    async getById(request: any, reply: any) {
      const { id } = planIdParamsSchema.parse(request.params);
      const plan = await useCases.getPlanById.execute({ id });
      return reply.send(plan);
    },

    async addItem(request: any, reply: any) {
      const { id } = planIdParamsSchema.parse(request.params);
      const body = addPlanItemBodySchema.parse(request.body);

      const item = await useCases.addPlanItem.execute({
        planId: id,
        ...body,
      });

      return reply.status(201).send(item);
    },

    async listBySector(request: any, reply: any) {
      const { id } = planIdParamsSchema.parse(request.params);
      const result = await useCases.listPlanItemsBySector.execute({ planId: id });
      return reply.send(result);
    },

    async exportCsv(request: any, reply: any) {
      const { id } = planIdParamsSchema.parse(request.params);
      const csv = await useCases.exportPlanCsv.execute({ planId: id });

      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", `attachment; filename="plan-${id}.csv"`);
      return reply.send(csv);
    },
  };
}
