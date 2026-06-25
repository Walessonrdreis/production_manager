// ---------------------------------------------------------------------------
// OpenAPI — Sales Order Sync Integration
// ---------------------------------------------------------------------------
// Documentação OpenAPI para todas as rotas do módulo sales-order-sync.
// Segue o mesmo padrão de product-structure/presentation/http/openapi.ts.
// ---------------------------------------------------------------------------

export const salesOrderSyncOpenApi = {
    paths: {
        "/v1/integration/sales-order-sync/commands/sync-global": {
            post: {
                tags: ["Sales Order Sync"],
                summary: "Sync global de pedidos de venda",
                description:
                    "Percorre todas as páginas de ListarPedidos do Omie (etapa 20) e atualiza o espelho local. Idempotente por externalRequestId. Dispara pós-sync: refresh do product-catalog e do summary read-model.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId"],
                                properties: {
                                    externalRequestId: { type: "string", description: "ID de idempotência (obrigatório)" },
                                    pageSize: { type: "number", default: 100, description: "Registros por página (max: 500)" },
                                    maxPages: { type: "number", default: 1000, description: "Máximo de páginas (max: 10000)" },
                                },
                            },
                            example: {
                                externalRequestId: "sales-order-sync-20260624-001",
                                pageSize: 100,
                                maxPages: 1000,
                            },
                        },
                    },
                },
                responses: {
                    202: {
                        description: "Comando aceito para processamento assíncrono",
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
                                                lastSyncAt: { type: "string", format: "date-time", nullable: true, description: "Última sincronização antes desta execução" },
                                            },
                                        },
                                    },
                                },
                                example: {
                                    success: true,
                                    data: {
                                        status: "ACCEPTED",
                                        externalRequestId: "sales-order-sync-20260624-001",
                                        resourceId: "__GLOBAL__",
                                        lastSyncAt: "2026-06-24T08:00:00.000Z",
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Erro de validação (externalRequestId ausente ou inválido)",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        error: {
                                            type: "object",
                                            properties: {
                                                code: { type: "string" },
                                                message: { type: "string" },
                                            },
                                        },
                                    },
                                },
                                example: {
                                    success: false,
                                    error: {
                                        code: "VALIDATION_ERROR",
                                        message: "externalRequestId é obrigatório",
                                    },
                                },
                            },
                        },
                    },
                    500: {
                        description: "Erro interno (omieClient não disponível em modo real)",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        error: {
                                            type: "object",
                                            properties: {
                                                code: { type: "string" },
                                                message: { type: "string" },
                                            },
                                        },
                                    },
                                },
                                example: {
                                    success: false,
                                    error: {
                                        code: "OMIE_CLIENT_NOT_AVAILABLE",
                                        message: "omieClient não foi encontrado no app. Verifique o bootstrap.",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },

        "/v1/integration/sales-order-sync/callbacks/{externalRequestId}/confirm": {
            post: {
                tags: ["Sales Order Sync"],
                summary: "Callback — confirmar comando (fake-only)",
                description:
                    "Callback fake para marcar um comando como CONFIRMED. Disponível apenas quando SALES_ORDER_SYNC_GATEWAY=fake.",
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
                    405: {
                        description: "Não disponível em modo real",
                        content: {
                            "application/json": {
                                example: {
                                    success: false,
                                    error: {
                                        code: "METHOD_NOT_ALLOWED",
                                        message: "Callback confirm disponível apenas em modo fake",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },

        "/v1/integration/sales-order-sync/callbacks/{externalRequestId}/fail": {
            post: {
                tags: ["Sales Order Sync"],
                summary: "Callback — falhar comando (fake-only)",
                description:
                    "Callback fake para marcar um comando como FAILED. Disponível apenas quando SALES_ORDER_SYNC_GATEWAY=fake.",
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
                    405: {
                        description: "Não disponível em modo real",
                        content: {
                            "application/json": {
                                example: {
                                    success: false,
                                    error: {
                                        code: "METHOD_NOT_ALLOWED",
                                        message: "Callback fail disponível apenas em modo fake",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },

        "/v1/integration/sales-order-sync/read/queue": {
            get: {
                tags: ["Sales Order Sync"],
                summary: "Fila de comandos pendentes",
                description: "Retorna comandos em status ACCEPTED (pendentes de processamento).",
                responses: {
                    200: { description: "Lista de comandos na fila" },
                },
            },
        },

        "/v1/integration/sales-order-sync/read/failures": {
            get: {
                tags: ["Sales Order Sync"],
                summary: "Falhas recentes",
                description: "Retorna comandos em status FAILED com erro.",
                responses: {
                    200: { description: "Lista de comandos com falha" },
                },
            },
        },

        "/v1/integration/sales-order-sync/commands/{externalRequestId}": {
            get: {
                tags: ["Sales Order Sync"],
                summary: "Consultar status de sync",
                description:
                    "Retorna o status de um comando de sincronização pelo externalRequestId. Pode estar ACCEPTED (processando), CONFIRMED (concluído) ou FAILED (erro).",
                parameters: [
                    {
                        name: "externalRequestId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "ID do comando gerado no momento do sync",
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
                                                status: { type: "string", enum: ["ACCEPTED", "CONFIRMED", "FAILED"] },
                                                resourceId: { type: "string" },
                                                source: { type: "string", nullable: true },
                                                createdAt: { type: "string", format: "date-time" },
                                                updatedAt: { type: "string", format: "date-time", nullable: true },
                                                completedAt: { type: "string", format: "date-time", nullable: true },
                                                lastError: { type: "string", nullable: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: "Comando não encontrado",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        error: {
                                            type: "object",
                                            properties: {
                                                code: { type: "string" },
                                                message: { type: "string" },
                                            },
                                        },
                                    },
                                },
                                example: {
                                    success: false,
                                    error: {
                                        code: "NOT_FOUND",
                                        message: "Comando não encontrado: sales-order-sync-20260624-001",
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },

        "/v1/admin/read/sales-orders": {
            get: {
                tags: ["Sales Order Sync"],
                summary: "Lista de pedidos resumidos",
                description:
                    "Retorna lista paginada de pedidos de venda com dados resumidos. Suporta filtros por etapa, cancelamento, cliente e busca textual.",
                parameters: [
                    { name: "q", in: "query", schema: { type: "string" }, description: "Busca por número do pedido, nome do cliente ou observação" },
                    { name: "stage", in: "query", schema: { type: "string" }, description: "Filtrar por etapa (ex: 20, 30)" },
                    { name: "customerOmieId", in: "query", schema: { type: "string" }, description: "Filtrar por código do cliente Omie" },
                    { name: "isCanceled", in: "query", schema: { type: "boolean" }, description: "true = só cancelados, false = só não-cancelados" },
                    { name: "isClosed", in: "query", schema: { type: "boolean" }, description: "true = só encerrados, false = só abertos" },
                    { name: "activeOnly", in: "query", schema: { type: "boolean" }, description: "true = apenas não-cancelados e não-encerrados" },
                    { name: "limit", in: "query", schema: { type: "number", default: 100 }, description: "Máx. itens por página" },
                    { name: "offset", in: "query", schema: { type: "number", default: 0 }, description: "Deslocamento para paginação" },
                ],
                responses: {
                    200: {
                        description: "Lista de pedidos",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    orderNumber: { type: "string", nullable: true },
                                                    stage: { type: "string" },
                                                    customerName: { type: "string", nullable: true },
                                                    customerOmieId: { type: "string", nullable: true },
                                                    total: { type: "number", nullable: true },
                                                    forecastDate: { type: "string", format: "date-time", nullable: true },
                                                    isCanceled: { type: "boolean" },
                                                    isClosed: { type: "boolean" },
                                                    createdAt: { type: "string", format: "date-time" },
                                                    updatedAt: { type: "string", format: "date-time" },
                                                },
                                            },
                                        },
                                        meta: {
                                            type: "object",
                                            properties: {
                                                total: { type: "number" },
                                                pageSize: { type: "number" },
                                                pageCount: { type: "number" },
                                                offset: { type: "number" },
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

        "/v1/admin/read/sales-orders/stats": {
            get: {
                tags: ["Sales Order Sync"],
                summary: "Estatísticas de pedidos",
                description: "Retorna estatísticas agregadas dos pedidos de venda: total, cancelados, encerrados e em aberto.",
                responses: {
                    200: {
                        description: "Estatísticas",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                total: { type: "number" },
                                                canceled: { type: "number" },
                                                closed: { type: "number" },
                                                open: { type: "number" },
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

        "/v1/admin/read/sales-orders/transitions": {
            get: {
                tags: ["Sales Order Sync"],
                summary: "Histórico de transições de etapa",
                description: "Retorna o histórico paginado de transições de etapa dos pedidos de venda. Opcionalmente filtra por pedido ou etapa de destino.",
                parameters: [
                    { name: "salesOrderOmieId", in: "query", schema: { type: "string" }, description: "Filtrar por ID Omie do pedido" },
                    { name: "toStage", in: "query", schema: { type: "string" }, description: "Filtrar por etapa de destino" },
                    { name: "limit", in: "query", schema: { type: "number", default: 100 }, description: "Máx. itens por página" },
                    { name: "offset", in: "query", schema: { type: "number", default: 0 }, description: "Deslocamento para paginação" },
                ],
                responses: {
                    200: {
                        description: "Lista de transições",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    salesOrderOmieId: { type: "string" },
                                                    fromStage: { type: "string", nullable: true },
                                                    toStage: { type: "string" },
                                                    createdAt: { type: "string", format: "date-time" },
                                                },
                                            },
                                        },
                                        meta: {
                                            type: "object",
                                            properties: {
                                                total: { type: "number" },
                                                pageSize: { type: "number" },
                                                pageCount: { type: "number" },
                                                offset: { type: "number" },
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

        "/v1/admin/read/sales-orders/{omieId}/transitions": {
            get: {
                tags: ["Sales Order Sync"],
                summary: "Transições de etapa de um pedido",
                description: "Retorna todas as transições de etapa de um pedido de venda específico pelo ID Omie.",
                parameters: [
                    {
                        name: "omieId",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "ID Omie do pedido",
                    },
                ],
                responses: {
                    200: {
                        description: "Transições do pedido",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    id: { type: "string" },
                                                    salesOrderOmieId: { type: "string" },
                                                    fromStage: { type: "string", nullable: true },
                                                    toStage: { type: "string" },
                                                    createdAt: { type: "string", format: "date-time" },
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

        "/v1/admin/read/sales-orders/{omieId}": {
            get: {
                tags: ["Sales Order Sync"],
                summary: "Detalhe de um pedido de venda",
                description:
                    "Retorna os detalhes de um pedido de venda específico pelo omieId. Inclui número, etapa, cliente, valor total, datas e status de cancelamento/encerramento.",
                parameters: [
                    { name: "omieId", in: "path", required: true, schema: { type: "string" }, description: "ID Omie do pedido" },
                ],
                responses: {
                    200: {
                        description: "Detalhe do pedido",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                omieId: { type: "string" },
                                                orderNumber: { type: "string", nullable: true },
                                                stage: { type: "string" },
                                                isCanceled: { type: "boolean" },
                                                isClosed: { type: "boolean" },
                                                customerOmieId: { type: "string", nullable: true },
                                                customerName: { type: "string", nullable: true },
                                                forecastDate: { type: "string", format: "date-time", nullable: true },
                                                totalAmount: { type: "number", nullable: true },
                                                totalItems: { type: "number" },
                                                totalQuantity: { type: "number" },
                                                lastSyncAt: { type: "string", format: "date-time", nullable: true },
                                            },
                                        },
                                    },
                                },
                                example: {
                                    success: true,
                                    data: {
                                        omieId: "1234567890",
                                        orderNumber: "3070",
                                        stage: "20",
                                        isCanceled: false,
                                        isClosed: false,
                                        customerOmieId: "9428243340",
                                        customerName: "SX CORP LTDA",
                                        forecastDate: "2026-05-19T00:00:00.000Z",
                                        totalAmount: 320.00,
                                        totalItems: 1,
                                        totalQuantity: 10,
                                        lastSyncAt: "2026-06-24T10:00:00.000Z",
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: "Pedido não encontrado",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        error: { type: "string" },
                                        message: { type: "string" },
                                    },
                                },
                                example: {
                                    success: false,
                                    error: "NOT_FOUND",
                                    message: "Sales order not found",
                                },
                            },
                        },
                    },
                },
            },
        },

        "/v1/admin/read/sales-orders/open-items": {
            get: {
                tags: ["Sales Order Sync"],
                summary: "Itens em aberto para separação",
                description:
                    "Retorna itens de pedidos em aberto (não cancelados, não encerrados) para a equipe de separação/expedição. Lista produto, quantidade e dados do cliente.",
                parameters: [
                    { name: "q", in: "query", schema: { type: "string" }, description: "Busca por código do produto, descrição ou nome do cliente" },
                    { name: "limit", in: "query", schema: { type: "number", default: 100 }, description: "Máx. itens por página" },
                    { name: "offset", in: "query", schema: { type: "number", default: 0 }, description: "Deslocamento para paginação" },
                ],
                responses: {
                    200: {
                        description: "Itens em aberto",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean" },
                                        data: {
                                            type: "array",
                                            items: {
                                                type: "object",
                                                properties: {
                                                    salesOrderId: { type: "string" },
                                                    orderNumber: { type: "string", nullable: true },
                                                    customerName: { type: "string", nullable: true },
                                                    productCode: { type: "string" },
                                                    description: { type: "string" },
                                                    quantity: { type: "number" },
                                                    unit: { type: "string", nullable: true },
                                                    forecastDate: { type: "string", format: "date-time", nullable: true },
                                                },
                                            },
                                        },
                                        meta: {
                                            type: "object",
                                            properties: {
                                                total: { type: "number" },
                                                pageSize: { type: "number" },
                                                pageCount: { type: "number" },
                                                offset: { type: "number" },
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
};
