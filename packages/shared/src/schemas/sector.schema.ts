import { z } from 'zod';

export const SectorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  order: z.number().int(),
  active: z.boolean(),
});

export type Sector = z.infer<typeof SectorSchema>;

// Input schemas para as APIs
export const CreateSectorInputSchema = z.object({
  name: z.string().min(1, 'Nome do setor é obrigatório'),
  order: z.number().int().optional().default(0),
});

export const UpdateSectorInputSchema = z.object({
  name: z.string().min(1).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});
