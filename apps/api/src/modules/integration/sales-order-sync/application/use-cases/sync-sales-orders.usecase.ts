import { prisma } from "@/shared/db/prisma";

type SyncSalesOrdersInput = {
  payload: any;
};

export class SyncSalesOrdersUseCase {
  async execute(input: SyncSalesOrdersInput) {
    const { payload } = input;

    const orders = payload.pedido_venda_produto ?? [];

    for (const order of orders) {
      const cabecalho = order.cabecalho;
      const total = order.total_pedido;

      const salesOrder = await prisma.salesOrder.upsert({
        where: {
          omieId: String(cabecalho.codigo_pedido),
        },
        create: {
          omieId: String(cabecalho.codigo_pedido),
          orderNumber: cabecalho.numero_pedido ?? null,
          stage: String(cabecalho.etapa),
          customerOmieId: cabecalho.codigo_cliente
            ? String(cabecalho.codigo_cliente)
            : null,
          companyOmieId: cabecalho.codigo_empresa
            ? String(cabecalho.codigo_empresa)
            : null,
          forecastDate: cabecalho.data_previsao
            ? new Date(cabecalho.data_previsao.split("/").reverse().join("-"))
            : null,
          totalAmount: total?.valor_total_pedido ?? null,
          rawPayload: order,
        },
        update: {
          stage: String(cabecalho.etapa),
          totalAmount: total?.valor_total_pedido ?? null,
          rawPayload: order,
        },
      });

      const items = order.det ?? [];

      for (const item of items) {
        const produto = item.produto;
        const ide = item.ide;

        if (!produto || !ide) continue;

        await prisma.salesOrderItem.upsert({
          where: {
            omieItemId: String(ide.codigo_item),
          },
          create: {
            omieItemId: String(ide.codigo_item),

            productCode: produto.codigo, // ✅ chave correta
            productOmieId: String(produto.codigo_produto),

            description: produto.descricao,
            unit: produto.unidade ?? null,

            quantity: produto.quantidade,
            unitPrice: produto.valor_unitario ?? null,
            totalPrice: produto.valor_total ?? null,

            rawPayload: item,

            salesOrderId: salesOrder.id,
          },
          update: {
            description: produto.descricao,
            quantity: produto.quantidade,
            unitPrice: produto.valor_unitario ?? null,
            totalPrice: produto.valor_total ?? null,
            rawPayload: item,
          },
        });
      }
    }

    return {
      ok: true,
      ordersProcessed: orders.length,
    };
  }
}