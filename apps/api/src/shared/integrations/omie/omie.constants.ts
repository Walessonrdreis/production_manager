// src/shared/integrations/omie/omie.constants.ts

export const OMIE_ENDPOINTS = {
  SALES_ORDERS_PRODUCTS: {
    path: "produtos/pedido/",
    call: "ListarPedidos",
  },
  PRODUCTION_ORDERS: {
    path: "produtos/op/",
    call: "ListarOrdemProducao",
  },
  PRODUCTION_ORDER_CONSULT: {
    path: "produtos/op/",
    call: "ConsultarOrdemProducao",
  },
} as const;