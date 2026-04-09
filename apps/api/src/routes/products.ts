import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

export async function productsRoutes(app: FastifyInstance) {
  // POST /v1/products - Seleciona um produto do Omie para o Gerenciador
  app.post('/v1/products', async (request, reply) => {
    const bodySchema = z.object({
      omieProductId: z.string().uuid(),
    });

    const { omieProductId } = bodySchema.parse(request.body);

    const omieProduct = await prisma.omieProduct.findUnique({
      where: { id: omieProductId },
    });

    if (!omieProduct) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Produto Omie não encontrado.' });
    }

    const existing = await prisma.product.findUnique({
      where: { omieProductId },
    });

    if (existing) {
      return reply.status(409).send({ code: 'CONFLICT', message: 'Produto já está selecionado.' });
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

    const { id } = paramsSchema.parse(request.params);

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Produto não encontrado.' });
    }

    await prisma.product.delete({
      where: { id },
    });

    return reply.send({ success: true });
  });
}
