import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { SyncOmieProductsService } from '../core/SyncOmieProductsService';

export async function omieRoutes(app: FastifyInstance) {
  // Rota de Sincronização
  app.post('/v1/omie/sync/products', async (request, reply) => {
    const service = new SyncOmieProductsService();
    // Utilizando o método execute() que foi criado no passo anterior
    const result = await service.execute();
    return reply.send(result);
  });

  // Rota de Listagem do Espelho Local
  app.get('/v1/omie/products', async (request, reply) => {
    const querySchema = z.object({
      search: z.string().optional(),
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(100).default(50),
    });

    const { search, page, pageSize } = querySchema.parse(request.query);

    // Filtro condicional por descrição (case-insensitive)
    const where = search
      ? {
          description: {
            contains: search,
            mode: 'insensitive' as const, // Específico para o provider PostgreSQL
          },
        }
      : {};

    // Executa contagem total e busca paginada em paralelo
    const [items, total] = await Promise.all([
      prisma.omieProduct.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          description: 'asc',
        },
      }),
      prisma.omieProduct.count({ where }),
    ]);

    return reply.send({ items, total });
  });
}
