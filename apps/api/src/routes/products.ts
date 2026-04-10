import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { NotFoundError, ConflictError, ValidationError } from '../utils/domainErrors';
import { CreateProductInputSchema } from '@shared/contracts';

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
