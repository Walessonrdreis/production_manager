export function createGetStage20TotalsDetailedUseCase(deps: { prisma: any }) {
  return {
    async execute() {
      // Primeiro, vamos buscar todos os pedidos stage20 com seus itens
      const orders = await deps.prisma.omieOrder.findMany({
        where: {
          etapa: '20',
          cancelado: 'N',
          encerrado: 'N',
        },
        include: {
          items: true,
        },
      });

      // Agrupar por descrição do produto
      const productMap = new Map<string, {
        description: string;
        totalQuantity: number;
        orders: Array<{
          orderId: string;
          orderNumber: string | null;
          clientCode: string | null;
          clientName: string | null;
          quantity: number;
          productCode: string | null;
        }>;
      }>();

      // Para cada pedido, processar seus itens
      for (const order of orders) {
        // Buscar nome do cliente se tiver código
        let clientName: string | null = null;
        if (order.codigoCliente) {
          try {
            const client = await deps.prisma.client.findFirst({
              where: {
                omieClientCode: BigInt(order.codigoCliente),
              },
              select: {
                tradeName: true,
                legalName: true,
              },
            });
            
            if (client) {
              clientName = client.tradeName || client.legalName;
            }
          } catch (error) {
            console.warn(`Erro ao buscar cliente ${order.codigoCliente}:`, error);
          }
        }

        for (const item of order.items) {
          const description = item.description;
          const quantity = Number(item.quantity);
          
          if (!productMap.has(description)) {
            productMap.set(description, {
              description,
              totalQuantity: 0,
              orders: [],
            });
          }
          
          const productData = productMap.get(description)!;
          productData.totalQuantity += quantity;
          
          // Adicionar detalhes do pedido
          productData.orders.push({
            orderId: order.id,
            orderNumber: order.numeroPedido,
            clientCode: order.codigoCliente,
            clientName,
            quantity,
            productCode: item.omieProductCode,
          });
        }
      }

      // Converter map para array e ordenar por totalQuantity decrescente
      const result = Array.from(productMap.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity);

      return result;
    },
  };
}