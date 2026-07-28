// ---------------------------------------------------------------------------
// Gateway Real — Busca página de ordens de produção da Omie
// ---------------------------------------------------------------------------
// Segue o padrão de RealProductStructureFetchPageGateway.
// Usa OmieHttpClientPort + OmieProductionOrdersAdapter.
// ---------------------------------------------------------------------------

import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import { OMIE_ENDPOINTS } from "@/shared/integrations/omie/omie.constants";
import { mapProductionOrder } from "@/shared/integrations/omie/OmieProductionOrdersAdapter";
import {
    isOmieErrorResponse,
    isRedundantFault,
    buildOmieFaultError,
    buildOmieRedundantError,
    isOmieHttpErrorWithSample,
    mapHttpErrorToOmieError,
} from "@/shared/integration/strategies/omie-error.mapper";

import type {
    ProductionOrderSyncPageGateway,
    ProductionOrderSyncPageInput,
    ProductionOrderSyncPageResult,
    ProductionOrderSyncPageItem,
} from "../../../application/ports/production-order-sync-page.gateway";

export class RealProductionOrderSyncPageGateway
    implements ProductionOrderSyncPageGateway {
    constructor(private readonly omieClient: OmieHttpClientPort) { }

    async fetchPage(
        input: ProductionOrderSyncPageInput
    ): Promise<ProductionOrderSyncPageResult> {
        const { page, pageSize, updatedSince } = input;

        const params: any[] = [
            { pagina: page },
            { registros_por_pagina: pageSize },
        ];

        if (updatedSince) {
            // Filtro server-side: reduz páginas buscadas (data de conclusão)
            const dateStr = updatedSince.toISOString().split("T")[0]; // YYYY-MM-DD
            params.push({ dDtConclusaoDe: dateStr });
        }

        let response: any;
        try {
            response = await this.omieClient.post<any>(
                OMIE_ENDPOINTS.PRODUCTION_ORDERS.path,
                {
                    call: OMIE_ENDPOINTS.PRODUCTION_ORDERS.call,
                    param: params,
                }
            );
        } catch (error: unknown) {
            // 🔥 Mapear OMIE_HTTP_ERROR com sample JSON para erros Omie
            if (isOmieHttpErrorWithSample(error)) {
                const mapped = mapHttpErrorToOmieError(error);
                if (mapped) throw mapped;
            }
            throw error;
        }

        // 🔥 Verificar erro semântico na resposta (faultstring / status = "error")
        if (isOmieErrorResponse(response)) {
            const faultstring = String((response as any).faultstring ?? "");
            if (isRedundantFault(faultstring)) {
                throw buildOmieRedundantError(faultstring, response);
            }
            throw buildOmieFaultError(faultstring || "Unknown Omie error", response);
        }

        const cadastros = Array.isArray(response?.cadastros)
            ? response.cadastros
            : [];

        const totalPages =
            response?.total_de_paginas != null
                ? Number(response.total_de_paginas)
                : null;

        const items: ProductionOrderSyncPageItem[] = cadastros
            .map((entry: any): ProductionOrderSyncPageItem | null => {
                const { order } = mapProductionOrder(entry);

                const identificacao = entry?.identificacao ?? {};
                const infAdicionais = entry?.infAdicionais ?? {};
                const outrasInf = entry?.outrasInf ?? {};

                // ── Filtro incremental local (dAlteracao + hAlteracao) ──
                // Complementa o filtro server-side dDtConclusaoDe para capturar
                // alterações que não mudaram a data de conclusão (ex: estágio).
                const updatedAt = parseOmieDateTime(
                    outrasInf.dAlteracao,
                    outrasInf.hAlteracao
                );
                if (updatedSince && updatedAt && updatedAt <= updatedSince) {
                    if (isProductionOrderComplete(entry)) return null; // Skip seguro: não mudou e está completo
                }

                return {
                    omieId: order.omieId,
                    number: String(identificacao.cNumOP ?? ""),
                    internalCode: order.internalCode,
                    productCode: Number(identificacao.nCodProduto ?? 0),
                    quantity: Number(order.quantity),
                    stage: order.stage,
                    completed: order.completed,
                    forecastDate: order.forecastDate,
                    completionDate: order.completionDate,
                    startDate: order.startDate,
                    stockLocationCode:
                        infAdicionais.codigo_local_estoque != null
                            ? Number(infAdicionais.codigo_local_estoque)
                            : null,
                    updatedAt,
                    raw: entry,
                };
            })
            .filter((item): item is ProductionOrderSyncPageItem => item !== null);

        return {
            items,
            hasNextPage: totalPages != null ? page < totalPages : items.length > 0,
            totalPages,
            currentPage: page,
        };
    }
}

// ─── Helpers ───────────────────────────────────────────────────────────

/** Parseia data/hora no formato brasileiro (DD/MM/YYYY + HH:MM:SS) */
function parseOmieDateTime(dateStr?: string | null, timeStr?: string | null): Date | null {
    if (!dateStr) return null;

    const parts = String(dateStr).split("/");
    if (parts.length !== 3) return null;

    const [day, month, year] = parts;
    const isoDate = `${year}-${month}-${day}`;

    if (timeStr) {
        const date = new Date(`${isoDate}T${timeStr}`);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(`${isoDate}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Verifica se uma OP está completa (change detection ≠ completeness).
 * Padrão oficial: is<Entity>Complete()
 * Permite backfill automático de campos que evoluíram no schema.
 */
function isProductionOrderComplete(entry: any): boolean {
    return entry?.identificacao?.cNumOP != null;
}
