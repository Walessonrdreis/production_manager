// ---------------------------------------------------------------------------
// OpenAPI — product-stock-fetch
// ---------------------------------------------------------------------------

export const productStockFetchOpenApi = {
    paths: {
        "/v1/integration/product-stock-fetch/commands/sync-global": {
            post: {
                tags: ["Product Stock Fetch"],
                summary: "Sync global de posição de estoque",
                description:
                    "Percorre todas as páginas de ListarPosEstoque do Omie e atualiza o espelho local. Idempotente por externalRequestId. Executa cascade de refresh do production-ready read model do catálogo.",
                requestBody: {
                    required: false,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    externalRequestId: { type: "string" },
                                    pageSize: { type: "number", default: 100 },
                                    maxPages: { type: "number", default: 1000 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    202: {
                        description: "Comando aceito para processamento",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                status: { type: "string", enum: ["ACCEPTED"] },
                                                externalRequestId: { type: "string" },
                                                resourceId: { type: "string" },
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

        "/v1/integration/product-stock-fetch/commands/refresh": {
            post: {
                tags: ["Product Stock Fetch"],
                summary: "Atualizar posição de estoque de um produto",
                description:
                    "Consulta a posição de estoque de um produto específico no Omie e atualiza o espelho local.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "productId"],
                                properties: {
                                    externalRequestId: { type: "string" },
                                    productId: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    202: { description: "Comando aceito para processamento" },
                    400: { description: "Erro de validação — campos obrigatórios ausentes" },
                },
            },
        },

        "/v1/integration/product-stock-fetch/read/position": {
            get: {
                tags: ["Product Stock Fetch"],
                summary: "Consultar posição de estoque",
                description: "Retorna a posição de estoque atual de um produto no espelho local.",
                parameters: [
                    {
                        name: "productId",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                        description: "Código do produto no Omie",
                    },
                ],
                responses: {
                    200: {
                        description: "Posição de estoque encontrada",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                productId: { type: "string" },
                                                stockQuantity: { type: "number" },
                                                minimumStock: { type: "number" },
                                                updatedAt: { type: "string", format: "date-time" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: "Produto não encontrado no espelho local" },
                },
            },
        },
    },
};
