// ---------------------------------------------------------------------------
// OpenAPI — Production Orders Integration
// ---------------------------------------------------------------------------
// Documentação OpenAPI (3.0) para todas as rotas do módulo production-orders.
//
// Rotas documentadas (14):
//   Commands (POST, 5): create, update, cancel, change-stage, sync-global
//   Callbacks (POST, 2): confirm, fail
//   Tracking (GET, 1): :externalRequestId
//   Read (GET, 6): list, detail, stats, queue, queue/failures, :omieCode/refresh
// ---------------------------------------------------------------------------

export const productionOrdersOpenApi = {
    paths: {
        // ─── Commands ────────────────────────────────────────────────────

        "/v1/integration/production-orders/commands/create": {
            post: {
                tags: ["Production Orders"],
                summary: "Criar ordem de produção",
                description:
                    "Enfileira o comando CREATE_OP no PgBoss (PENDING) e retorna 202. O worker 'production-order.create-op' executa a criação real no Omie de forma assíncrona.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "productId", "quantity"],
                                properties: {
                                    externalRequestId: { type: "string" },
                                    productId: { type: "string" },
                                    quantity: { type: "number" },
                                    scheduledDate: { type: "string", format: "date", nullable: true },
                                    notes: { type: "string", nullable: true },
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
                                                externalRequestId: { type: "string" },
                                                status: { type: "string", enum: ["PENDING"] },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Erro de validação (Zod)" },
                },
            },
        },

        "/v1/integration/production-orders/commands/update": {
            post: {
                tags: ["Production Orders"],
                summary: "Atualizar ordem de produção",
                description:
                    "Enfileira o comando UPDATE_OP no PgBoss (PENDING) e retorna 202. O worker 'production-order.update-op' executa a atualização real no Omie de forma assíncrona.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "omieCode"],
                                properties: {
                                    externalRequestId: { type: "string" },
                                    omieCode: { type: "string" },
                                    quantity: { type: "number", nullable: true },
                                    forecastDate: { type: "string", format: "date", nullable: true },
                                    notes: { type: "string", nullable: true },
                                },
                            },
                        },
                    },
                },
                responses: {
                    202: { description: "Comando aceito" },
                    400: { description: "Erro de validação" },
                },
            },
        },

        "/v1/integration/production-orders/commands/cancel": {
            post: {
                tags: ["Production Orders"],
                summary: "Cancelar ordem de produção",
                description:
                    "Enfileira o comando CANCEL_OP no PgBoss (PENDING) e retorna 202. O worker 'production-order.cancel-op' executa o cancelamento real no Omie de forma assíncrona.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "omieCode"],
                                properties: {
                                    externalRequestId: { type: "string" },
                                    omieCode: { type: "string" },
                                    reason: { type: "string", nullable: true },
                                },
                            },
                        },
                    },
                },
                responses: {
                    202: { description: "Comando aceito" },
                    400: { description: "Erro de validação" },
                },
            },
        },

        "/v1/integration/production-orders/commands/change-stage": {
            post: {
                tags: ["Production Orders"],
                summary: "Alterar etapa da ordem de produção",
                description:
                    "Enfileira o comando CHANGE_STAGE no PgBoss (PENDING) e retorna 202. O worker 'production-order.change-stage' executa a alteração de etapa real no Omie de forma assíncrona.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "omieCode", "stage"],
                                properties: {
                                    externalRequestId: { type: "string" },
                                    omieCode: { type: "string" },
                                    stage: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    202: { description: "Comando aceito" },
                    400: { description: "Erro de validação" },
                },
            },
        },

        "/v1/integration/production-orders/commands/sync-global": {
            post: {
                tags: ["Production Orders"],
                summary: "Sync global de ordens de produção",
                description:
                    "Percorre todas as páginas de ordens de produção do Omie e atualiza o espelho local. Usa checkpoint incremental (última sync). Idempotente por externalRequestId.",
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

        // ─── Callbacks ───────────────────────────────────────────────────

        "/v1/integration/production-orders/callbacks/:externalRequestId/confirm": {
            post: {
                tags: ["Production Orders"],
                summary: "Callback — confirmar comando (fake-only)",
                description:
                    "Callback fake para marcar um comando como CONFIRMED. Disponível apenas quando PRODUCTION_ORDER_GATEWAY=fake.",
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

        "/v1/integration/production-orders/callbacks/:externalRequestId/fail": {
            post: {
                tags: ["Production Orders"],
                summary: "Callback — falhar comando (fake-only)",
                description:
                    "Callback fake para marcar um comando como FAILED. Disponível apenas quando PRODUCTION_ORDER_GATEWAY=fake.",
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

        // ─── Tracking ────────────────────────────────────────────────────

        "/v1/integration/production-orders/commands/{externalRequestId}": {
            get: {
                tags: ["Production Orders"],
                summary: "Consultar status de comando",
                description:
                    "Retorna o status de um comando de integração pelo externalRequestId.",
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
                                                commandType: {
                                                    type: "string",
                                                    enum: ["SYNC_GLOBAL", "CREATE_OP", "UPDATE_OP", "CANCEL_OP", "CHANGE_STAGE"],
                                                },
                                                status: {
                                                    type: "string",
                                                    enum: ["PENDING", "PROCESSING", "CONFIRMED", "FAILED"],
                                                },
                                                source: { type: "string" },
                                                lastError: { type: "string", nullable: true },
                                                retryCount: { type: "number" },
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

        // ─── Read-Models ─────────────────────────────────────────────────

        "/v1/integration/production-orders/read": {
            get: {
                tags: ["Production Orders"],
                summary: "Listar ordens de produção (espelho local)",
                description:
                    "Retorna lista paginada do espelho local (omie_production_order). Suporta filtros por status e produto.",
                parameters: [
                    { name: "page", in: "query", schema: { type: "string", default: "1" } },
                    { name: "limit", in: "query", schema: { type: "string", default: "20" } },
                    { name: "completed", in: "query", schema: { type: "string" } },
                    { name: "active", in: "query", schema: { type: "string" } },
                    { name: "productCode", in: "query", schema: { type: "string" } },
                ],
                responses: {
                    200: {
                        description: "Lista paginada de ordens de produção",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                items: { type: "array" },
                                                total: { type: "number" },
                                                page: { type: "number" },
                                                limit: { type: "number" },
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

        "/v1/integration/production-orders/read/{omieCode}": {
            get: {
                tags: ["Production Orders"],
                summary: "Detalhe da ordem de produção",
                description:
                    "Retorna detalhe da OP + itens do espelho local (omie_production_order + omie_production_order_item).",
                parameters: [
                    {
                        name: "omieCode",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "Detalhe da OP" },
                    404: { description: "OP não encontrada" },
                },
            },
        },

        "/v1/integration/production-orders/read/stats": {
            get: {
                tags: ["Production Orders"],
                summary: "Estatísticas do espelho local",
                description:
                    "Retorna contagens do espelho local (omie_production_order): total, por status, etc.",
                responses: {
                    200: { description: "Estatísticas" },
                },
            },
        },

        "/v1/integration/production-orders/read/queue": {
            get: {
                tags: ["Production Orders"],
                summary: "Status da fila de comandos",
                description:
                    "Retorna status atual da fila de comandos (command queue): contagens por status e comandos recentes.",
                responses: {
                    200: { description: "Status da fila" },
                },
            },
        },

        "/v1/integration/production-orders/read/queue/failures": {
            get: {
                tags: ["Production Orders"],
                summary: "Comandos com falha",
                description:
                    "Retorna os comandos com falha mais recentes (últimos 20).",
                responses: {
                    200: { description: "Lista de falhas" },
                },
            },
        },

        "/v1/integration/production-orders/read/{omieCode}/refresh": {
            get: {
                tags: ["Production Orders"],
                summary: "Refresh de OP (live do Omie)",
                description:
                    "Consulta a OP no Omie (ConsultarOrdemProducao), atualiza o espelho local e retorna os dados frescos. Síncrona — sem fila.",
                parameters: [
                    {
                        name: "omieCode",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: { description: "Dados da OP atualizados" },
                    404: { description: "OP não encontrada no Omie" },
                    500: { description: "Erro interno" },
                },
            },
        },
    },
};
