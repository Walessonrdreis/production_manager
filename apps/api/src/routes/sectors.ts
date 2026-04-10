import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { CreateSectorService } from '../services/CreateSectorService';
import { NotFoundError, ConflictError, ValidationError } from '../utils/domainErrors';
import { CreateSectorInputSchema, UpdateSectorInputSchema } from '@shared/contracts';

export async function sectorRoutes(app: FastifyInstance) {
  // POST /v1/sectors
  app.post('/v1/sectors', async (request, reply) => {
    const parseResult = CreateSectorInputSchema.safeParse(request.body);
    
    if (!parseResult.success) {
      throw new ValidationError('Dados inválidos.', parseResult.error.format());
    }

    const { name, order } = parseResult.data;

    const service = new CreateSectorService();
    const sector = await service.execute({ name, order });

    return reply.status(201).send(sector);
  });

  // GET /v1/sectors
  app.get('/v1/sectors', async (request, reply) => {
    const querySchema = z.object({
      includeInactive: z.coerce.boolean().optional().default(false),
    });

    const { includeInactive } = querySchema.parse(request.query);

    const sectors = await prisma.sector.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });

    return reply.send({ items: sectors });
  });

  // PATCH /v1/sectors/:id
  app.patch('/v1/sectors/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid('ID inválido'),
    });

    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) {
       throw new ValidationError('ID de rota inválido.', paramsResult.error.format());
    }

    const bodyResult = UpdateSectorInputSchema.safeParse(request.body);
    if (!bodyResult.success) {
       throw new ValidationError('Dados de atualização inválidos.', bodyResult.error.format());
    }

    const { id } = paramsResult.data;
    const data = bodyResult.data;

    // Verifica se o setor existe
    const sector = await prisma.sector.findUnique({
      where: { id },
    });

    if (!sector) {
      throw new NotFoundError('Setor');
    }

    // Se estiver tentando alterar o nome, verifica colisão
    if (data.name && data.name !== sector.name) {
      const existingName = await prisma.sector.findUnique({
        where: { name: data.name },
      });

      if (existingName) {
        throw new ConflictError('Um setor com este nome já existe.');
      }
    }

    const updatedSector = await prisma.sector.update({
      where: { id },
      data,
    });

    return reply.send(updatedSector);
  });

  // DELETE /v1/sectors/:id (soft delete)
  app.delete('/v1/sectors/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid('ID inválido'),
    });

    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) {
       throw new ValidationError('ID de rota inválido.', paramsResult.error.format());
    }

    const { id } = paramsResult.data;

    const sector = await prisma.sector.findUnique({
      where: { id },
    });

    if (!sector) {
      throw new NotFoundError('Setor');
    }

    const deletedSector = await prisma.sector.update({
      where: { id },
      data: { active: false },
    });

    return reply.send(deletedSector);
  });
}
