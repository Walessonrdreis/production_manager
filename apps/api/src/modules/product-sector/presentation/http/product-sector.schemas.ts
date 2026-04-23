import { z } from "zod";
import { UpdateProductSectorInputSchema } from "@shared/contracts";

export const productIdParamsSchema = z.object({
  productId: z.string().uuid("ID de produto inválido"),
});

export const updateProductSectorBodySchema = UpdateProductSectorInputSchema;