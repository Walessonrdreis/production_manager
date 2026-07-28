export const productStructureOpenApi = {
    paths: {
        "/v1/integration/product-structure/commands/sync-global": {
            post: {
                tags: ["Product Structure"],
                summary: "Sync global de estruturas (BOM)",
                description:
                    "Percorre todas as páginas de ListarEstruturas do Omie e atualiza o espelho local. Idempotente por externalRequestId.",
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

        "/v1/integration/product-structure/commands/sync": {
            post: {
                tags: ["Product Structure"],
                summary: "Sincronizar estrutura de um produto",
                description: "Busca estrutura (BOM) de um produto no Omie e atualiza o espelho local.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "productCode"],
                                properties: {
                                    externalRequestId: { type: "string" },
                                    productCode: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    202: { description: "Comando aceito" },
                },
            },
        },

        "/v1/integration/product-structure/commands/apply": {
            post: {
                tags: ["Product Structure"],
                summary: "Aplicar estrutura (Incluir/Alterar BOM)",
                description:
                    "Cria ou altera a estrutura de um produto no Omie e atualiza o espelho local. Decide automaticamente entre IncluirEstrutura e AlterarEstrutura.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "productCode", "structure"],
                                properties: {
                                    externalRequestId: { type: "string" },
                                    productCode: { type: "string" },
                                    structure: {
                                        type: "object",
                                        required: ["items"],
                                        properties: {
                                            items: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    required: ["componentCode", "quantity"],
                                                    properties: {
                                                        componentCode: { type: "string" },
                                                        quantity: { type: ["string", "number"] },
                                                        unit: { type: "string" },
                                                        loss: { type: ["string", "number"] },
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
                responses: {
                    202: { description: "Comando aceito" },
                },
            },
        },

        "/v1/integration/product-structure/commands/delete": {
            post: {
                tags: ["Product Structure"],
                summary: "Excluir estrutura (BOM)",
                description: "Exclui a estrutura de um produto no Omie e atualiza o espelho local.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "productCode"],
                                properties: {
                                    externalRequestId: { type: "string" },
                                    productCode: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    202: { description: "Comando aceito" },
                },
            },
        },

        "/v1/integration/product-structure/commands/{externalRequestId}": {
            get: {
                tags: ["Product Structure"],
                summary: "Consultar status de comando",
                description: "Retorna o status de um comando de integração pelo externalRequestId.",
                parameters: [
                    {
                        name: "externalRequestId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Status do comando",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                externalRequestId: { type: "string" },
                                                productCode: { type: "string" },
                                                commandType: { type: "string", enum: ["SYNC", "APPLY", "DELETE"] },
                                                status: { type: "string", enum: ["ACCEPTED", "CONFIRMED", "FAILED"] },
                                                source: { type: "string" },
                                                executedAt: { type: "string", format: "date-time" },
                                                completedAt: { type: "string", format: "date-time", nullable: true },
                                                createdAt: { type: "string", format: "date-time" },
                                                updatedAt: { type: "string", format: "date-time" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: "Comando não encontrado" },
                },
            },
        },

        "/v1/integration/product-structure/read/summary": {
            get: {
                tags: ["Product Structure"],
                summary: "Sumário de estruturas",
                description: "Retorna lista resumida de produtos com estrutura e status de sincronização.",
                parameters: [
                    { name: "onlyWithStructure", in: "query", schema: { type: "boolean" } },
                    { name: "q", in: "query", schema: { type: "string" } },
                    { name: "limit", in: "query", schema: { type: "number", default: 50 } },
                    { name: "offset", in: "query", schema: { type: "number", default: 0 } },
                ],
                responses: {
                    200: {
                        description: "Sumário",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                summary: {
                                                    type: "object",
                                                    properties: {
                                                        total: { type: "number" },
                                                        withStructure: { type: "number" },
                                                        withoutStructure: { type: "number" },
                                                        commands: {
                                                            type: "object",
                                                            properties: {
                                                                accepted: { type: "number" },
                                                                confirmed: { type: "number" },
                                                                failed: { type: "number" },
                                                            },
                                                        },
                                                    },
                                                },
                                                meta: {
                                                    type: "object",
                                                    properties: {
                                                        limit: { type: "number" },
                                                        offset: { type: "number" },
                                                        returned: { type: "number" },
                                                    },
                                                },
                                                items: {
                                                    type: "array",
                                                    items: {
                                                        type: "object",
                                                        properties: {
                                                            productCode: { type: "string" },
                                                            description: { type: "string", nullable: true },
                                                            familyCode: { type: "string", nullable: true },
                                                            familyDescription: { type: "string", nullable: true },
                                                            productType: { type: "string", nullable: true },
                                                            unit: { type: "string", nullable: true },
                                                            hasStructure: { type: "boolean" },
                                                            componentCount: { type: "number" },
                                                            lastSyncAt: { type: "string", format: "date-time", nullable: true },
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
                },
            },
        },

        "/v1/admin/read/products/production-readiness": {
            get: {
                tags: ["Product Structure"],
                summary: "Readiness de produtos para produção",
                description:
                    "Read-model que indica se um produto está apto a gerar Ordem de Produção.",
                parameters: [
                    { name: "view", in: "query", schema: { type: "string", enum: ["summary", "data"] } },
                    { name: "q", in: "query", schema: { type: "string" } },
                    { name: "onlyWithoutStructure", in: "query", schema: { type: "boolean" } },
                    { name: "limit", in: "query", schema: { type: "number", default: 50 } },
                    { name: "offset", in: "query", schema: { type: "number", default: 0 } },
                    { name: "sort", in: "query", schema: { type: "string", enum: ["description", "productCode", "hasStructure"] } },
                    { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
                ],
                responses: {
                    200: { description: "Lista de readiness" },
                },
            },
        },

        "/v1/integration/product-structure/read/:productCode/refresh": {
            get: {
                tags: ["Product Structure"],
                summary: "Refresh de estrutura (live do Omie)",
                description:
                    "Busca estrutura diretamente do Omie (ConsultarEstrutura), atualiza o espelho local e retorna os dados frescos. Síncrona — sem fila.",
                parameters: [
                    {
                        name: "productCode",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "Dados da estrutura atualizados" },
                    404: { description: "Estrutura não encontrada no Omie" },
                    500: { description: "Erro interno" },
                },
            },
        },

        "/v1/integration/product-structure/commands/submit": {
            post: {
                tags: ["Product Structure"],
                summary: "Submeter estrutura (workflow) — NÃO IMPLEMENTADO",
                description:
                    "Placeholder para workflow de rascunhos/aprovação. No MVP, usar /apply. Retorna 501.",
                responses: {
                    501: { description: "Não implementado — use /apply" },
                },
            },
        },

        "/v1/integration/product-structure/callbacks/:externalRequestId/confirm": {
            post: {
                tags: ["Product Structure"],
                summary: "Callback — confirmar comando (fake-only)",
                description:
                    "Callback fake para marcar um comando como CONFIRMED. Disponível apenas quando PRODUCT_STRUCTURE_GATEWAY=fake.",
                parameters: [
                    {
                        name: "externalRequestId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "Comando confirmado" },
                    404: { description: "Comando não encontrado" },
                    405: { description: "Não disponível em modo real" },
                },
            },
        },

        "/v1/integration/product-structure/callbacks/:externalRequestId/fail": {
            post: {
                tags: ["Product Structure"],
                summary: "Callback — falhar comando (fake-only)",
                description:
                    "Callback fake para marcar um comando como FAILED. Disponível apenas quando PRODUCT_STRUCTURE_GATEWAY=fake.",
                parameters: [
                    {
                        name: "externalRequestId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["code", "message"],
                                properties: {
                                    code: { type: "string" },
                                    message: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Comando marcado como FAILED" },
                    404: { description: "Comando não encontrado" },
                    405: { description: "Não disponível em modo real" },
                },
            },
        },
    },
};
