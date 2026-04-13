import { z } from 'zod';
import { SectorSchema } from './sector.schema';

export const OmieProductSchema = z.object({
  id: z.string().uuid(),
  omieId: z.string(),
  code: z.string().nullable().optional(),
  familyDescription: z.string().nullable().optional(),
  sku: z.string().nullable(),
  description: z.string(),
  active: z.boolean(),
  stockQuantity: z.string().nullable().optional(),
  minimumStock: z.string().nullable().optional(),
  rawPayload: z.any().optional(),
  lastSyncAt: z.string().datetime().or(z.date()),
});

export const ProductSectorSchema = z.object({
  productId: z.string().uuid(),
  sectorId: z.string().uuid(),
  notes: z.string().nullable().optional(),
  sector: SectorSchema.optional(), // Populated in some responses
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  omieProductId: z.string().uuid(),
  nickname: z.string().nullable().optional(),
  active: z.boolean(),
  omieProduct: OmieProductSchema.optional(), // Populated in some responses
  productSector: ProductSectorSchema.nullable().optional(), // Populated in some responses
});

export type OmieProduct = z.infer<typeof OmieProductSchema>;
export type ProductSector = z.infer<typeof ProductSectorSchema>;
export type Product = z.infer<typeof ProductSchema>;

// Input schemas para as APIs
export const CreateProductInputSchema = z.object({
  omieProductId: z.string().uuid(),
});

export const UpdateProductSectorInputSchema = z.object({
  sectorId: z.string().uuid('ID de setor inválido'),
  notes: z.string().optional(),
});
