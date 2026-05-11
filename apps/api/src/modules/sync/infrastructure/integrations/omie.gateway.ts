import { OmieGatewayPort, OmieProduct, OmieProductionOrder, OmieSalesOrder } from "../../application/ports/omie.gateway.port";
import type { Logger } from "@/shared/logger";

export class OmieGateway implements OmieGatewayPort {
  constructor(private readonly logger: Logger) {}

  async getProducts(params: {
    page?: number;
    limit?: number;
    productCodes?: string[];
    activeOnly?: boolean;
  }): Promise<{
    products: OmieProduct[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 100, productCodes, activeOnly = true } = params;

    this.logger.debug("Buscando produtos do Omie", {
      page,
      limit,
      productCodesCount: productCodes?.length,
      activeOnly,
    });

    // Simulação de integração com API Omie
    // Em produção, aqui seria a chamada real para a API Omie

    const mockProducts: OmieProduct[] = [
      {
        codigo: "PROD001",
        descricao: "Produto Exemplo 1",
        unidade: "UN",
        ncm: "1234.56.78",
        valor_unitario: 100.50,
        estoque: 150,
        estoque_minimo: 20,
        estoque_maximo: 200,
        localizacao: "Prateleira A",
        data_validade: new Date("2024-12-31"),
        status: "ativo",
      },
      {
        codigo: "PROD002",
        descricao: "Produto Exemplo 2",
        unidade: "KG",
        ncm: "8765.43.21",
        valor_unitario: 75.25,
        estoque: 45,
        estoque_minimo: 10,
        estoque_maximo: 100,
        localizacao: "Prateleira B",
        status: "ativo",
      },
    ];

    // Filtrar por códigos se especificado
    let filteredProducts = mockProducts;
    if (productCodes && productCodes.length > 0) {
      filteredProducts = mockProducts.filter(p => productCodes.includes(p.codigo));
    }

    // Filtrar por status ativo se especificado
    if (activeOnly) {
      filteredProducts = filteredProducts.filter(p => p.status === "ativo");
    }

    // Paginação simulada
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      total: filteredProducts.length,
      page,
      limit,
    };
  }

  async getProductionOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    orders: OmieProductionOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 100, status, dateFrom, dateTo } = params;

    this.logger.debug("Buscando pedidos de produção do Omie", {
      page,
      limit,
      status,
      dateFrom,
      dateTo,
    });

    // Simulação de integração com API Omie
    const mockOrders: OmieProductionOrder[] = [
      {
        codigo_pedido: "PRODORD001",
        numero_pedido: "1001",
        codigo_cliente: "CLI001",
        nome_cliente: "Cliente Exemplo 1",
        data_previsao: new Date("2024-01-15"),
        etapa: "corte",
        status: "in_production",
        produtos: [
          {
            codigo_item: "ITEM001",
            codigo_produto: "PROD001",
            descricao: "Produto Exemplo 1",
            quantidade: 10,
            quantidade_produzida: 5,
            unidade: "UN",
            valor_unitario: 100.50,
            valor_total: 1005.00,
          },
        ],
        observacoes: "Pedido prioritário",
      },
      {
        codigo_pedido: "PRODORD002",
        numero_pedido: "1002",
        codigo_cliente: "CLI002",
        nome_cliente: "Cliente Exemplo 2",
        data_previsao: new Date("2024-01-20"),
        etapa: "montagem",
        status: "pending",
        produtos: [
          {
            codigo_item: "ITEM002",
            codigo_produto: "PROD002",
            descricao: "Produto Exemplo 2",
            quantidade: 5,
            quantidade_produzida: 0,
            unidade: "KG",
            valor_unitario: 75.25,
            valor_total: 376.25,
          },
        ],
      },
    ];

    // Filtrar por status se especificado
    let filteredOrders = mockOrders;
    if (status && status !== "all") {
      filteredOrders = mockOrders.filter(o => o.status === status);
    }

    // Filtrar por data se especificado
    if (dateFrom) {
      filteredOrders = filteredOrders.filter(o => o.data_previsao >= dateFrom);
    }
    if (dateTo) {
      filteredOrders = filteredOrders.filter(o => o.data_previsao <= dateTo);
    }

    // Paginação simulada
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      total: filteredOrders.length,
      page,
      limit,
    };
  }

  async getSalesOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    orders: OmieSalesOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 100, status, dateFrom, dateTo } = params;

    this.logger.debug("Buscando pedidos de venda do Omie", {
      page,
      limit,
      status,
      dateFrom,
      dateTo,
    });

    // Simulação de integração com API Omie
    const mockOrders: OmieSalesOrder[] = [
      {
        cabecalho: {
          codigo_pedido: "SALESORD001",
          numero_pedido: "2001",
          codigo_cliente: "CLI001",
          nome_cliente: "Cliente Exemplo 1",
          data_previsao: new Date("2024-01-10"),
          etapa: "aprovado",
          status: "approved",
          valor_total: 1500.75,
        },
        detalhes: [
          {
            codigo_item: "SALESITEM001",
            codigo_produto: "PROD001",
            descricao: "Produto Exemplo 1",
            quantidade: 15,
            unidade: "UN",
            valor_unitario: 100.50,
            valor_total: 1507.50,
          },
        ],
      },
      {
        cabecalho: {
          codigo_pedido: "SALESORD002",
          numero_pedido: "2002",
          codigo_cliente: "CLI002",
          nome_cliente: "Cliente Exemplo 2",
          data_previsao: new Date("2024-01-12"),
          etapa: "pendente",
          status: "pending",
          valor_total: 376.25,
        },
        detalhes: [
          {
            codigo_item: "SALESITEM002",
            codigo_produto: "PROD002",
            descricao: "Produto Exemplo 2",
            quantidade: 5,
            unidade: "KG",
            valor_unitario: 75.25,
            valor_total: 376.25,
          },
        ],
      },
    ];

    // Filtrar por status se especificado
    let filteredOrders = mockOrders;
    if (status && status !== "all") {
      filteredOrders = mockOrders.filter(o => o.cabecalho.status === status);
    }

    // Filtrar por data se especificado
    if (dateFrom) {
      filteredOrders = filteredOrders.filter(o => o.cabecalho.data_previsao >= dateFrom);
    }
    if (dateTo) {
      filteredOrders = filteredOrders.filter(o => o.cabecalho.data_previsao <= dateTo);
    }

    // Paginação simulada
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    return {
      orders: paginatedOrders,
      total: filteredOrders.length,
      page,
      limit,
    };
  }

  async updateProductStock(params: {
    productCode: string;
    quantity: number;
    operation: "add" | "subtract" | "set";
  }): Promise<boolean> {
    const { productCode, quantity, operation } = params;

    this.logger.debug("Atualizando estoque no Omie", {
      productCode,
      quantity,
      operation,
    });

    // Simulação de atualização no Omie
    // Em produção, aqui seria a chamada real para a API Omie

    return true;
  }

  async updateOrderStatus(params: {
    orderCode: string;
    orderType: "production" | "sales";
    status: string;
    etapa?: string;
  }): Promise<boolean> {
    const { orderCode, orderType, status, etapa } = params;

    this.logger.debug("Atualizando status de pedido no Omie", {
      orderCode,
      orderType,
      status,
      etapa,
    });

    // Simulação de atualização no Omie
    // Em produção, aqui seria a chamada real para a API Omie

    return true;
  }
}

export function createOmieGateway(logger: Logger): OmieGatewayPort {
  return new OmieGateway(logger);
}