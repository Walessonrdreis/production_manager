import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { NotFoundError, ConflictError, ValidationError } from '../utils/domainErrors';

export async function productsRoutes(app: FastifyInstance) {
  // POST /v1/products - Seleciona um produto do Omie para o Gerenciador
  app.post('/v1/products', async (request, reply) => {
    const bodySchema = z.object({
      omieProductId: z.string().uuid(),
    });

    const parseResult = bodySchema.safeParse(request.body);
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

    return reply.send({ items: products });
  });

  // DELETE /v1/products/:id - Remove um produto do Gerenciador
  app.delete('/v1/products/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const parseResult = paramsSchema.safeParse(request.params);
    if (!parseResult.success) {
      throw new ValidationError('ID inválido', parseResult.error.format());
    }

    const { id } = parseResult.data;

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
