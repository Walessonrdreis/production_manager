export class OmieStockPositionGateway {
  async getPosition(productId: string) {

    // 🔥 CHAMADA OMIE (igual seu padrão existente)
    const payload = {
      call: "ListarPosEstoque",
      param: [{
        nPagina: 1,
        nRegPorPagina: 100
      }]
    };

    // 👉 usar seu client real aqui (igual production-order)

    return {
      success: true,
      data: {
        productId,
        total: 0,
        breakdown: []
      }
    };
  }
}
``