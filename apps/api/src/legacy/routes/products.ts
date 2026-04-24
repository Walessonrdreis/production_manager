import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { NotFoundError, ConflictError, ValidationError } from '../utils/domainErrors';
import { CreateProductInputSchema } from '@shared/contracts';
import { z } from 'zod';
import { markDeprecated, ok, paginated, wantsLegacyResponse } from '../lib/http';
import { AppError } from '../legacy/core/errors/AppError';
import { OmieAdapter } from '../legacy/integrations/omie/OmieAdapter';
import { getPublicProductByCode, listPublicProducts } from '../legacy/services/publicProductsRead.service';
/**
 * @deprecated
 */
export async function productsRoutes(app: FastifyInstance) {
  const toNumber = (value: any): number | null => {
    if (value == null) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
      const parsed = Number(value.trim().replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof value?.toNumber === 'function') {
      const num = value.toNumber();
      return Number.isFinite(num) ? num : null;
    }
    // Last resort: try to convert to string and parse
  
    const asString = typeof value?.toString === 'function' ? value.toString() : String(value);
    const parsed = Number(String(asString).trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const publicListProductsHandler = async (request: any, reply: any) => {
    const querySchema = z.object({
      q: z.string().optional(),
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).max(200).default(50),
    });

    const { q, page, pageSize } = querySchema.parse(request.query);
    const { data, meta } = await listPublicProducts({
      q,
      page,
      pageSize,
      activeOnly: true,
    });

    return reply.send(
      paginated(data, meta)
    );
  };

  const publicGetProductByOmieCodeHandler = async (request: any, reply: any) => {
    const paramsSchema = z.object({
      omieCode: z.string().trim().min(1),
    });

    const { omieCode } = paramsSchema.parse(request.params);
    const product = await getPublicProductByCode(omieCode);
    if (!product) throw new AppError('PRODUCT_NOT_FOUND', 404, 'Product not found');

    return reply.send(
      ok(product, {})
    );
  };

  async function resolveOmieCodeFromProduct(productId: string): Promise<{
    productId: string;
    omieCode: string;
  }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, omieProductId: true },
    });

    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 404, 'Product not found');
    }

    if (!product.omieProductId) {
      throw new AppError('OMIE_PRODUCT_LINK_MISSING', 409, 'Product is not linked to an OmieProduct');
    }

    const omieProduct = await prisma.omieProduct.findUnique({
      where: { id: product.omieProductId },
      select: { omieCode: true, omieId: true, rawPayload: true },
    });

    if (!omieProduct) {
      throw new AppError('OMIE_PRODUCT_NOT_FOUND', 404, 'Omie product not found');
    }

    const extractedOmieCode = OmieAdapter.extractProductCode(omieProduct.rawPayload)?.trim();
    const omieCode = extractedOmieCode || omieProduct.omieCode || omieProduct.omieId;

    if (!omieCode) {
      throw new AppError('OMIE_CODE_NOT_FOUND', 422, 'Omie code not found');
    }

    return { productId: product.id, omieCode };
  }

  app.get('/v1/products', publicListProductsHandler);

  app.get('/v1/products/:omieCode([A-Za-z0-9]{1,64})', publicGetProductByOmieCodeHandler);

  app.get('/v1/products/stock', async (request, reply) => {
    markDeprecated(request, reply, '/v1/products/stock', '/v1/products');
    return publicListProductsHandler(request, reply);
  });

  // POST /v1/products - Seleciona um produto do Omie para o Gerenciador
  const createManagedProductHandler = async (request: any, reply: any) => {
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
  };

  app.post('/v1/admin/managed-products', createManagedProductHandler);

  app.post('/v1/admin/products', async (request, reply) => {
    markDeprecated(request, reply, '/v1/admin/products (POST)', '/v1/admin/managed-products (POST)');
    return createManagedProductHandler(request, reply);
  });

  app.post('/v1/products', async (request, reply) => {
    markDeprecated(request, reply, '/v1/products (POST)', '/v1/admin/managed-products (POST)');
    return createManagedProductHandler(request, reply);
  });

  // POST /v1/products/bulk - Seleciona vários produtos do Omie para o Gerenciador
  const createManagedProductsBulkHandler = async (request: any, reply: any) => {
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
  };

  app.post('/v1/admin/managed-products/bulk', createManagedProductsBulkHandler);

  app.post('/v1/admin/products/bulk', async (request, reply) => {
    markDeprecated(request, reply, '/v1/admin/products/bulk (POST)', '/v1/admin/managed-products/bulk (POST)');
    return createManagedProductsBulkHandler(request, reply);
  });

  app.post('/v1/products/bulk', async (request, reply) => {
    markDeprecated(request, reply, '/v1/products/bulk (POST)', '/v1/admin/managed-products/bulk (POST)');
    return createManagedProductsBulkHandler(request, reply);
  });

  const listManagedProductsHandler = async (request: any, reply: any) => {
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

    if (wantsLegacyResponse(request)) {
      return reply.send({ items: products });
    }

    return reply.send(
      paginated(products, {
        page: 1,
        pageSize: products.length,
        total: products.length,
      })
    );
  };

  app.get('/v1/admin/managed-products', listManagedProductsHandler);

  app.get('/v1/admin/products', async (request, reply) => {
    markDeprecated(request, reply, '/v1/admin/products (GET)', '/v1/admin/managed-products (GET)');
    return listManagedProductsHandler(request, reply);
  });

  app.get('/v1/products/managed', async (request, reply) => {
    markDeprecated(request, reply, '/v1/products/managed', '/v1/admin/managed-products');
    return listManagedProductsHandler(request, reply);
  });

  const getManagedProductHandler = async (request: any, reply: any) => {
    const paramsSchema = z.object({
      id: z.string(),
    });

    const { id } = paramsSchema.parse(request.params);
    const looksLikeUuid = z.string().uuid().safeParse(id).success;

    if (!looksLikeUuid) {
      throw new AppError('PRODUCT_NOT_FOUND', 404, 'Product not found');
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        omieProduct: true,
        productSector: {
          include: {
            sector: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError('PRODUCT_NOT_FOUND', 404, 'Product not found');
    }

    return reply.send(
      ok({
        id: product.id,
        nickname: product.nickname,
        active: product.active,
        omieProductId: product.omieProductId,
        omieProduct: {
          id: product.omieProduct.id,
          description: product.omieProduct.description,
          sku: product.omieProduct.sku,
          familyDescription: OmieAdapter.extractFamilyDescription(product.omieProduct.rawPayload),
          active: product.omieProduct.active,
        },
        productSector: product.productSector
          ? {
              sectorId: product.productSector.sectorId,
              notes: product.productSector.notes,
              sector: {
                id: product.productSector.sector.id,
                name: product.productSector.sector.name,
                order: product.productSector.sector.order,
              },
            }
          : null,
      })
    );
  };

  app.get('/v1/admin/managed-products/:id', getManagedProductHandler);

  app.get('/v1/admin/products/:id', async (request, reply) => {
    markDeprecated(request, reply, '/v1/admin/products/:id (GET)', '/v1/admin/managed-products/:id (GET)');
    return getManagedProductHandler(request, reply);
  });

  app.get('/v1/products/:id', async (request, reply) => {
    markDeprecated(request, reply, '/v1/products/:id', '/v1/admin/managed-products/:id');
    return getManagedProductHandler(request, reply);
  });

  const patchManagedProductHandler = async (request: any, reply: any) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      data: z
        .object({
          nickname: z.string().trim().min(1).optional(),
          active: z.boolean().optional(),
        })
        .refine((value) => value.nickname !== undefined || value.active !== undefined, {
          message: 'At least one field is required',
        }),
    });

    const { id } = paramsSchema.parse(request.params);
    const { data } = bodySchema.parse(request.body);

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError('PRODUCT_NOT_FOUND', 404, 'Product not found');
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(data.nickname !== undefined ? { nickname: data.nickname } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
      select: {
        id: true,
        nickname: true,
        active: true,
        omieProductId: true,
      },
    });

    return reply.send(ok(updated));
  };

  app.patch('/v1/admin/managed-products/:id', patchManagedProductHandler);

  app.patch('/v1/admin/products/:id', async (request, reply) => {
    markDeprecated(request, reply, '/v1/admin/products/:id (PATCH)', '/v1/admin/managed-products/:id (PATCH)');
    return patchManagedProductHandler(request, reply);
  });

  app.patch('/v1/products/:id', async (request, reply) => {
    markDeprecated(request, reply, '/v1/products/:id (PATCH)', '/v1/admin/managed-products/:id (PATCH)');
    return patchManagedProductHandler(request, reply);
  });

  // DELETE /v1/products/:id - Remove um produto do Gerenciador
  const deleteManagedProductHandler = async (request: any, reply: any) => {
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
  };

  app.delete('/v1/admin/managed-products/:id', deleteManagedProductHandler);

  app.delete('/v1/admin/products/:id', async (request, reply) => {
    markDeprecated(request, reply, '/v1/admin/products/:id (DELETE)', '/v1/admin/managed-products/:id (DELETE)');
    return deleteManagedProductHandler(request, reply);
  });

  app.delete('/v1/products/:id', async (request, reply) => {
    markDeprecated(request, reply, '/v1/products/:id (DELETE)', '/v1/admin/managed-products/:id (DELETE)');
    return deleteManagedProductHandler(request, reply);
  });

  const getManagedProductStockHandler = async (request: any, reply: any) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const { productId, omieCode } = await resolveOmieCodeFromProduct(id);

    const latestRows = await (prisma as any).productStock.findMany({
      where: { omieCode },
      orderBy: { capturedAt: 'desc' },
      take: 1,
      select: {
        stockQuantity: true,
        minimumStock: true,
        capturedAt: true,
      },
    });

    const latest = latestRows[0];

    if (!latest) {
      throw new AppError('STOCK_NOT_FOUND', 404, 'Stock not found');
    }

    const rawQty = toNumber(latest.stockQuantity);
    const rawMin = toNumber(latest.minimumStock);
    const reported = rawQty != null || rawMin != null;
    const quantity = (rawQty ?? 0).toFixed(4);
    const minimum = (rawMin ?? 0).toFixed(4);

    return reply.send(
      ok({
        productId,
        omieCode,
        quantity,
        reported,
        rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
        minimum,
        rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
        stockQuantity: quantity,
        minimumStock: minimum,
        capturedAt: latest.capturedAt,
      })
    );
  };

  app.get('/v1/admin/managed-products/:id/stock', getManagedProductStockHandler);

  app.get('/v1/admin/products/:id/stock', async (request, reply) => {
    markDeprecated(request, reply, '/v1/admin/products/:id/stock (GET)', '/v1/admin/managed-products/:id/stock (GET)');
    return getManagedProductStockHandler(request, reply);
  });

  app.get('/v1/products/:id/stock', async (request, reply) => {
    markDeprecated(request, reply, '/v1/products/:id/stock', '/v1/admin/managed-products/:id/stock');
    return getManagedProductStockHandler(request, reply);
  });

  const getManagedProductStockHistoryHandler = async (request: any, reply: any) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      pageSize: z.coerce.number().min(1).default(50),
    });

    const { id } = paramsSchema.parse(request.params);
    const { page, pageSize } = querySchema.parse(request.query);
    const safePageSize = Math.min(pageSize, 100);

    const { productId, omieCode } = await resolveOmieCodeFromProduct(id);

    const [total, rows] = await Promise.all([
      (prisma as any).productStock.count({ where: { omieCode } }),
      (prisma as any).productStock.findMany({
        where: { omieCode },
        orderBy: { capturedAt: 'desc' },
        skip: (page - 1) * safePageSize,
        take: safePageSize,
        select: {
          stockQuantity: true,
          minimumStock: true,
          capturedAt: true,
        },
      }),
    ]);

    return reply.send(
      paginated(
        rows.map((row: any) => {
          const rawQty = toNumber(row.stockQuantity);
          const rawMin = toNumber(row.minimumStock);
          const reported = rawQty != null || rawMin != null;
          const quantity = (rawQty ?? 0).toFixed(4);
          const minimum = (rawMin ?? 0).toFixed(4);

          return {
            productId,
            omieCode,
            quantity,
            reported,
            rawQuantity: rawQty == null ? null : rawQty.toFixed(4),
            minimum,
            rawMinimum: rawMin == null ? null : rawMin.toFixed(4),
            stockQuantity: quantity,
            minimumStock: minimum,
            capturedAt: row.capturedAt,
          };
        }),
        {
          page,
          pageSize: safePageSize,
          total,
        }
      )
    );
  };

  app.get('/v1/admin/managed-products/:id/stock/history', getManagedProductStockHistoryHandler);

  app.get('/v1/admin/products/:id/stock/history', async (request, reply) => {
    markDeprecated(request, reply, '/v1/admin/products/:id/stock/history (GET)', '/v1/admin/managed-products/:id/stock/history (GET)');
    return getManagedProductStockHistoryHandler(request, reply);
  });

  app.get('/v1/products/:id/stock/history', async (request, reply) => {
    markDeprecated(request, reply, '/v1/products/:id/stock/history', '/v1/admin/managed-products/:id/stock/history');
    return getManagedProductStockHistoryHandler(request, reply);
  });
}
