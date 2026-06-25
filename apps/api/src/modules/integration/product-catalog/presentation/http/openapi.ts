export const productCatalogOpenApi = {
  paths: {
    "/v1/integration/product-catalog/read/production-ready": {
      get: {
        tags: ["Product Catalog"],
        summary: "Catálogo pronto para produção",
        description:
          "Retorna produtos com estoque, disponibilidade e estrutura, otimizado para API2.",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "onlyActive", in: "query", schema: { type: "boolean", default: true } },
          { name: "onlyInStock", in: "query", schema: { type: "boolean", default: false } },
          { name: "minStock", in: "query", schema: { type: "number", default: 0 } },
          { name: "limit", in: "query", schema: { type: "number", default: 100 } },
          { name: "offset", in: "query", schema: { type: "number", default: 0 } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["description", "productCode", "stock", "lastSyncAt"],
            },
          },
          {
            name: "order",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"] },
          },
        ],
        responses: {
          200: {
            description: "Lista de produtos para produção",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    summary: {
                      type: "object",
                      properties: {
                        total: { type: "number" },
                        available: { type: "number" },
                        unavailable: { type: "number" },
                      },
                    },
                    meta: {
                      type: "object",
                      properties: {
                        pageSize: { type: "number" },
                        pageCount: { type: "number" },
                        offset: { type: "number" },
                      },
                    },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/ProductCatalogProductionReadyItem",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/v1/integration/product-catalog/commands/sync-global": {
      post: {
        tags: ["Product Catalog"],
        summary: "Executar sync global",
        description: "Sincroniza todo o catálogo de produtos do Omie",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  externalRequestId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          202: {
            description: "Accepted - Comando aceito para processamento",
          },
        },
      },
    },
  },
};
