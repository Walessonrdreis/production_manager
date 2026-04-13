import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { SyncOmieProductsService } from '../core/SyncOmieProductsService';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';

export async function omieRoutes(app: FastifyInstance) {
  // Rota de Sincronização
  app.post('/v1/omie/sync/products', async (request, reply) => {
    const querySchema = z.object({
      force: z.coerce.boolean().optional().default(false),
    });

    const { force } = querySchema.parse(request.query);

    // A rota instancia e delega ao Service passando o requestId e o param force
    const service = new SyncOmieProductsService();
    const result = await service.execute(request.requestId, force);
    
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

    return reply.send({
      items: items.map((item) => ({
        ...item,
        code: OmieAdapter.extractProductCode(item.rawPayload),
        stockQuantity: OmieAdapter.extractStockQuantity(item.rawPayload),
      })),
      total,
    });
  });
}
