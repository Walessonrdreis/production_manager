export interface Order {
  id: string;
  productId: string;
  orderNumber?: string;
  clientName?: string;
  quantity: number;
  checked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createOrder(params: {
  productId: string;
  orderNumber?: string;
  clientName?: string;
  quantity: number;
}): Order {
  const now = new Date();
  
  return {
    id: crypto.randomUUID(),
    productId: params.productId,
    orderNumber: params.orderNumber,
    clientName: params.clientName,
    quantity: params.quantity,
    checked: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function toggleOrderCheck(order: Order): Order {
  return {
    ...order,
    checked: !order.checked,
    updatedAt: new Date(),
  };
}

export function setOrderChecked(order: Order, checked: boolean): Order {
  return {
    ...order,
    checked,
    updatedAt: new Date(),
  };
}