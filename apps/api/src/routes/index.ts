import { FastifyInstance } from 'fastify';
import packageJson from '../../package.json';
import { ok } from '../lib/http';
import { omieRoutes } from './omie';
import { sectorRoutes } from './sectors';
import { productsRoutes } from './products';
import { productSectorRoutes } from './product-sector';
import { plansRoutes } from './plans';

export async function appRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const protocol = request.protocol;
    const hostname = request.hostname;
    const baseUrl = `${protocol}://${hostname}`;

    return ok({
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
        adminProducts: `${baseUrl}/v1/admin/managed-products`,
        adminSectors: `${baseUrl}/v1/admin/sectors`,
        adminPlans: `${baseUrl}/v1/admin/plans`,
      },
      tips: [
        'sync é POST',
        'listas são GET',
      ],
    });
  });

  app.get('/health', async () => {
    return ok({ ok: true });
  });

  app.get('/v1', async () => {
    const publicRoutes = [
      { method: 'GET', path: '/v1/products', description: '[Public] Catálogo + estoque atual + estoque mínimo (chave: omieCode). Ex: curl \"/v1/products?q=cor&page=1&pageSize=20\"' },
      { method: 'GET', path: '/v1/products/:omieCode', description: '[Public] Detalhe por omieCode. Ex: curl \"/v1/products/12345\"' },
    ];

    const adminRoutes = [
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

    const deprecatedAliases = [
      { method: 'GET', path: '/v1/products/stock', description: '[Deprecated] Alias de /v1/products (responde com header Deprecation: true).' },
      { method: 'GET', path: '/v1/products/managed', description: '[Deprecated] Use /v1/admin/managed-products.' },
      { method: 'POST', path: '/v1/products', description: '[Deprecated] Use /v1/admin/managed-products.' },
      { method: 'POST', path: '/v1/products/bulk', description: '[Deprecated] Use /v1/admin/managed-products/bulk.' },
      { method: 'GET', path: '/v1/products/:id', description: '[Deprecated] Use /v1/admin/managed-products/:id.' },
      { method: 'PATCH', path: '/v1/products/:id', description: '[Deprecated] Use /v1/admin/managed-products/:id.' },
      { method: 'GET', path: '/v1/products/:id/stock', description: '[Deprecated] Use /v1/admin/managed-products/:id/stock.' },
      { method: 'GET', path: '/v1/products/:id/stock/history', description: '[Deprecated] Use /v1/admin/managed-products/:id/stock/history.' },
      { method: 'DELETE', path: '/v1/products/:id', description: '[Deprecated] Use /v1/admin/managed-products/:id.' },
      { method: 'GET', path: '/v1/admin/products*', description: '[Deprecated] Use /v1/admin/managed-products*.' },
      { method: 'GET', path: '/v1/omie/*', description: '[Deprecated] Use /v1/admin/omie/*.' },
      { method: 'GET', path: '/v1/sectors*', description: '[Deprecated] Use /v1/admin/sectors*.' },
      { method: 'GET', path: '/v1/plans*', description: '[Deprecated] Use /v1/admin/plans*.' },
    ];

    return ok({
      public: publicRoutes,
      admin: adminRoutes,
      deprecated: deprecatedAliases,
      routes: [
        { method: 'GET', path: '/v1', description: 'Índice de rotas v1' },
        ...publicRoutes,
        ...adminRoutes,
        ...deprecatedAliases,
      ],
    });
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
