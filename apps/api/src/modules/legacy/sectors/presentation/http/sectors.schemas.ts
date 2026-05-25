import { z } from "zod";
import { CreateSectorInputSchema, UpdateSectorInputSchema } from "@shared/contracts";

export const listSectorsQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional().default(false),
});

export const sectorIdParamsSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

export const createSectorBodySchema = CreateSectorInputSchema;
export const updateSectorBodySchema = UpdateSectorInputSchema;