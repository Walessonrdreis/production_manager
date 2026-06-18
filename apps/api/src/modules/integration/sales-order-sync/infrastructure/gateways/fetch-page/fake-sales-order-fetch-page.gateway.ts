import type {
  SalesOrderFetchPageGateway,
  SalesOrderFetchPageInput,
  SalesOrderFetchPageItem,
  SalesOrderFetchPageResult,
} from "../../../application/ports/sales-order-fetch-page.gateway";

export class FakeSalesOrderFetchPageGateway
  implements SalesOrderFetchPageGateway
{
  async fetchPage({
    page,
    pageSize,
    updatedSince, // ✅ precisa existir por contrato
  }: SalesOrderFetchPageInput): Promise<SalesOrderFetchPageResult> {
    // ✅ dados fake mínimos (simula 1 página com 1 pedido)
    const items: SalesOrderFetchPageItem[] = [
      {
        omieId: "fake-order-1",
        orderNumber: "001",
        stage: "20",
        isCanceled: false,
        isClosed: false,
        customerOmieId: "fake-customer-1",
        companyOmieId: "fake-company-1",
        forecastDate: new Date(),
        totalAmount: 100,
        rawPayload: {
          fake: true,
        },

        items: [
          {
            omieItemId: "fake-item-1",
            productCode: "PROD-001",
            productOmieId: "123",
            description: "Produto Fake",
            unit: "UN",
            quantity: 10,
            unitPrice: 10,
            totalPrice: 100,
            rawPayload: {
              fake: true,
            },
          },
        ],
      },
    ];

    // ✅ você pode opcionalmente simular incremental
    // (exemplo: quando updatedSince existe, retornar vazio)
    if (updatedSince) {
      return {
        items: [],
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
      };
    }

    return {
      items,
      currentPage: page,
      totalPages: 1,
      hasNextPage: false,
    };
  }
}
``