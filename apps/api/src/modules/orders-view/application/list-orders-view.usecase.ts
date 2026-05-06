import { OrdersViewRepository } from "../infrastructure/orders-view.repository.prisma";

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export class ListOrdersViewUseCase {
  constructor(private readonly repo: OrdersViewRepository) {}

  async execute(input: { page: number; pageSize: number }) {
    const { orders, total } = await this.repo.listStage20(input);

    const clientCodes = Array.from(
      new Set(
        orders
          .map((o) => o.codigoCliente)
          .filter((x): x is string => typeof x === "string" && x.trim() !== "")
      )
    );

    const clients = await this.repo.findClientsByCodes(clientCodes);

    const clientMap = new Map(
      clients.map((c) => [c.omieClientCode.toString(), c])
    );

    const result = orders.map((order) => {
      const client =
        order.codigoCliente && order.codigoCliente.trim() !== ""
          ? clientMap.get(order.codigoCliente) ?? null
          : null;

      return {
        order: {
          omieCode: order.omieCode,
          orderNumber: order.numeroPedido ?? null,
          stage: order.etapa,
          expectedDate: order.dataPrevisao ? order.dataPrevisao.toISOString() : null,
          cancelled: order.cancelado === "S",
          closed: order.encerrado === "S",
        },
        client: client
          ? {
              omieClientCode: client.omieClientCode.toString(),
              legalName: client.legalName,
              tradeName: client.tradeName ?? null,
              document: client.document,
            }
          : null,

        // ✅ itens com dados relevantes de produto (sem expor rawPayload)
        items: order.items.map((item) => {
          // rawPayload é Json, então acessamos defensivamente via any
          const raw: any = item.rawPayload ?? {};
          const produto: any = raw.produto ?? {};

          return {
            product: {
              // codigo_produto (numérico) ou omieProductCode se existir
              productId: produto.codigo_produto ?? item.omieProductCode ?? null,
              // codigo (SKU do Omie) ou sku persistido
              sku: produto.codigo ?? item.sku ?? null,
              description: produto.descricao ?? item.description,
              unit: produto.unidade ?? item.unit ?? null,
              reserved: (produto.reservado ?? "N") === "S",
            },
            quantity: toNumberOrNull(produto.quantidade) ?? toNumberOrNull(item.quantity) ?? 0,
            unitPrice: toNumberOrNull(produto.valor_unitario) ?? toNumberOrNull(item.unitPrice),
            discount: toNumberOrNull(produto.valor_desconto) ?? 0,
            totalPrice:
              toNumberOrNull(produto.valor_total) ??
              toNumberOrNull(produto.valor_mercadoria) ??
              toNumberOrNull(item.totalPrice),
          };
        }),

        lastSyncAt: order.lastSyncAt.toISOString(),
      };
    });

    return {
      meta: {
        page: input.page,
        pageSize: input.pageSize,
        total,
      },
      orders: result,
    };
  }
}