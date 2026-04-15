import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { SetProductDefaultSectorService } from '../services/SetProductDefaultSectorService';
import { NotFoundError, ValidationError } from '../utils/domainErrors';
import { UpdateProductSectorInputSchema } from '@shared/contracts';

export async function productSectorRoutes(app: FastifyInstance) {
  const logDeprecated = (request: any, legacyPath: string, replacementPath: string) => {
    if (process.env.NODE_ENV === 'test') return;
    request.log?.warn?.(
      { legacyPath, replacementPath, requestId: request.requestId },
      'Deprecated endpoint used'
    );
  };

  // PUT /v1/products/:productId/sector
  const setDefaultSectorHandler = async (request: any, reply: any) => {
    const paramsSchema = z.object({
      productId: z.string().uuid('ID de produto inválido'),
    });

    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) throw new ValidationError('ID inválido.', paramsResult.error.format());

    const bodyResult = UpdateProductSectorInputSchema.safeParse(request.body);
    if (!bodyResult.success) throw new ValidationError('Dados inválidos.', bodyResult.error.format());

    const { productId } = paramsResult.data;
    const { sectorId, notes } = bodyResult.data;

    const service = new SetProductDefaultSectorService();
    const productSector = await service.execute({ productId, sectorId, notes });

    return reply.status(200).send(productSector);
  };

  // GET /v1/products/:productId/sector
  const getDefaultSectorHandler = async (request: any, reply: any) => {
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
  };

  app.put('/v1/admin/products/:productId/sector', setDefaultSectorHandler);
  app.get('/v1/admin/products/:productId/sector', getDefaultSectorHandler);

  app.put('/v1/products/:productId/sector', async (request, reply) => {
    logDeprecated(request, '/v1/products/:productId/sector (PUT)', '/v1/admin/products/:productId/sector (PUT)');
    return setDefaultSectorHandler(request, reply);
  });

  app.get('/v1/products/:productId/sector', async (request, reply) => {
    logDeprecated(request, '/v1/products/:productId/sector (GET)', '/v1/admin/products/:productId/sector (GET)');
    return getDefaultSectorHandler(request, reply);
  });
}
