// ---------------------------------------------------------------------------
// Gateway Fake — Dados mockados para desenvolvimento offline
// ---------------------------------------------------------------------------
// Segue o padrão de FakeProductStructureFetchPageGateway.
// ---------------------------------------------------------------------------

import type {
    ProductionOrderSyncPageGateway,
    ProductionOrderSyncPageInput,
    ProductionOrderSyncPageResult,
} from "../../../application/ports/production-order-sync-page.gateway";

export class FakeProductionOrderSyncPageGateway
    implements ProductionOrderSyncPageGateway {
    async fetchPage(
        input: ProductionOrderSyncPageInput
    ): Promise<ProductionOrderSyncPageResult> {
        const { page, pageSize } = input;

        // Apenas 1 página com dados mockados
        if (page > 1) {
            return {
                items: [],
                hasNextPage: false,
                totalPages: 1,
                currentPage: page,
            };
        }

        const items = Array.from({
            length: Math.min(pageSize, 3),
        }).map((_, index) => {
            const num = index + 1;
            const now = new Date();
            const updatedAt = new Date(now.getTime() - num * 3600000); // horas diferentes
            return {
                omieId: `${1000000 + num}`,
                number: `${2025}/${String(1000 + num).padStart(5, "0")}`,
                internalCode: `FAKE-OP-${String(num).padStart(4, "0")}`,
                productCode: 900000 + num,
                quantity: 100 * num,
                stage: num === 3 ? "80" : num === 2 ? "40" : "10",
                completed: num === 3,
                forecastDate: new Date(2025, 5, 15 + num).toISOString(),
                completionDate:
                    num === 3 ? new Date(2025, 5, 10 + num).toISOString() : null,
                startDate: new Date(2025, 5, 1).toISOString(),
                stockLocationCode: 1,
                updatedAt,
                raw: {
                    identificacao: {
                        nCodOP: 1000000 + num,
                        cNumOP: `${2025}/${String(1000 + num).padStart(5, "0")}`,
                        cCodIntOP: `FAKE-OP-${String(num).padStart(4, "0")}`,
                        nCodProduto: 900000 + num,
                        nQtde: 100 * num,
                        dDtPrevisao: `15/0${5 + num}/2025`,
                    },
                    infAdicionais: {
                        cEtapa: num === 3 ? "80" : num === 2 ? "40" : "10",
                        dDtInicio: "01/06/2025",
                        dDtConclusao:
                            num === 3 ? `${10 + num}/06/2025` : undefined,
                        codigo_local_estoque: 1,
                    },
                    outrasInf: {
                        cConcluida: num === 3 ? "S" : "N",
                        dAlteracao: `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`,
                        hAlteracao: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`,
                    },
                },
            };
        });

        return {
            items,
            hasNextPage: false,
            totalPages: 1,
            currentPage: page,
        };
    }
}
