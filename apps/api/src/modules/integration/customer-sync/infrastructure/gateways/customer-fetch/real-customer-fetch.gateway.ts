import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";
import type {
    CustomerExternalCustomer,
    CustomerFetchGateway,
} from "../../../application/ports/customer-fetch.gateway";

export class RealCustomerFetchGateway implements CustomerFetchGateway {
    constructor(private readonly omieClient: OmieHttpClientPort) { }

    async fetchByCustomerCode(customerCode: string): Promise<CustomerExternalCustomer | null> {
        const response = await this.omieClient.post<any>("geral/clientes/", {
            call: "ConsultarCliente",
            param: [{ codigo_cliente: customerCode }],
        });

        if (!response) {
            return null;
        }

        const personType = String(response.pessoa_fisica ?? "N") === "S" ? "PF" : "PJ";

        return {
            customerCode: String(response.codigo_cliente ?? customerCode),
            legalName: String(response.razao_social ?? response.nome_fantasia ?? ""),
            tradeName: response.nome_fantasia != null ? String(response.nome_fantasia) : null,
            document: String(response.cnpj_cpf ?? response.cpf ?? ""),
            personType,
            email: response.email != null ? String(response.email) : null,
            phone: response.telefone1 != null ? String(response.telefone1) : null,
            isActive: String(response.inativo ?? "N") !== "S",
            isBlocked: String(response.bloqueado ?? "N") === "S",
            isBillingBlocked: String(response.bloqueado_faturamento ?? "N") === "S",
            createdAtOmie: response.data_cadastro ? new Date(response.data_cadastro) : null,
            updatedAtOmie: response.data_alteracao ? new Date(response.data_alteracao) : null,
            rawPayload: response,
        };
    }
}
