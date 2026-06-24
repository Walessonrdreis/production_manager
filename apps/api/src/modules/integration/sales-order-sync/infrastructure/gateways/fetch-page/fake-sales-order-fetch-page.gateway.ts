import type {
  SalesOrderFetchPageGateway,
  SalesOrderFetchPageInput,
  SalesOrderFetchPageItem,
  SalesOrderFetchPageResult,
} from "../../../application/ports/sales-order-fetch-page.gateway";

export class FakeSalesOrderFetchPageGateway
  implements SalesOrderFetchPageGateway {
  async fetchPage({
    page,
    pageSize,
    updatedSince,
  }: SalesOrderFetchPageInput): Promise<SalesOrderFetchPageResult> {
    // ✅ Retorna 3 itens na página 1, 0 nas páginas seguintes
    if (page > 1 || updatedSince) {
      return {
        items: [],
        currentPage: page,
        totalPages: 1,
        hasNextPage: false,
      };
    }

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
        updatedAt: new Date("2026-06-24T10:00:00.000Z"),
        rawPayload: { fake: true },
        items: [
          {
            omieItemId: "fake-item-1",
            productCode: "PROD-001",
            productOmieId: "123",
            description: "Produto Fake A",
            unit: "UN",
            quantity: 10,
            unitPrice: 10,
            totalPrice: 100,
            rawPayload: { fake: true },
          },
        ],
      },
      {
        omieId: "fake-order-2",
        orderNumber: "002",
        stage: "20",
        isCanceled: false,
        isClosed: false,
        customerOmieId: "fake-customer-2",
        companyOmieId: "fake-company-1",
        forecastDate: new Date(),
        totalAmount: 250,
        updatedAt: new Date("2026-06-24T11:00:00.000Z"),
        rawPayload: { fake: true },
        items: [
          {
            omieItemId: "fake-item-2",
            productCode: "PROD-002",
            productOmieId: "456",
            description: "Produto Fake B",
            unit: "UN",
            quantity: 5,
            unitPrice: 50,
            totalPrice: 250,
            rawPayload: { fake: true },
          },
        ],
      },
      {
        omieId: "fake-order-3",
        orderNumber: "003",
        stage: "20",
        isCanceled: false,
        isClosed: false,
        customerOmieId: "fake-customer-1",
        companyOmieId: "fake-company-1",
        forecastDate: new Date(),
        totalAmount: 75,
        updatedAt: new Date("2026-06-24T12:00:00.000Z"),
        rawPayload: { fake: true },
        items: [
          {
            omieItemId: "fake-item-3",
            productCode: "PROD-003",
            productOmieId: "789",
            description: "Produto Fake C",
            unit: "PC",
            quantity: 3,
            unitPrice: 25,
            totalPrice: 75,
            rawPayload: { fake: true },
          },
        ],
      },
    ];

    return {
      items,
      currentPage: page,
      totalPages: 1,
      hasNextPage: false,
    };
  }
}
``