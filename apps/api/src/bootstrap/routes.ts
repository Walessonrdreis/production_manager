import type { FastifyInstance } from "fastify";
import { sendOk } from "@/shared/http/response";

// módulos
import { registerClientModule } from '../modules/client/register'; // <-- novo
import { createProductsModule } from "@/modules/products";
import { registerSectorsModule } from "@/modules/sectors";
import { registerProductSectorModule } from "@/modules/product-sector";
import { registerPlansModule } from "@/modules/plans";
import { createOmieSalesOrdersModule } from "@/modules/omie-sales-orders"; // dependendo de como você exportou
import { registerOmieSalesOrdersModule } from "@/modules/omie-sales-orders/register";
import { createOmieProductionOrdersModule } from "@/modules/omie-production-orders";
import { registerOmieProductionOrdersModule } from "@/modules/omie-production-orders/register";
import { registerOrdersEnrichedModule } from "@/modules/orders-enriched/register";
import { registerOrdersViewModule } from "@/modules/orders-view/register";
import { registerSyncModule } from "@/modules/sync/register";
import { registerAlertsModule } from "@/modules/alerts/register";
import { registerProductionQueueModule } from "@/modules/production-queue/register";
import { registerSalesProductionIntegrationModule } from "@/modules/sales-production-integration/register";
import { registerProductStructureModule } from "@/modules/product-structure/register";
import { registerInternalProductionOrdersModule } from "@/modules/internal-production-orders/register";


export async function registerRoutes(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // meta routes
  // ---------------------------------------------------------------------------
  app.get("/", async (request, reply) => {
    const protocol = request.protocol;
    const hostname = request.hostname;
    const baseUrl = `${protocol}://${hostname}`;

    return sendOk(
      request,
      reply,
      {
        name: "Production Manager API",
        status: "ok",
        timestamp: new Date().toISOString(),
        versions: { v1: `${baseUrl}/v1` },

        endpoints: {
          health: `${baseUrl}/health`,
          indexV1: `${baseUrl}/v1`,
          docs: `${baseUrl}/docs`,
        },

        resources: {
          publicProducts: `${baseUrl}/v1/products`,
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
                "Catálogo público (BizChat): produto + estoque atual + estoque mínimo. (chave: omieCode).",
              fields: {
                omieCode: "string",
                description: "string",
                sku: "string | null",
                stockQuantity: "string (decimal)",
                minimumStock: "string (decimal)",
                stockUpdatedAt: "ISO string | null",
              },
              discover: {
                query: "?describe=true",
                header: "X-Describe: true",
                pretty: "?pretty=true",
              },
              notes: [
                "Este é o único endpoint público que retorna produtos e estoque",
                "Nenhum outro endpoint é necessário para consumo externo",
              ],
            },
          },
        },

        tips: [
          "Para catálogo e estoque use sempre GET /v1/products",
          "Endpoints admin não fazem parte do contrato público",
          "sync é POST, listas são GET",
          "Para resposta mais legível use ?pretty=true",
        ],
      },
      {}
    );
  });

  app.get("/health", async (request, reply) => {
    return sendOk(request, reply, { ok: true }, {});
  });

  app.get("/v1", async (request, reply) => {
    const publicEndpoints = [
      
    {
      method: "GET",
      path: "/v1/clients",
      description:
        "[Admin] Lista clientes sincronizados da Omie (banco local).",
      example: 'curl "/v1/clients?page=1&pageSize=20&q=instituto"',
    },
    {
      method: "GET",
      path: "/v1/clients/:omieClientCode",
      description:
        "[Admin] Detalhe do cliente por código Omie (banco local).",
      example: 'curl "/v1/clients/9181474497"',
    },
    {
      method: "POST",
      path: "/v1/admin/omie/clients/sync",
      description:
        "[Admin][Omie] Força sincronização de clientes da Omie para o banco local.",
      example: 'curl -X POST "/v1/admin/omie/clients/sync"',
    },
    {
        method: "GET",
        path: "/v1/products",
        description:
          "[Public][BizChat] Catálogo + estoque atual + estoque mínimo (chave: omieCode).",
        example: 'curl "/v1/products?q=cor&page=1&pageSize=50&pretty=true"',
    },
    {
        method: "GET",
        path: "/v1/products/:omieCode",
        description: "[Public][BizChat] Detalhe por omieCode.",
        example: 'curl "/v1/products/12345?pretty=true"',
    },
      
    {
        method: "GET",
        path: "/v1/orders",
        description:
          "[Public] Lista pedidos etapa 20 com itens e cliente (payload organizado para consumo).",
        example: 'curl "/v1/orders?page=1&pageSize=20"',
    }, 
    ];

    const adminEndpoints = [
      // produtos gerenciados
      { method: "POST", path: "/v1/admin/managed-products", description: "[Admin] Seleciona um produto Omie para ser gerenciado." },
      { method: "POST", path: "/v1/admin/managed-products/bulk", description: "[Admin] Seleciona vários produtos Omie em lote." },
      { method: "GET", path: "/v1/admin/managed-products", description: "[Admin] Lista produtos gerenciados." },
      { method: "GET", path: "/v1/admin/managed-products/:id", description: "[Admin] Detalhe do produto gerenciado." },
      { method: "PATCH", path: "/v1/admin/managed-products/:id", description: "[Admin] Atualiza nickname/active." },
      { method: "GET", path: "/v1/admin/managed-products/:id/stock", description: "[Admin] Estoque por UUID do Product." },
      { method: "GET", path: "/v1/admin/managed-products/:id/stock/history", description: "[Admin] Histórico de estoque por UUID do Product." },
      { method: "DELETE", path: "/v1/admin/managed-products/:id", description: "[Admin] Remove um produto do gerenciador." },
      // ✅ NOVO (malha/estrutura de produtos)
      { method: "GET", path: "/v1/admin/product-structures", description:"[Admin] Lista estruturas de produtos persistidas (paginado, filtra por hasStructure e q).",},
      { method: "POST", path: "/v1/admin/omie/product-structures/sync", description:"[Admin][Omie] Sincroniza a estrutura (malha) de um produto a partir da Omie. Aceita codProduto, idProduto ou intProduto.",},
      {method: "GET", path: "/v1/admin/product-structures/:codProduto", description:"[Admin] Obtém a estrutura (malha) persistida de um produto pelo codProduto (domínio estável).",},
      // product-sector
      { method: "PUT", path: "/v1/admin/managed-products/:productId/sector", description: "[Admin] Define setor padrão de um produto." },
      { method: "GET", path: "/v1/admin/managed-products/:productId/sector", description: "[Admin] Obtém setor padrão de um produto." },

      // setores
      { method: "POST", path: "/v1/admin/sectors", description: "[Admin] Cria um setor." },
      { method: "GET", path: "/v1/admin/sectors", description: "[Admin] Lista setores (use includeInactive=true para incluir inativos)." },
      { method: "PATCH", path: "/v1/admin/sectors/:id", description: "[Admin] Atualiza um setor." },
      { method: "DELETE", path: "/v1/admin/sectors/:id", description: "[Admin] Desativa um setor (soft delete)." },

      // planos
      { method: "POST", path: "/v1/admin/plans", description: "[Admin] Cria um plano de produção." },
      { method: "GET", path: "/v1/admin/plans", description: "[Admin] Lista planos de produção." },
      { method: "GET", path: "/v1/admin/plans/:id", description: "[Admin] Detalha um plano (com itens)." },
      { method: "POST", path: "/v1/admin/plans/:id/items", description: "[Admin] Adiciona item ao plano." },
      { method: "GET", path: "/v1/admin/plans/:id/by-sector", description: "[Admin] Lista itens do plano agrupados por setor." },
      { method: "GET", path: "/v1/admin/plans/:id/export.csv", description: "[Admin] Exporta o plano em CSV." },

      // pedidos (omie-orders)
      { method: "GET", path: "/v1/admin/orders", description: "[Admin] Lista ordens persistidas (paginado)." },
      { method: "GET", path: "/v1/admin/orders/stage20", description: "[Admin] Lista pedidos etapa 20 (paginado e filtro q)." },

      // ✅ ACRÉSCIMO — ENDPOINT ENRIQUECIDO (NÃO ALTERA O LEGADO)
      {
        method: "GET",
        path: "/v1/admin/orders/stage20/enriched",
        description:
          "[Admin] ✅ Lista pedidos etapa 20 ENRIQUECIDOS com dados do cliente (nome, documento). Endpoint recomendado para consumo.",
      },

      { method: "GET", path: "/v1/admin/orders/stage20/totals", description: "[Admin] Totais consolidados por descrição (stage 20)." },
      { method: "POST", path: "/v1/admin/omie/orders/stage20/sync", description: "[Admin][Omie] Sincroniza pedidos etapa 20." },
      { method: "GET", path: "/v1/admin/omie/orders/stage20/ping", description: "[Admin][Omie] Ping do módulo de pedidos." },

      // Omie admin de produtos/estoque/sync
      { method: "POST", path: "/v1/admin/omie/sync/products", description: "[Admin][Omie] Sincroniza produtos do Omie." },
      { method: "POST", path: "/v1/admin/omie/products/stock/refresh", description: "[Admin][Omie] Atualiza e persiste o estoque atual (ProductStock)." },
      { method: "GET", path: "/v1/admin/omie/stock", description: "[Admin][Omie] Info do estoque (fonte: database)." },
      { method: "GET", path: "/v1/admin/omie/categories", description: "[Admin][Omie] Lista categorias/famílias (únicas e ordenadas)." },
      { method: "GET", path: "/v1/admin/omie/products/search", description: "[Admin][Omie] Busca no catálogo Omie." },
      { method: "GET", path: "/v1/admin/omie/products", description: "[Admin][Omie] Lista produtos Omie enriquecidos com estoque." },
      { method: "GET", path: "/v1/admin/omie/products/:id", description: "[Admin][Omie] Detalhe do produto Omie por UUID." },
      { method: "GET", path: "/v1/admin/omie/products/by-code/:omieCode", description: "[Admin][Omie] Detalhe do produto Omie por código." },
      { method: "GET", path: "/v1/admin/omie/products/:id/stock", description: "[Admin][Omie] Estoque por UUID do OmieProduct." },
      { method: "GET", path: "/v1/admin/omie/products/by-code/:omieCode/stock", description: "[Admin][Omie] Estoque por código do Omie." },   
      // alerts module (API Core - Fase 2)
      { method: "GET", path: "/api/alerts/stock", description: "[Admin] Listar alertas de estoque com filtros." },
      { method: "GET", path: "/api/alerts/stock/critical", description: "[Admin] Listar alertas críticos de estoque." },
      { method: "POST", path: "/api/alerts/stock/configure", description: "[Admin] Configurar regras de alertas de estoque." },
      { method: "PATCH", path: "/api/alerts/stock/:id/status", description: "[Admin] Atualizar status de um alerta de estoque." },
      { method: "GET", path: "/api/alerts/stock/statistics", description: "[Admin] Obter estatísticas de alertas de estoque." },

      // production queue module (API Core - Fase 2)
      { method: "POST", path: "/api/production/queue/add", description: "[Admin] Adicionar ordem à fila de produção." },
      { method: "GET", path: "/api/production/queue", description: "[Admin] Listar itens da fila de produção com filtros." },
      { method: "PATCH", path: "/api/production/queue/:id/status", description: "[Admin] Atualizar status de um item na fila." },
      { method: "GET", path: "/api/production/queue/statistics", description: "[Admin] Obter estatísticas da fila de produção." },
      { method: "POST", path: "/api/production/queue/reorder", description: "[Admin] Reordenar a fila de produção." },

      // sales production integration module (API Core - Fase 2)
      { method: "POST", path: "/api/integration/sales-to-production", description: "[Admin] Integrar pedido de venda à fila de produção automaticamente." },
      { method: "GET", path: "/api/integration/sales-to-production/statistics", description: "[Admin] Obter estatísticas da integração vendas→produção." },
    ];

    const deprecatedEndpoints = [
      { method: "GET", path: "/v1/products/stock", replacement: "/v1/products", description: "[Deprecated] Alias do catálogo público." },
      { method: "GET", path: "/v1/products/managed", replacement: "/v1/admin/managed-products", description: "[Deprecated] Lista gerenciados." },
      { method: "POST", path: "/v1/products", replacement: "/v1/admin/managed-products", description: "[Deprecated] Cria gerenciado." },
      { method: "POST", path: "/v1/products/bulk", replacement: "/v1/admin/managed-products/bulk", description: "[Deprecated] Cria gerenciados em lote." },
      { method: "GET", path: "/v1/products/:id", replacement: "/v1/admin/managed-products/:id", description: "[Deprecated] Detalhe gerenciado." },
      { method: "PATCH", path: "/v1/products/:id", replacement: "/v1/admin/managed-products/:id", description: "[Deprecated] Atualiza gerenciado." },
      { method: "GET", path: "/v1/products/:id/stock", replacement: "/v1/admin/managed-products/:id/stock", description: "[Deprecated] Estoque do gerenciado." },
      { method: "GET", path: "/v1/products/:id/stock/history", replacement: "/v1/admin/managed-products/:id/stock/history", description: "[Deprecated] Histórico do gerenciado." },
      { method: "DELETE", path: "/v1/products/:id", replacement: "/v1/admin/managed-products/:id", description: "[Deprecated] Remove gerenciado." },
      { method: "ANY", path: "/v1/admin/products*", replacement: "/v1/admin/managed-products*", description: "[Deprecated] Padronização interna." },
      { method: "ANY", path: "/v1/omie/*", replacement: "/v1/admin/omie/*", description: "[Deprecated] Padronização interna." },
      { method: "ANY", path: "/v1/sectors*", replacement: "/v1/admin/sectors*", description: "[Deprecated] Padronização interna." },
      { method: "ANY", path: "/v1/plans*", replacement: "/v1/admin/plans*", description: "[Deprecated] Padronização interna." },
    ];

    return sendOk(
      request,
      reply,
      {
        publicEndpoints,
        adminEndpoints,
        deprecatedEndpoints,
        routes: [
          { method: "GET", path: "/v1", description: "Índice de rotas v1" },
          ...publicEndpoints,
          ...adminEndpoints,
          ...deprecatedEndpoints,
        ],
      },
      {}
    );
  });

  // ---------------------------------------------------------------------------
  // register modules (new architecture)
  // ---------------------------------------------------------------------------
  await registerOrdersEnrichedModule(app);

  await createProductsModule(app);
  await registerSectorsModule(app);
  await registerProductSectorModule(app);
  await registerPlansModule(app);

  // ✅ NOVO (malha/estrutura de produtos)
  await registerProductStructureModule(app);

  // omie sales orders
  await registerOmieSalesOrdersModule(app);
  const omieSalesOrders = createOmieSalesOrdersModule(app);
  
  // omie production orders
  await registerOmieProductionOrdersModule(app);
  const omieProductionOrders = createOmieProductionOrdersModule(app);
  
  await registerOrdersViewModule(app);

  // internal production orders (API Avançada - Fase 2)
  await registerInternalProductionOrdersModule(app);

  
  // sync module (API Core - Fase 2) - TEMPORARILY DISABLED DUE TO ZOD SCHEMA ERROR
  // registerSyncModule(app);
  
  // alerts module (API Core - Fase 2)
  registerAlertsModule(app);
  
  // production queue module (API Core - Fase 2) - TEMPORARILY DISABLED DUE TO FST_ERR_DEC_ALREADY_PRESENT
  // registerProductionQueueModule(app);
  
  // sales production integration module (API Core - Fase 2)
  registerSalesProductionIntegrationModule(app);
  
  void omieSalesOrders;
  void omieProductionOrders;
}
