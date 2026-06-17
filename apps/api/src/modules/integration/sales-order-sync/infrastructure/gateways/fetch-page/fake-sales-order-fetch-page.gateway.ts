import type {
  SalesOrderFetchPageGateway,
  SalesOrderFetchPageResult,
} from "../../../application/ports/sales-order-fetch-page.gateway";

export class FakeSalesOrderFetchPageGateway
  implements SalesOrderFetchPageGateway
{
  async fetchPage(
    page: number,
    _pageSize: number
  ): Promise<SalesOrderFetchPageResult> {
    if (page > 1) {
      return {
        items: [],
        hasNextPage: false,
      };
    }

    return {
      items: [
        {
          omieId: "FAKE-ORDER-001",
          orderNumber: "FAKE-1",
          stage: "20",
          isCanceled: false,
          isClosed: false,
          customerOmieId: "FAKE-CUSTOMER-001",
          companyOmieId: "FAKE-COMPANY-001",
          forecastDate: new Date("2026-06-16T00:00:00.000Z"),
          totalAmount: 100,
          rawPayload: {
            fake: true,
            order: 1,
          },
          items: [
            {
              omieItemId: "FAKE-ITEM-001",
              productCode: "100P",
              productOmieId: "9116171984",
              description: "Produto fake",
              unit: "UND",
              quantity: 2,
              unitPrice: 50,
              totalPrice: 100,
              rawPayload: {
                fake: true,
                item: 1,
              },
            },
          ],
        },
      ],
      hasNextPage: false,
    };
  }
}