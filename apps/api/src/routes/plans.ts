import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { CreatePlanItemService } from '../services/CreatePlanItemService';
import { CreatePlanService } from '../services/CreatePlanService';
import { NotFoundError, ValidationError } from '../utils/domainErrors';
import { CreatePlanInputSchema, AddPlanItemInputSchema } from '@shared/contracts';
import { paginated } from '../lib/http';

export async function plansRoutes(app: FastifyInstance) {
  // 1. POST /v1/plans
  app.post('/v1/plans', async (request, reply) => {
    const parseResult = CreatePlanInputSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new ValidationError('Dados inválidos.', parseResult.error.format());
    }

    const { name, startDate, endDate } = parseResult.data;

    const service = new CreatePlanService();
    const plan = await service.execute({ name, startDate, endDate });

    return reply.status(201).send(plan);
  });

  // 2. GET /v1/plans
  app.get('/v1/plans', async (request, reply) => {
    const plans = await prisma.productionPlan.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(
      paginated(plans, {
        page: 1,
        pageSize: plans.length,
        total: plans.length,
      })
    );
  });

  // 3. GET /v1/plans/:id
  app.get('/v1/plans/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid('ID inválido.'),
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
      throw new NotFoundError('Plano');
    }

    return reply.send(plan);
  });

  // 4. POST /v1/plans/:id/items
  app.post('/v1/plans/:id/items', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) throw new ValidationError('ID inválido.');
    
    const bodyResult = AddPlanItemInputSchema.safeParse(request.body);
    if (!bodyResult.success) throw new ValidationError('Corpo inválido.', bodyResult.error.format());

    const { id } = paramsResult.data;
    const { productId, quantity, sectorId, notes } = bodyResult.data;

    const service = new CreatePlanItemService();
    const item = await service.execute({
      planId: id,
      productId,
      quantity,
      sectorId,
      notes,
    });

    return reply.status(201).send(item);
  });

  // 5. GET /v1/plans/:id/by-sector
  app.get('/v1/plans/:id/by-sector', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) throw new ValidationError('ID inválido.');

    const { id } = paramsResult.data;

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

    if (!plan) throw new NotFoundError('Plano');

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

    const paramsResult = paramsSchema.safeParse(request.params);
    if (!paramsResult.success) throw new ValidationError('ID inválido.');

    const { id } = paramsResult.data;

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

    if (!plan) throw new NotFoundError('Plano');

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
