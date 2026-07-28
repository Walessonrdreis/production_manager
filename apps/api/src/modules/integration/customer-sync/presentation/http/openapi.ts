// ---------------------------------------------------------------------------
// OpenAPI — customer-sync
// ---------------------------------------------------------------------------

export const customerSyncOpenApi = {
    paths: {
        "/v1/integration/customer-sync/commands/sync-global": {
            post: {
                tags: ["Customer Sync"],
                summary: "Sync global de clientes",
                description:
                    "Percorre todas as páginas de ListarClientes do Omie e atualiza o espelho local. Idempotente por externalRequestId.",
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

        "/v1/integration/customer-sync/commands/sync": {
            post: {
                tags: ["Customer Sync"],
                summary: "Sincronizar um cliente específico",
                description: "Busca um cliente no Omie pelo código e atualiza o espelho local.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "customerCode"],
                                properties: {
                                    externalRequestId: { type: "string" },
                                    customerCode: { type: "string" },
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

        "/v1/integration/customer-sync/read/stats": {
            get: {
                tags: ["Customer Sync"],
                summary: "Estatísticas do espelho de clientes",
                description: "Retorna total, ativos, inativos e data da última sincronização.",
                responses: {
                    200: { description: "Estatísticas retornadas com sucesso" },
                },
            },
        },

        "/v1/integration/customer-sync/read/summary": {
            get: {
                tags: ["Customer Sync"],
                summary: "Sumário dos clientes",
                description: "Retorna lista resumida de todos os clientes no espelho local.",
                responses: {
                    200: { description: "Sumário retornado com sucesso" },
                },
            },
        },

        "/v1/integration/customer-sync/read-model": {
            get: {
                tags: ["Customer Sync"],
                summary: "Read model detalhado de cliente",
                description: "Retorna o modelo de leitura completo de um cliente específico.",
                parameters: [
                    {
                        name: "customerCode",
                        in: "query",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "Read model retornado com sucesso" },
                    404: { description: "Cliente não encontrado" },
                },
            },
        },

        "/v1/integration/customer-sync/commands/{externalRequestId}": {
            get: {
                tags: ["Customer Sync"],
                summary: "Status de sincronização",
                description: "Retorna o status de um comando de sincronização pelo externalRequestId.",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "Status retornado com sucesso" },
                    404: { description: "Comando não encontrado" },
                },
            },
        },

        "/v1/integration/customer-sync/read/sync-history": {
            get: {
                tags: ["Customer Sync"],
                summary: "Histórico de sincronizações",
                description: "Retorna o histórico de comandos de sincronização executados.",
                responses: {
                    200: { description: "Histórico retornado com sucesso" },
                },
            },
        },

        "/v1/integration/customer-sync/read/sync-failures": {
            get: {
                tags: ["Customer Sync"],
                summary: "Falhas de sincronização",
                description: "Retorna lista de comandos que falharam durante a sincronização.",
                responses: {
                    200: { description: "Falhas retornadas com sucesso" },
                },
            },
        },

        "/v1/integration/customer-sync/read/last-sync": {
            get: {
                tags: ["Customer Sync"],
                summary: "Última sincronização",
                description: "Retorna a data e hora da última sincronização global.",
                responses: {
                    200: { description: "Data retornada com sucesso" },
                },
            },
        },
    },
};
