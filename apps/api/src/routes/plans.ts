import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

export async function plansRoutes(app: FastifyInstance) {
  // 1. POST /v1/plans
  app.post('/v1/plans', async (request, reply) => {
    const bodySchema = z.object({
      name: z.string().min(1, 'Nome é obrigatório'),
      startDate: z.string().datetime({ offset: true }),
      endDate: z.string().datetime({ offset: true }),
    });

    const data = bodySchema.parse(request.body);

    const plan = await prisma.productionPlan.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });

    return reply.status(201).send(plan);
  });

  // 2. GET /v1/plans
  app.get('/v1/plans', async (request, reply) => {
    const plans = await prisma.productionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ items: plans });
  });

  // 3. GET /v1/plans/:id
  app.get('/v1/plans/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const plan = await prisma.productionPlan.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { include: { omieProduct: true } },
            sector: true,
          },
        },
      },
    });

    if (!plan) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
    }

    return reply.send(plan);
  });

  // 4. POST /v1/plans/:id/items
  app.post('/v1/plans/:id/items', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      sectorId: z.string().uuid().optional(),
      notes: z.string().optional(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { productId, quantity, sectorId, notes } = bodySchema.parse(request.body);

    const plan = await prisma.productionPlan.findUnique({ where: { id } });
    if (!plan) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Produto não encontrado' });
    }

    let finalSectorId = sectorId;

    if (!finalSectorId) {
      const productSector = await prisma.productSector.findUnique({
        where: { productId },
      });

      if (!productSector) {
        return reply.status(400).send({
          code: 'MISSING_DEFAULT_SECTOR',
          message: 'Produto não possui setor padrão. Informe o sectorId.',
        });
      }
      finalSectorId = productSector.sectorId;
    } else {
      const sector = await prisma.sector.findUnique({ where: { id: finalSectorId } });
      if (!sector || !sector.active) {
        return reply.status(400).send({ code: 'BAD_REQUEST', message: 'Setor inválido ou inativo' });
      }
    }

    const item = await prisma.productionPlanItem.create({
      data: {
        planId: id,
        productId,
        sectorId: finalSectorId,
        quantity,
        notes,
      },
    });

    return reply.status(201).send(item);
  });

  // 5. GET /v1/plans/:id/by-sector
  app.get('/v1/plans/:id/by-sector', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const plan = await prisma.productionPlan.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            sector: true,
            product: { include: { omieProduct: true } },
          },
        },
      },
    });

    if (!plan) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
    }

    // Agrupamento manual em memória
    const groupedMap = new Map<string, { sector: any; items: any[] }>();

    for (const item of plan.items) {
      const sectorId = item.sector.id;

      if (!groupedMap.has(sectorId)) {
        groupedMap.set(sectorId, {
          sector: { id: item.sector.id, name: item.sector.name, order: item.sector.order },
          items: [],
        });
      }

      groupedMap.get(sectorId)!.items.push({
        itemId: item.id,
        productId: item.productId,
        productDescription: item.product.omieProduct.description,
        quantity: item.quantity,
      });
    }

    const result = Array.from(groupedMap.values()).sort((a, b) => {
      if (a.sector.order !== b.sector.order) return a.sector.order - b.sector.order;
      return a.sector.name.localeCompare(b.sector.name);
    });

    // Removendo order para igualar a interface de resposta esperada
    const cleanedResult = result.map(group => ({
      sector: { id: group.sector.id, name: group.sector.name },
      items: group.items,
    }));

    return reply.send(cleanedResult);
  });

  // 6. GET /v1/plans/:id/export.csv
  app.get('/v1/plans/:id/export.csv', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const plan = await prisma.productionPlan.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            sector: true,
            product: { include: { omieProduct: true } },
          },
        },
      },
    });

    if (!plan) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Plano não encontrado' });
    }

    // Sort items by Sector order, then sector name, then product description
    const sortedItems = plan.items.sort((a, b) => {
      if (a.sector.order !== b.sector.order) return a.sector.order - b.sector.order;
      if (a.sector.name !== b.sector.name) return a.sector.name.localeCompare(b.sector.name);
      return a.product.omieProduct.description.localeCompare(b.product.omieProduct.description);
    });

    let csvContent = 'Setor;Produto;Quantidade\n';

    for (const item of sortedItems) {
      const sectorName = item.sector.name.replace(/;/g, ',');
      const productName = item.product.omieProduct.description.replace(/;/g, ',');
      csvContent += `${sectorName};${productName};${item.quantity}\n`;
    }

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="plan-${id}.csv"`);
    
    return reply.send(csvContent);
  });
}
