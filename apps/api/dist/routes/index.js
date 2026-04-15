"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRoutes = appRoutes;
const http_1 = require("../lib/http");
const omie_1 = require("./omie");
const sectors_1 = require("./sectors");
const products_1 = require("./products");
const product_sector_1 = require("./product-sector");
const plans_1 = require("./plans");
async function appRoutes(app) {
    app.get('/', async (request) => {
        const protocol = request.protocol;
        const hostname = request.hostname;
        const baseUrl = `${protocol}://${hostname}`;
        return (0, http_1.ok)({
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
                omieProducts: `${baseUrl}/v1/omie/products`,
                managedProducts: `${baseUrl}/v1/products`,
                sectors: `${baseUrl}/v1/sectors`,
                plans: `${baseUrl}/v1/plans`,
            },
            tips: [
                'sync é POST',
                'listas são GET',
            ],
        });
    });
    app.get('/health', async () => {
        return (0, http_1.ok)({ ok: true });
    });
    app.get('/v1', async () => {
        return (0, http_1.ok)({
            routes: [
                { method: 'GET', path: '/v1', description: 'Índice de rotas v1' },
                { method: 'GET', path: '/v1/omie/categories', description: '[Omie] Lista categorias/famílias (únicas e ordenadas). Ex: curl \"/v1/omie/categories?q=cor\"' },
                { method: 'GET', path: '/v1/omie/products/search', description: '[Omie] Busca (autocomplete) no catálogo. Ex: curl \"/v1/omie/products/search?q=cor&page=1&pageSize=20\"' },
                { method: 'GET', path: '/v1/omie/products/:id', description: '[Omie] Detalhe do produto Omie por UUID. Ex: curl \"/v1/omie/products/<uuid>?includeRaw=true\"' },
                { method: 'GET', path: '/v1/omie/products/by-code/:omieCode', description: '[Omie] Detalhe do produto Omie por código. Ex: curl \"/v1/omie/products/by-code/12345\"' },
                { method: 'GET', path: '/v1/omie/products/:id/stock', description: '[Omie] Estoque por UUID do OmieProduct. Ex: curl \"/v1/omie/products/<uuid>/stock\"' },
                { method: 'GET', path: '/v1/omie/products/by-code/:omieCode/stock', description: '[Omie] Estoque por código do Omie. Ex: curl \"/v1/omie/products/by-code/12345/stock\"' },
                { method: 'POST', path: '/v1/omie/sync/products', description: 'Sincroniza produtos do Omie (ação; usar curl/cliente)' },
                { method: 'POST', path: '/v1/omie/products/sync', description: '[Omie] (Admin/Debug) Sincronização manual do catálogo (envelope {data})' },
                { method: 'POST', path: '/v1/omie/products/stock/refresh', description: 'Atualiza o cache de estoque do Omie (ação; usar curl/cliente)' },
                { method: 'GET', path: '/v1/omie/products', description: 'Lista produtos sincronizados do Omie (filtros e paginação via querystring)' },
                { method: 'POST', path: '/v1/products', description: 'Seleciona um produto Omie para ser gerenciado' },
                { method: 'POST', path: '/v1/products/bulk', description: 'Seleciona vários produtos Omie em lote' },
                { method: 'GET', path: '/v1/products', description: 'Lista produtos gerenciados' },
                { method: 'GET', path: '/v1/products/:id', description: '[Products] Detalhe do produto gerenciado (com OmieProduct e setor padrão). Ex: curl \"/v1/products/<uuid>\"' },
                { method: 'PATCH', path: '/v1/products/:id', description: '[Products] Atualiza nickname/active. Ex: curl -X PATCH \"/v1/products/<uuid>\" -H \"Content-Type: application/json\" -d \"{\\\"data\\\":{\\\"nickname\\\":\\\"New\\\"}}\"' },
                { method: 'GET', path: '/v1/products/:id/stock', description: '[Products] Estoque por UUID do Product. Ex: curl \"/v1/products/<uuid>/stock\"' },
                { method: 'DELETE', path: '/v1/products/:id', description: 'Remove um produto do gerenciador' },
                { method: 'POST', path: '/v1/sectors', description: 'Cria um setor' },
                { method: 'GET', path: '/v1/sectors', description: 'Lista setores (use includeInactive=true para incluir inativos)' },
                { method: 'PATCH', path: '/v1/sectors/:id', description: 'Atualiza um setor' },
                { method: 'DELETE', path: '/v1/sectors/:id', description: 'Desativa um setor (soft delete)' },
                { method: 'PUT', path: '/v1/products/:productId/sector', description: 'Define setor padrão de um produto' },
                { method: 'GET', path: '/v1/products/:productId/sector', description: 'Obtém setor padrão de um produto' },
                { method: 'POST', path: '/v1/plans', description: 'Cria um plano de produção' },
                { method: 'GET', path: '/v1/plans', description: 'Lista planos de produção' },
                { method: 'GET', path: '/v1/plans/:id', description: 'Detalha um plano (com itens)' },
                { method: 'POST', path: '/v1/plans/:id/items', description: 'Adiciona item ao plano' },
                { method: 'GET', path: '/v1/plans/:id/by-sector', description: 'Lista itens do plano agrupados por setor' },
                { method: 'GET', path: '/v1/plans/:id/export.csv', description: 'Exporta o plano em CSV' },
            ],
        });
    });
    // Registro das rotas da Omie
    app.register(omie_1.omieRoutes);
    // Registro das rotas de Setores
    app.register(sectors_1.sectorRoutes);
    // Registro das rotas de Produtos
    app.register(products_1.productsRoutes);
    // Registro das rotas de Mapeamento Produto-Setor
    app.register(product_sector_1.productSectorRoutes);
    // Registro das rotas de Planos de Produção
    app.register(plans_1.plansRoutes);
}
