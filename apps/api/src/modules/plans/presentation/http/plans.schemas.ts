import { z } from "zod";
import { CreatePlanInputSchema, AddPlanItemInputSchema } from "@shared/contracts";

export const planIdParamsSchema = z.object({
  id: z.string().uuid("ID inválido."),
});

export const createPlanBodySchema = CreatePlanInputSchema;
export const addPlanItemBodySchema = AddPlanItemInputSchema;