import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
    CustomerExternalCustomer,
    CustomerFetchGateway,
} from "../../../application/ports/customer-fetch.gateway";
import {
    isOmieErrorResponse,
    isOmieHttpErrorWithSample,
    mapHttpErrorToOmieError,
} from "@/shared/integration/strategies/omie-error.mapper";

export class RealCustomerFetchGateway implements CustomerFetchGateway {
    constructor(private readonly omieClient: OmieHttpClientPort) { }

    async fetchByCustomerCode(customerCode: string): Promise<CustomerExternalCustomer | null> {
        let response: any;

        try {
            response = await this.omieClient.post<any>("geral/clientes/", {
                call: "ConsultarCliente",
                param: [{ codigo_cliente_omie: Number(customerCode) }],
            });
        } catch (httpError) {
            if (isOmieHttpErrorWithSample(httpError)) {
                throw mapHttpErrorToOmieError(httpError);
            }
            throw httpError;
        }

        if (isOmieErrorResponse(response)) {
            throw new Error(
                response?.faultstring || response?.error || "Omie customer consult API error",
            );
        }

        if (!response) {
            return null;
        }

        const personType = String(response.pessoa_fisica ?? "N") === "S" ? "PF" : "PJ";

        const phoneNumber = response.telefone1_ddd
            ? `${response.telefone1_ddd}${response.telefone1_numero ?? ""}`
            : response.telefone1 ?? null;

        const parseOmieDate = (dateStr: string | null | undefined): Date | null => {
            if (!dateStr) return null;
            const [d, m, y] = dateStr.split("/");
            if (!d || !m || !y) return null;
            return new Date(Number(y), Number(m) - 1, Number(d));
        };

        return {
            customerCode: String(response.codigo_cliente_omie ?? response.codigo_cliente ?? customerCode),
            legalName: String(response.razao_social ?? response.nome_fantasia ?? ""),
            tradeName: response.nome_fantasia != null ? String(response.nome_fantasia) : null,
            document: String(response.cnpj_cpf ?? response.cpf ?? ""),
            personType,
            email: response.email != null ? String(response.email) : null,
            phone: phoneNumber,
            isActive: String(response.inativo ?? "N") !== "S",
            isBlocked: String(response.bloqueado ?? "N") === "S",
            isBillingBlocked: String(response.bloquear_faturamento ?? "N") === "S",
            createdAtOmie: parseOmieDate(response.info?.dInc ?? null),
            updatedAtOmie: parseOmieDate(response.info?.dAlt ?? null),
            rawPayload: response,
        };
    }
}
