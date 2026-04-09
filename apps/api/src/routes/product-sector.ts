import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

export async function productSectorRoutes(app: FastifyInstance) {
  // PUT /v1/products/:productId/sector
  app.put('/v1/products/:productId/sector', async (request, reply) => {
    const paramsSchema = z.object({
      productId: z.string().uuid('ID de produto inválido'),
    });

    const bodySchema = z.object({
      sectorId: z.string().uuid('ID de setor inválido'),
      notes: z.string().optional(),
    });

    const { productId } = paramsSchema.parse(request.params);
    const { sectorId, notes } = bodySchema.parse(request.body);

    // 1. Valida se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return reply.status(404).send({
        code: 'NOT_FOUND',
        message: 'Produto não encontrado.',
      });
    }

    // 2. Valida se o setor existe e está ativo
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId },
    });

    if (!sector || !sector.active) {
      return reply.status(400).send({
        code: 'BAD_REQUEST',
        message: 'Setor não encontrado ou inativo.',
      });
    }

    // 3. Faz o Upsert do mapeamento
    const productSector = await prisma.productSector.upsert({
      where: { productId },
      create: {
        productId,
        sectorId,
        notes,
      },
      update: {
        sectorId,
        notes,
      },
    });

    return reply.status(200).send(productSector);
  });

  // GET /v1/products/:productId/sector
  app.get('/v1/products/:productId/sector', async (request, reply) => {
    const paramsSchema = z.object({
      productId: z.string().uuid('ID de produto inválido'),
    });

    const { productId } = paramsSchema.parse(request.params);

    // Verifica se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return reply.status(404).send({
        code: 'NOT_FOUND',
        message: 'Produto não encontrado.',
      });
    }

    // Busca o mapeamento com os dados do setor populados
    const productSector = await prisma.productSector.findUnique({
      where: { productId },
      include: {
        sector: true,
      },
    });

    // Se não existir o mapeamento, retorna 200 com null para sinalizar a falta de vínculo
    return reply.send({ data: productSector || null });
  });
}
