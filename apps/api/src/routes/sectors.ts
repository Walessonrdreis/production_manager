import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { sendError, ErrorCodes } from '../utils/errors';

export async function sectorRoutes(app: FastifyInstance) {
  // POST /v1/sectors
  app.post('/v1/sectors', async (request, reply) => {
    const bodySchema = z.object({
      name: z.string().min(1, 'Nome do setor é obrigatório'),
      order: z.number().int().optional().default(0),
    });

    const parseResult = bodySchema.safeParse(request.body);
    
    if (!parseResult.success) {
      return sendError(reply, 400, ErrorCodes.VALIDATION_ERROR, 'Dados inválidos.', parseResult.error.format());
    }

    const data = parseResult.data;

    const existingSector = await prisma.sector.findUnique({
      where: { name: data.name },
    });

    if (existingSector) {
      return sendError(reply, 409, ErrorCodes.CONFLICT, 'Um setor com este nome já existe.');
    }

    const sector = await prisma.sector.create({
      data,
    });

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

    const bodySchema = z.object({
      name: z.string().min(1).optional(),
      order: z.number().int().optional(),
      active: z.boolean().optional(),
    });

    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) {
       return sendError(reply, 400, ErrorCodes.VALIDATION_ERROR, 'ID de rota inválido.', paramsResult.error.format());
    }

    const bodyResult = bodySchema.safeParse(request.body);
    if (!bodyResult.success) {
       return sendError(reply, 400, ErrorCodes.VALIDATION_ERROR, 'Dados de atualização inválidos.', bodyResult.error.format());
    }

    const { id } = paramsResult.data;
    const data = bodyResult.data;

    // Verifica se o setor existe
    const sector = await prisma.sector.findUnique({
      where: { id },
    });

    if (!sector) {
      return sendError(reply, 404, ErrorCodes.NOT_FOUND, 'Setor não encontrado.');
    }

    // Se estiver tentando alterar o nome, verifica colisão
    if (data.name && data.name !== sector.name) {
      const existingName = await prisma.sector.findUnique({
        where: { name: data.name },
      });

      if (existingName) {
        return sendError(reply, 409, ErrorCodes.CONFLICT, 'Um setor com este nome já existe.');
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
       return sendError(reply, 400, ErrorCodes.VALIDATION_ERROR, 'ID de rota inválido.', paramsResult.error.format());
    }

    const { id } = paramsResult.data;

    const sector = await prisma.sector.findUnique({
      where: { id },
    });

    if (!sector) {
      return sendError(reply, 404, ErrorCodes.NOT_FOUND, 'Setor não encontrado.');
    }

    const deletedSector = await prisma.sector.update({
      where: { id },
      data: { active: false },
    });

    return reply.send(deletedSector);
  });
}
