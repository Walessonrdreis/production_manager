export interface OmieProduct {
  codigo: string;
  descricao: string;
  unidade: string;
  ncm: string;
  valor_unitario: number;
  estoque: number;
  estoque_minimo: number;
  estoque_maximo: number;
  localizacao?: string;
  data_validade?: Date;
  status: "ativo" | "inativo";
}

export interface OmieProductionOrder {
  codigo_pedido: string;
  numero_pedido: string;
  codigo_cliente: string;
  nome_cliente: string;
  data_previsao: Date;
  etapa: string;
  status: string;
  produtos: Array<{
    codigo_item: string;
    codigo_produto: string;
    descricao: string;
    quantidade: number;
    quantidade_produzida: number;
    unidade: string;
    valor_unitario: number;
    valor_total: number;
  }>;
  observacoes?: string;
}

export interface OmieSalesOrder {
  cabecalho: {
    codigo_pedido: string;
    numero_pedido: string;
    codigo_cliente: string;
    nome_cliente: string;
    data_previsao: Date;
    etapa: string;
    status: string;
    valor_total: number;
  };
  detalhes: Array<{
    codigo_item: string;
    codigo_produto: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valor_unitario: number;
    valor_total: number;
  }>;
}

export interface OmieGatewayPort {
  getProducts(params: {
    page?: number;
    limit?: number;
    productCodes?: string[];
    activeOnly?: boolean;
  }): Promise<{
    products: OmieProduct[];
    total: number;
    page: number;
    limit: number;
  }>;

  getProductionOrders(params: {
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
  }>;

  getSalesOrders(params: {
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
  }>;

  updateProductStock(params: {
    productCode: string;
    quantity: number;
    operation: "add" | "subtract" | "set";
  }): Promise<boolean>;

  updateOrderStatus(params: {
    orderCode: string;
    orderType: "production" | "sales";
    status: string;
    etapa?: string;
  }): Promise<boolean>;
}