import { z } from 'zod';
import { SectorSchema } from './sector.schema';
import { ProductSchema } from './product.schema';

export const PlanStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']);

export const ProductionPlanItemSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  productId: z.string().uuid(),
  sectorId: z.string().uuid(),
  quantity: z.number().int().positive(),
  notes: z.string().nullable().optional(),
  
  // Relações embutidas (quando feitas via populate do Prisma)
  sector: SectorSchema.optional(),
  product: ProductSchema.optional(),
});

export const ProductionPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  status: PlanStatusEnum,
  createdAt: z.string().datetime().or(z.date()),
  items: z.array(ProductionPlanItemSchema).optional(),
});

export type PlanStatus = z.infer<typeof PlanStatusEnum>;
export type ProductionPlanItem = z.infer<typeof ProductionPlanItemSchema>;
export type ProductionPlan = z.infer<typeof ProductionPlanSchema>;

// Input schemas para as APIs
export const CreatePlanInputSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),
});

export const AddPlanItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  sectorId: z.string().uuid().optional(),
  notes: z.string().optional(),
});
