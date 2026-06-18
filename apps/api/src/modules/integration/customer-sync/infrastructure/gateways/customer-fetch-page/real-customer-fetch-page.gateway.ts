import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

import type {
    CustomerFetchPageGateway,
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

    async fetchPage(page: number, pageSize: number): Promise<CustomerFetchPageResult> {
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

            const items = Array.isArray(response?.cliente_cadastro)
                ? response.cliente_cadastro
                : [];

            const totalPages = response?.total_de_paginas != null ? Number(response.total_de_paginas) : null;
            const totalRecords = response?.total_de_registros != null ? Number(response.total_de_registros) : null;

            console.log(
                `[SYNC] Page ${page} - Items: ${items.length} - TotalPages: ${totalPages ?? "unknown"} - TotalRecords: ${totalRecords ?? "unknown"}`
            );

            const mappedItems = items.map((item: any) => {
                const personType = String(item.pessoa_fisica ?? "N") === "S" ? "PF" : "PJ";

                return {
                    customerCode: String(item.codigo_cliente ?? ""),
                    legalName: String(item.razao_social ?? item.nome_fantasia ?? ""),
                    tradeName: item.nome_fantasia != null ? String(item.nome_fantasia) : null,
                    document: String(item.cnpj_cpf ?? item.cpf ?? ""),
                    personType,
                    email: item.email != null ? String(item.email) : null,
                    phone: item.telefone1 != null ? String(item.telefone1) : null,
                    isActive: String(item.inativo ?? "N") !== "S",
                    isBlocked: String(item.bloqueado ?? "N") === "S",
                    isBillingBlocked: String(item.bloqueado_faturamento ?? "N") === "S",
                    createdAtOmie: item.data_cadastro ? new Date(item.data_cadastro) : null,
                    updatedAtOmie: item.data_alteracao ? new Date(item.data_alteracao) : null,
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
