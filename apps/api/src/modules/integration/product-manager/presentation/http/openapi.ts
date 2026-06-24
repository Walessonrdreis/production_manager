// ---------------------------------------------------------------------------
// OpenAPI — Product Manager Integration
// ---------------------------------------------------------------------------
// Documentação OpenAPI (3.0) para todas as rotas do módulo product-manager.
//
// Rotas documentadas (3):
//   Commands (POST, 3): create, update, inactivate
// ---------------------------------------------------------------------------

export const productManagerOpenApi = {
    paths: {
        // ─── Create Product ──────────────────────────────────────────────

        "/v1/integration/product-manager/commands/create": {
            post: {
                tags: ["Product Manager"],
                summary: "Criar produto no Omie",
                description:
                    "Enfileira o comando CREATE no PgBoss (PENDING) e retorna 202. O worker 'product-manager.create' executa a criação real no Omie via IncluirProduto de forma assíncrona. Após sucesso, atualiza o espelho local (OmieProduct).",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "description"],
                                properties: {
                                    externalRequestId: { type: "string", description: "ID único de idempotência" },
                                    description: { type: "string", description: "Descrição do produto (obrigatório)" },
                                    sku: { type: "string", nullable: true, description: "Código SKU" },
                                    familyDescription: { type: "string", nullable: true, description: "Descrição da família" },
                                    brand: { type: "string", nullable: true, description: "Marca" },
                                    unit: { type: "string", nullable: true, description: "Unidade de medida" },
                                    ncm: { type: "string", nullable: true, description: "Código NCM" },
                                },
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
                                                externalRequestId: { type: "string" },
                                                status: { type: "string", enum: ["ACCEPTED"] },
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

        // ─── Update Product ──────────────────────────────────────────────

        "/v1/integration/product-manager/commands/update": {
            post: {
                tags: ["Product Manager"],
                summary: "Atualizar produto no Omie",
                description:
                    "Enfileira o comando UPDATE no PgBoss (PENDING) e retorna 202. O worker 'product-manager.update' executa a atualização real no Omie via AlterarProduto de forma assíncrona. Após sucesso, atualiza o espelho local (OmieProduct).",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "productCode"],
                                properties: {
                                    externalRequestId: { type: "string", description: "ID único de idempotência" },
                                    productCode: { type: "string", description: "Código do produto no Omie (obrigatório)" },
                                    description: { type: "string", nullable: true, description: "Nova descrição" },
                                    sku: { type: "string", nullable: true, description: "Novo SKU" },
                                    familyDescription: { type: "string", nullable: true, description: "Nova descrição da família" },
                                    brand: { type: "string", nullable: true, description: "Nova marca" },
                                    unit: { type: "string", nullable: true, description: "Nova unidade" },
                                    ncm: { type: "string", nullable: true, description: "Novo NCM" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    202: { description: "Comando aceito para processamento assíncrono" },
                    400: { description: "Erro de validação (Zod)" },
                },
            },
        },

        // ─── Inactivate Product ──────────────────────────────────────────

        "/v1/integration/product-manager/commands/inactivate": {
            post: {
                tags: ["Product Manager"],
                summary: "Inativar produto no Omie",
                description:
                    "Enfileira o comando INACTIVATE no PgBoss (PENDING) e retorna 202. O worker 'product-manager.inactivate' executa a inativação no Omie via AlterarProduto com ativo='N' de forma assíncrona. Após sucesso, atualiza o espelho local (OmieProduct) com active=false.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["externalRequestId", "productCode"],
                                properties: {
                                    externalRequestId: { type: "string", description: "ID único de idempotência" },
                                    productCode: { type: "string", description: "Código do produto no Omie (obrigatório)" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    202: { description: "Comando aceito para processamento assíncrono" },
                    400: { description: "Erro de validação (Zod)" },
                },
            },
        },
    },
};
