import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { SyncOmieProductsService } from '../core/SyncOmieProductsService';
import { OmieAdapter } from '../integrations/omie/OmieAdapter';
import { omieClient } from '../integrations/omie/OmieClient';

const OMIE_STOCK_PATH = 'estoque/consulta/';

function formatOmieDate(date: Date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

async function fetchStockByProductId(productId: number): Promise<string | null> {
  const response = await omieClient.post<any>(OMIE_STOCK_PATH, {
    call: 'PosicaoEstoque',
    param: [
      {
        codigo_local_estoque: 0,
        id_prod: productId,
        data: formatOmieDate(new Date()),
      },
    ],
  });

  return OmieAdapter.extractAvailableStockFromConsultResponse(response);
}

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

    const stockQuantities = new Map<string, string | null>();

    await Promise.all(
      items.map(async (item) => {
        const rawPayload = item.rawPayload as Record<string, unknown> | null;
        const productId = Number(rawPayload?.codigo_produto ?? rawPayload?.id_prod ?? rawPayload?.idProd);
        const fallbackStock = OmieAdapter.extractStockQuantity(rawPayload);

        if (!Number.isFinite(productId) || productId <= 0) {
          stockQuantities.set(item.id, fallbackStock);
          return;
        }

        try {
          const availableStock = await fetchStockByProductId(productId);
          stockQuantities.set(item.id, availableStock ?? fallbackStock);
        } catch {
          stockQuantities.set(item.id, fallbackStock);
        }
      })
    );

    return reply.send({
      items: items.map((item) => ({
        ...item,
        code: OmieAdapter.extractProductCode(item.rawPayload),
        stockQuantity: stockQuantities.get(item.id) ?? OmieAdapter.extractStockQuantity(item.rawPayload),
        minimumStock: OmieAdapter.extractMinimumStock(item.rawPayload),
      })),
      total,
    });
  });
}
