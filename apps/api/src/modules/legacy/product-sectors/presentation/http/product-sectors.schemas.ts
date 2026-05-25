import { z } from 'zod'

export const listSectorsQuerySchema = z.object({
  includeInactive: z
    .string()
    .optional()
    .transform(v => v === 'true'),
})

export const sectorIdParamsSchema = z.object({
  id: z.string().min(1, 'id é obrigatório'),
})

export const updateSectorBodySchema = z.object({
  name: z.string().min(1, 'nome é obrigatório').optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
})
