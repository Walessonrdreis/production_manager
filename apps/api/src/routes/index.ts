
import type { FastifyInstance } from 'fastify';
import { sendOk } from '../lib/http';
import { omieRoutes } from './omie';
import { sectorRoutes } from './sectors';
import { productsRoutes } from './products';
import { productSectorRoutes } from './product-sector';
import { plansRoutes } from './plans';

export async function appRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const protocol = request.protocol;
    const hostname = request.hostname;
    const baseUrl = `${protocol}://${hostname}`;

    return sendOk(
      request,
      reply,
      {
        name: 'Production Manager API',
        status: 'ok',
        timestamp: new Date().toISOString(),
        versions: {
          v1: `${baseUrl}/v1`,
        },

        endpoints: {
          health: `${baseUrl}/health`,
          indexV1: `${baseUrl}/v1`,
          docs: `${baseUrl}/docs`,
        },

        resources: {
          publicProducts: `${baseUrl}/v1/products`,
          adminOmie: `${baseUrl}/v1/admin/omie`,
          adminOrders: `${baseUrl}/v1/admin/orders`,
          adminProducts: `${baseUrl}/v1/admin/managed-products`,
          adminSectors: `${baseUrl}/v1/admin/sectors`,
          adminPlans: `${baseUrl}/v1/admin/plans`,
        },

        contracts: {
          public: {
            products: {
              endpoint: `${baseUrl}/v1/products`,
              description:
                'Catálogo público (BizChat): produto + estoque atual + estoque mínimo.',
              fields: {
                omieCode: 'string',
                description: 'string',
                sku: 'string | null',
                stockQuantity: 'string (decimal)',
                minimumStock: 'string (decimal)',
                stockUpdatedAt: 'ISO string | null',
              },
              discover: {
                query: '?describe=true',
                header: 'X-Describe: true',
                pretty: '?pretty=true',
              },
              notes: [
                'Este é o único endpoint público que retorna produtos e estoque',
                'Nenhum outro endpoint é necessário para consumo externo',
              ],
            },
          },
        },

        tips: [
          'Para catálogo e estoque use sempre GET /v1/products',
          'Endpoints admin não fazem parte do contrato público',
          'sync é POST, listas são GET',
          'Para resposta mais legível use ?pretty=true',
        ],
      },
      {}
    );
  });

  app.get('/health', async (request, reply) => {
    return sendOk(request, reply, { ok: true }, {});
  });

  app.get('/v1', async (request, reply) => {
    const publicEndpoints = [
      {
        method: 'GET',
        path: '/v1/products',
        description:
          '[Public][BizChat] Catálogo + estoque atual + estoque mínimo (chave: omieCode).',
        example: 'curl "/v1/products?q=cor&page=1&pageSize=50&pretty=true"',
      },
      {
        method: 'GET',
        path: '/v1/products/:omieCode',
        description: '[Public][BizChat] Detalhe por omieCode.',
        example: 'curl "/v1/products/12345?pretty=true"',
      },
    ];

    const adminEndpoints = [
      { method: 'GET', path: '/v1/admin/omie/categories', description: '[Admin][Omie] Lista categorias/famílias (únicas e ordenadas).' },
      { method: 'GET', path: '/v1/admin/omie/products/search', description: '[Admin][Omie] Busca (autocomplete) no catálogo.' },
      { method: 'GET', path: '/v1/admin/omie/products/:id', description: '[Admin][Omie] Detalhe do produto Omie por UUID.' },
      { method: 'GET', path: '/v1/admin/omie/products/by-code/:omieCode', description: '[Admin][Omie] Detalhe do produto Omie por código.' },
      { method: 'GET', path: '/v1/admin/omie/products/:id/stock', description: '[Admin][Omie] Estoque por UUID do OmieProduct.' },
      { method: 'GET', path: '/v1/admin/omie/products/by-code/:omieCode/stock', description: '[Admin][Omie] Estoque por código do Omie.' },
      { method: 'POST', path: '/v1/admin/omie/sync/products', description: '[Admin][Omie] Sincroniza produtos do Omie.' },
      { method: 'POST', path: '/v1/admin/omie/products/sync', description: '[Admin][Omie] Sincronização manual do catálogo (envelope {data}).' },
      { method: 'POST', path: '/v1/admin/omie/products/stock/refresh', description: '[Admin][Omie] Atualiza e persiste o estoque atual (ProductStock) por omieCode.' },
      { method: 'GET', path: '/v1/admin/omie/products', description: '[Admin][Omie] Lista produtos sincronizados do Omie (filtros e paginação via querystring).' },
      {method: 'POST', path: '/v1/admin/omie/orders/stage20/sync', description: '[Admin][Omie] Sincroniza pedidos de venda do Omie (etapa 20, não cancelados, não encerrados).',},
      {method: 'GET', path: '/v1/admin/orders/stage20/totals',description: '[Admin] Retorna os totais consolidados por descrição (soma de quantidades dos pedidos etapa 20).',},

      { method: 'POST', path: '/v1/admin/managed-products', description: '[Admin] Seleciona um produto Omie para ser gerenciado.' },
      { method: 'POST', path: '/v1/admin/managed-products/bulk', description: '[Admin] Seleciona vários produtos Omie em lote.' },
      { method: 'GET', path: '/v1/admin/managed-products', description: '[Admin] Lista produtos gerenciados.' },
      { method: 'GET', path: '/v1/admin/managed-products/:id', description: '[Admin] Detalhe do produto gerenciado.' },
      { method: 'PATCH', path: '/v1/admin/managed-products/:id', description: '[Admin] Atualiza nickname/active.' },
      { method: 'GET', path: '/v1/admin/managed-products/:id/stock', description: '[Admin] Estoque por UUID do Product.' },
      { method: 'GET', path: '/v1/admin/managed-products/:id/stock/history', description: '[Admin] Histórico de estoque por UUID do Product.' },
      { method: 'DELETE', path: '/v1/admin/managed-products/:id', description: '[Admin] Remove um produto do gerenciador.' },
      { method: 'PUT', path: '/v1/admin/managed-products/:productId/sector', description: '[Admin] Define setor padrão de um produto.' },
      { method: 'GET', path: '/v1/admin/managed-products/:productId/sector', description: '[Admin] Obtém setor padrão de um produto.' },

      { method: 'POST', path: '/v1/admin/sectors', description: '[Admin] Cria um setor.' },
      { method: 'GET', path: '/v1/admin/sectors', description: '[Admin] Lista setores (use includeInactive=true para incluir inativos).' },
      { method: 'PATCH', path: '/v1/admin/sectors/:id', description: '[Admin] Atualiza um setor.' },
      { method: 'DELETE', path: '/v1/admin/sectors/:id', description: '[Admin] Desativa um setor (soft delete).' },

      { method: 'POST', path: '/v1/admin/plans', description: '[Admin] Cria um plano de produção.' },
      { method: 'GET', path: '/v1/admin/plans', description: '[Admin] Lista planos de produção.' },
      { method: 'GET', path: '/v1/admin/plans/:id', description: '[Admin] Detalha um plano (com itens).' },
      { method: 'POST', path: '/v1/admin/plans/:id/items', description: '[Admin] Adiciona item ao plano.' },
      { method: 'GET', path: '/v1/admin/plans/:id/by-sector', description: '[Admin] Lista itens do plano agrupados por setor.' },
      { method: 'GET', path: '/v1/admin/plans/:id/export.csv', description: '[Admin] Exporta o plano em CSV.' },
    ];

    const deprecatedEndpoints = [
      { method: 'GET', path: '/v1/products/stock', replacement: '/v1/products', description: '[Deprecated] Alias do catálogo público.' },
      { method: 'GET', path: '/v1/products/managed', replacement: '/v1/admin/managed-products', description: '[Deprecated] Lista gerenciados.' },
      { method: 'POST', path: '/v1/products', replacement: '/v1/admin/managed-products', description: '[Deprecated] Cria gerenciado.' },
      { method: 'POST', path: '/v1/products/bulk', replacement: '/v1/admin/managed-products/bulk', description: '[Deprecated] Cria gerenciados em lote.' },
      { method: 'GET', path: '/v1/products/:id', replacement: '/v1/admin/managed-products/:id', description: '[Deprecated] Detalhe gerenciado.' },
      { method: 'PATCH', path: '/v1/products/:id', replacement: '/v1/admin/managed-products/:id', description: '[Deprecated] Atualiza gerenciado.' },
      { method: 'GET', path: '/v1/products/:id/stock', replacement: '/v1/admin/managed-products/:id/stock', description: '[Deprecated] Estoque do gerenciado.' },
      { method: 'GET', path: '/v1/products/:id/stock/history', replacement: '/v1/admin/managed-products/:id/stock/history', description: '[Deprecated] Histórico de estoque do gerenciado.' },
      { method: 'DELETE', path: '/v1/products/:id', replacement: '/v1/admin/managed-products/:id', description: '[Deprecated] Remove gerenciado.' },
      { method: 'ANY', path: '/v1/admin/products*', replacement: '/v1/admin/managed-products*', description: '[Deprecated] Padronização interna.' },
      { method: 'ANY', path: '/v1/omie/*', replacement: '/v1/admin/omie/*', description: '[Deprecated] Padronização interna.' },
      { method: 'ANY', path: '/v1/sectors*', replacement: '/v1/admin/sectors*', description: '[Deprecated] Padronização interna.' },
      { method: 'ANY', path: '/v1/plans*', replacement: '/v1/admin/plans*', description: '[Deprecated] Padronização interna.' },
    ];

    return sendOk(
      request,
      reply,
      {
        publicEndpoints,
        adminEndpoints,
        deprecatedEndpoints,
        routes: [
          { method: 'GET', path: '/v1', description: 'Índice de rotas v1' },
          ...publicEndpoints,
          ...adminEndpoints,
          ...deprecatedEndpoints,
        ],
      },
      {}
    );
  });

  // Registro das rotas da Omie
  app.register(omieRoutes);
  
  // Registro das rotas de Setores
  app.register(sectorRoutes);

  // Registro das rotas de Produtos
  app.register(productsRoutes);

  // Registro das rotas de Mapeamento Produto-Setor
  app.register(productSectorRoutes);

  // Registro das rotas de Planos de Produção
  app.register(plansRoutes);
}
``