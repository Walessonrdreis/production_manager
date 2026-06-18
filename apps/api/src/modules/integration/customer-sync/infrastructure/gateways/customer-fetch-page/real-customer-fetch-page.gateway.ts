import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import type {
    CustomerFetchPageGateway,
    CustomerFetchPageInput,
    CustomerFetchPageResult,
} from "../../../application/ports/customer-fetch-page.gateway";

function normalizeText(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function extractFaultString(error: any): string {
    const sample = error?.details?.sample;

    if (typeof sample === "string" && sample.trim() !== "") {
        try {
            const parsed = JSON.parse(sample);
            if (typeof parsed?.faultstring === "string") {
                return parsed.faultstring;
            }
        } catch {
            return sample;
        }

        return sample;
    }

    if (typeof error?.message === "string") {
        return error.message;
    }

    return "";
}

export class RealCustomerFetchPageGateway implements CustomerFetchPageGateway {
    constructor(private readonly omieClient: OmieHttpClientPort) { }

    private parseOmieDate(dateStr: string | null | undefined): Date | null {
        if (!dateStr) return null;
        const [d, m, y] = dateStr.split("/");
        if (!d || !m || !y) return null;
        return new Date(Number(y), Number(m) - 1, Number(d));
    }

    async fetchPage({ page, pageSize, updatedSince }: CustomerFetchPageInput): Promise<CustomerFetchPageResult> {
        try {
            const response = await this.omieClient.post<any>("geral/clientes/", {
                call: "ListarClientes",
                param: [
                    {
                        pagina: page,
                        registros_por_pagina: pageSize,
                        apenas_importado_api: "N",
                    },
                ],
            });

            const rawItems = Array.isArray(response?.clientes_cadastro)
                ? response.clientes_cadastro
                : Array.isArray(response?.cliente_cadastro)
                    ? response.cliente_cadastro
                    : [];

            const totalPages = response?.total_de_paginas != null ? Number(response.total_de_paginas) : null;
            const totalRecords = response?.total_de_registros != null ? Number(response.total_de_registros) : null;

            const itemsToMap = updatedSince
                ? rawItems.filter((item: any) => {
                    const updatedAt = this.parseOmieDate(item.info?.dAlt ?? null);
                    return !updatedAt || !updatedSince || updatedAt > updatedSince;
                })
                : rawItems;

            console.log(
                `[SYNC] Page ${page} - Raw: ${rawItems.length} - Filtered: ${itemsToMap.length} - TotalPages: ${totalPages ?? "unknown"} - TotalRecords: ${totalRecords ?? "unknown"}${updatedSince ? " (incremental)" : " (full)"}`
            );

            const mappedItems = itemsToMap.map((item: any) => {
                const personType = String(item.pessoa_fisica ?? "N") === "S" ? "PF" : "PJ";

                const phoneNumber = item.telefone1_ddd
                    ? `${item.telefone1_ddd}${item.telefone1_numero ?? ""}`
                    : item.telefone1 ?? null;

                return {
                    customerCode: String(item.codigo_cliente_omie ?? item.codigo_cliente ?? ""),
                    legalName: String(item.razao_social ?? item.nome_fantasia ?? ""),
                    tradeName: item.nome_fantasia != null ? String(item.nome_fantasia) : null,
                    document: String(item.cnpj_cpf ?? item.cpf ?? ""),
                    personType,
                    email: item.email != null ? String(item.email) : null,
                    phone: phoneNumber,
                    isActive: String(item.inativo ?? "N") !== "S",
                    isBlocked: String(item.bloqueado ?? "N") === "S",
                    isBillingBlocked: String(item.bloquear_faturamento ?? "N") === "S",
                    createdAtOmie: this.parseOmieDate(item.info?.dInc ?? null),
                    updatedAtOmie: this.parseOmieDate(item.info?.dAlt ?? null),
                    rawPayload: item,
                };
            });

            return {
                items: mappedItems,
                totalPages: totalPages ?? 1,
                currentPage: page,
                totalRecords: totalRecords ?? mappedItems.length,
                hasNext: totalPages != null ? page < totalPages : mappedItems.length > 0,
            };
        } catch (error: any) {
            const faultString = extractFaultString(error);
            const normalizedFault = normalizeText(faultString);

            if (normalizedFault.includes("nao existem registros para a pagina")) {
                console.log(`[SYNC] Page ${page} - END OF DATA`);

                return {
                    items: [],
                    totalPages: page - 1,
                    currentPage: page,
                    totalRecords: 0,
                    hasNext: false,
                };
            }

            throw error;
        }
    }
}
