import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../infra/db';
import { CreateSectorService } from '../services/CreateSectorService';
import { NotFoundError, ConflictError, ValidationError } from '../utils/domainErrors';
import { CreateSectorInputSchema, UpdateSectorInputSchema } from '@shared/contracts';
import { markDeprecated, paginated, wantsLegacyResponse } from '../../lib/http';

export async function sectorRoutes(app: FastifyInstance) {
  // POST /v1/sectors
  const createSectorHandler = async (request: any, reply: any) => {
    const parseResult = CreateSectorInputSchema.safeParse(request.body);
    
    if (!parseResult.success) {
      throw new ValidationError('Dados inválidos.', parseResult.error.format());
    }

    const { name, order } = parseResult.data;

    const service = new CreateSectorService();
    const sector = await service.execute({ name, order });

    return reply.status(201).send(sector);
  };

  // GET /v1/sectors
  const listSectorsHandler = async (request: any, reply: any) => {
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

    if (wantsLegacyResponse(request)) {
      return reply.send({ items: sectors });
    }

    return reply.send(
      paginated(sectors, {
        page: 1,
        pageSize: sectors.length,
        total: sectors.length,
      })
    );
  };

  // PATCH /v1/sectors/:id
  const patchSectorHandler = async (request: any, reply: any) => {
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
  };

  // DELETE /v1/sectors/:id (soft delete)
  const deleteSectorHandler = async (request: any, reply: any) => {
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
  };

  app.post('/v1/admin/sectors', createSectorHandler);
  app.get('/v1/admin/sectors', listSectorsHandler);
  app.patch('/v1/admin/sectors/:id', patchSectorHandler);
  app.delete('/v1/admin/sectors/:id', deleteSectorHandler);

  app.post('/v1/sectors', async (request, reply) => {
    markDeprecated(request, reply, '/v1/sectors (POST)', '/v1/admin/sectors (POST)');
    return createSectorHandler(request, reply);
  });

  app.get('/v1/sectors', async (request, reply) => {
    markDeprecated(request, reply, '/v1/sectors (GET)', '/v1/admin/sectors (GET)');
    return listSectorsHandler(request, reply);
  });

  app.patch('/v1/sectors/:id', async (request, reply) => {
    markDeprecated(request, reply, '/v1/sectors/:id (PATCH)', '/v1/admin/sectors/:id (PATCH)');
    return patchSectorHandler(request, reply);
  });

  app.delete('/v1/sectors/:id', async (request, reply) => {
    markDeprecated(request, reply, '/v1/sectors/:id (DELETE)', '/v1/admin/sectors/:id (DELETE)');
    return deleteSectorHandler(request, reply);
  });
}
