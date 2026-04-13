import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { NotFoundError, ConflictError, ValidationError } from '../utils/domainErrors';
import { CreateProductInputSchema } from '@shared/contracts';
import { z } from 'zod';
import { paginated } from '../lib/http';

export async function productsRoutes(app: FastifyInstance) {
  // POST /v1/products - Seleciona um produto do Omie para o Gerenciador
  app.post('/v1/products', async (request, reply) => {
    const parseResult = CreateProductInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError('Corpo da requisição inválido', parseResult.error.format());
    }

    const { omieProductId } = parseResult.data;

    const omieProduct = await prisma.omieProduct.findUnique({
      where: { id: omieProductId },
    });

    if (!omieProduct) {
      throw new NotFoundError('Produto Omie');
    }

    const existing = await prisma.product.findUnique({
      where: { omieProductId },
    });

    if (existing) {
      throw new ConflictError('Produto já está selecionado.');
    }

    const product = await prisma.product.create({
      data: {
        omieProductId,
      },
    });

    return reply.status(201).send(product);
  });

  // POST /v1/products/bulk - Seleciona vários produtos do Omie para o Gerenciador
  app.post('/v1/products/bulk', async (request, reply) => {
    const schema = z.object({
      omieProductIds: z.array(z.string().uuid()).min(1).max(5000),
    });

    const parseResult = schema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError('Corpo da requisição inválido', parseResult.error.format());
    }

    const uniqueIds = Array.from(new Set(parseResult.data.omieProductIds));

    const omieProducts = await prisma.omieProduct.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    const omieProductIdSet = new Set(omieProducts.map((item) => item.id));
    const missingIds = uniqueIds.filter((id) => !omieProductIdSet.has(id));

    if (missingIds.length > 0) {
      throw new ValidationError('Alguns produtos Omie não existem.', { missingIds });
    }

    const existingProducts = await prisma.product.findMany({
      where: { omieProductId: { in: uniqueIds } },
      select: { omieProductId: true },
    });

    const existingIdSet = new Set(existingProducts.map((item) => item.omieProductId));
    const toCreate = uniqueIds.filter((omieProductId) => !existingIdSet.has(omieProductId));

    const createResult = await prisma.product.createMany({
      data: toCreate.map((omieProductId) => ({ omieProductId })),
      skipDuplicates: true,
    });

    return reply.status(201).send({
      created: createResult.count,
      skippedExisting: existingIdSet.size,
      requested: uniqueIds.length,
    });
  });

  // GET /v1/products - Lista os produtos selecionados
  app.get('/v1/products', async (request, reply) => {
    const products = await prisma.product.findMany({
      include: {
        omieProduct: true,
        productSector: {
          include: {
            sector: true,
          }
        }
      },
      orderBy: {
        omieProduct: {
          description: 'asc'
        }
      }
    });

    return reply.send(
      paginated(products, {
        page: 1,
        pageSize: products.length,
        total: products.length,
      })
    );
  });

  // DELETE /v1/products/:id - Remove um produto do Gerenciador
  app.delete('/v1/products/:id', async (request, reply) => {
    // Como é params não usamos contrato compartilhado aqui
    const { id } = request.params as { id: string };

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundError('Produto');
    }

    await prisma.product.delete({
      where: { id },
    });

    return reply.send({ success: true });
  });
}
