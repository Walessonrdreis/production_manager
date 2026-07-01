// ---------------------------------------------------------------------------
// Route — Search Suggestions (Autocomplete)
// ---------------------------------------------------------------------------
// GET /v1/integration/production-orders/read/search-suggestions?q=...
// Sugestões em tempo real para o campo de busca universal.
//
// Retorna sugestões de: nomes de produto, códigos de produto,
// números de OP e estágios — normalizadas, deduplicadas e ranqueadas.
// ---------------------------------------------------------------------------

import type { FastifyInstance } from "fastify";
import { prisma } from "@/shared/db/prisma";
import { normalize } from "@/shared/search/normalize";
import { tokenize } from "@/shared/search/tokenize";
import { detectQueryType } from "@/shared/search/detect-query-type";

export async function registerSearchSuggestionsRoute(
    app: FastifyInstance
) {
    app.get(
        "/v1/integration/production-orders/read/search-suggestions",
        async (request, reply) => {
            try {
                const { q } = request.query as { q?: string };

                if (!q || q.trim().length < 2) {
                    return reply.code(200).send({ suggestions: [] });
                }

                const queryType = detectQueryType(q);
                const qNormalized = normalize(q);
                const tokens = tokenize(q);

                // ─── Monta WHERE conforme o tipo de query ──────────────
                let where: Record<string, unknown>;

                if (queryType === "omieId") {
                    where = { omieId: { startsWith: q, mode: "insensitive" } };
                } else if (queryType === "orderNumber") {
                    where = {
                        OR: [
                            { orderNumber: { startsWith: q, mode: "insensitive" } },
                            { orderNumberNormalized: { startsWith: qNormalized, mode: "insensitive" } },
                        ],
                    };
                } else if (queryType === "code") {
                    where = {
                        OR: [
                            { productCode: { startsWith: q, mode: "insensitive" } },
                            { productCodeNormalized: { startsWith: qNormalized, mode: "insensitive" } },
                            { stageName: { startsWith: q, mode: "insensitive" } },
                        ],
                    };
                } else {
                    // Text search — prefix match nos campos normalizados
                    if (tokens.length <= 1) {
                        where = {
                            OR: [
                                { productNameNormalized: { startsWith: qNormalized, mode: "insensitive" } },
                                { productCodeNormalized: { startsWith: qNormalized, mode: "insensitive" } },
                                { orderNumberNormalized: { startsWith: qNormalized, mode: "insensitive" } },
                                { stageName: { startsWith: q, mode: "insensitive" } },
                            ],
                        };
                    } else {
                        // Multi-token: primeiro token como prefixo, restante como contains
                        const prefixToken = tokens[0];
                        const restTokens = tokens.slice(1);

                        where = {
                            AND: [
                                {
                                    OR: [
                                        { productNameNormalized: { startsWith: prefixToken, mode: "insensitive" } },
                                        { productCodeNormalized: { startsWith: prefixToken, mode: "insensitive" } },
                                    ],
                                },
                                ...restTokens.map((token) => ({
                                    OR: [
                                        { productNameNormalized: { contains: token, mode: "insensitive" } },
                                        { productCodeNormalized: { contains: token, mode: "insensitive" } },
                                    ],
                                })),
                            ],
                        };
                    }
                }

                // ─── Busca os registros mais relevantes ────────────────
                const records = await prisma.productionOrderReadModel.findMany({
                    where: where as any,
                    select: {
                        productName: true,
                        productCode: true,
                        orderNumber: true,
                        stageName: true,
                    },
                    orderBy: [
                        { priority: "desc" },
                        { daysOverdue: "desc" },
                        { expectedAt: "asc" },
                    ],
                    take: 30,
                });

                // ─── Monta sugestões deduplicadas ──────────────────────
                const seen = new Set<string>();
                const suggestions: Array<{ text: string; type: string; score: number }> = [];

                for (const record of records) {
                    // Sugestão de nome de produto
                    if (record.productName) {
                        const key = `product:${record.productName}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            const normalizedName = normalize(record.productName);
                            let score = 0;
                            if (normalizedName.startsWith(qNormalized)) score = 90;
                            else if (tokens.every((t) => normalizedName.includes(t))) score = 70;
                            else score = 40;

                            suggestions.push({
                                text: record.productName,
                                type: "product",
                                score,
                            });
                        }
                    }

                    // Sugestão de código de produto
                    if (record.productCode) {
                        const key = `code:${record.productCode}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            const normalizedCode = normalize(record.productCode);
                            let score = 0;
                            if (normalizedCode.startsWith(qNormalized)) score = 85;
                            else score = 50;

                            suggestions.push({
                                text: record.productCode,
                                type: "code",
                                score,
                            });
                        }
                    }

                    // Sugestão de número de OP
                    if (record.orderNumber) {
                        const key = `order:${record.orderNumber}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            const normalizedOrder = normalize(record.orderNumber);
                            let score = 0;
                            if (normalizedOrder.startsWith(qNormalized)) score = 100;
                            else score = 60;

                            suggestions.push({
                                text: record.orderNumber,
                                type: "order",
                                score,
                            });
                        }
                    }

                    // Sugestão de estágio
                    if (record.stageName) {
                        const key = `stage:${record.stageName}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            const normalizedStage = normalize(record.stageName);
                            let score = 0;
                            if (normalizedStage.startsWith(qNormalized)) score = 80;
                            else score = 40;

                            suggestions.push({
                                text: record.stageName,
                                type: "stage",
                                score,
                            });
                        }
                    }
                }

                // ─── Ordena por score e limita a 10 sugestões ──────────
                suggestions.sort((a, b) => b.score - a.score);

                return reply.code(200).send({
                    suggestions: suggestions.slice(0, 10),
                });
            } catch (error) {
                console.error("[READ-MODEL][SEARCH-SUGGESTIONS][ERROR]", error);
                return reply.code(500).send({
                    success: false,
                    error: "INTERNAL_ERROR",
                    message: "An unexpected error occurred",
                });
            }
        }
    );
}
