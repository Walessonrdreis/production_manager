// src/modules/products/presentation/http/products.schemas.ts
import { z } from "zod";
import { CreateProductInputSchema } from "@shared/contracts";

export const publicListQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(50),
});

export const publicGetByOmieCodeParamsSchema = z.object({
  omieCode: z.string().trim().min(1),
});

export const managedProductIdParamsSchema = z.object({
  id: z.string(),
});

export const managedProductIdUuidParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createManagedProductBodySchema = CreateProductInputSchema;

export const createManagedProductsBulkBodySchema = z.object({
  omieProductIds: z.array(z.string().uuid()).min(1).max(5000),
});

export const patchManagedProductBodySchema = z.object({
  data: z
    .object({
      nickname: z.string().trim().min(1).optional(),
      active: z.boolean().optional(),
    })
    .refine((value) => value.nickname !== undefined || value.active !== undefined, {
      message: "At least one field is required",
    }),
});

export const stockHistoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).default(50),
});
``