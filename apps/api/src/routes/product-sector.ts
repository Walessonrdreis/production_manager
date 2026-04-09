import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { SetProductDefaultSectorService } from '../services/SetProductDefaultSectorService';
import { NotFoundError, ValidationError } from '../utils/domainErrors';

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

    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) throw new ValidationError('ID inválido.', paramsResult.error.format());

    const bodyResult = bodySchema.safeParse(request.body);
    if (!bodyResult.success) throw new ValidationError('Dados inválidos.', bodyResult.error.format());

    const { productId } = paramsResult.data;
    const { sectorId, notes } = bodyResult.data;

    const service = new SetProductDefaultSectorService();
    const productSector = await service.execute({ productId, sectorId, notes });

    return reply.status(200).send(productSector);
  });

  // GET /v1/products/:productId/sector
  app.get('/v1/products/:productId/sector', async (request, reply) => {
    const paramsSchema = z.object({
      productId: z.string().uuid('ID de produto inválido'),
    });

    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) throw new ValidationError('ID inválido.', paramsResult.error.format());

    const { productId } = paramsResult.data;

    // Verifica se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundError('Produto');
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
