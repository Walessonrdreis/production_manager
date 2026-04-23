// src/shared/integrations/omie/omie.constants.ts

export const OMIE_ENDPOINTS = {
  SALES_ORDERS_PRODUCTS: {
    path: "produtos/pedido/",
    call: "ListarPedidos",
  },
} as const;