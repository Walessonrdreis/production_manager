// File: apps/api/src/modules/orders-enriched/application/use-cases/list-stage20-orders-enriched.usecase.ts

import { Stage20OrdersFetcher, Stage20OrdersQuery } from "../ports/stage20-orders-fetcher.port";

import { ClientLookup, ClientSnapshot } from "../ports/client-lookup.port";

function extractOrdersArray(payload: any): { containerKey: string; orders: any[] } {
  if (payload?.data && Array.isArray(payload.data)) return { containerKey: "data", orders: payload.data };
  if (payload?.orders && Array.isArray(payload.orders)) return { containerKey: "orders", orders: payload.orders };
  if (payload?.items && Array.isArray(payload.items)) return { containerKey: "items", orders: payload.items };
  return { containerKey: "data", orders: [] };
}
function tryBigInt(value: unknown): bigint | null {
  try {
    if (value === null || value === undefined) return null;

    if (typeof value === "bigint") return value;

    if (typeof value === "number") {
      if (!Number.isFinite(value)) return null;
      return BigInt(value);
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      return BigInt(trimmed);
    }

    return null;
  } catch {
    return null;
  }
}

function extractOmieClientCode(order: any): bigint | null {
  // ✅ FORMATO A — payload Omie cru
  const fromHeader = order?.cabecalho?.codigo_cliente;
  const parsedFromHeader = tryBigInt(fromHeader);
  if (parsedFromHeader) return parsedFromHeader;

  // ✅ FORMATO B — payload normalizado (camelCase)
  const camel =
    order?.codigoCliente ??
    order?.codigoClienteOmie ??
    order?.omieClientCode;

  const parsedCamel = tryBigInt(camel);
  if (parsedCamel) return parsedCamel;

  // ✅ FORMATO C — payload snake_case (defensivo)
  const snake =
    order?.codigo_cliente ??
    order?.codigo_cliente_omie;

  const parsedSnake = tryBigInt(snake);
  if (parsedSnake) return parsedSnake;

  return null;
}

function filterFinancialData(rawPayload: any): any {
  if (!rawPayload) return rawPayload;
  
  // Cria uma cópia do payload para não modificar o original
  const filteredPayload = JSON.parse(JSON.stringify(rawPayload));
  
  // Remove dados financeiros do array det (itens do pedido)
  if (filteredPayload.det && Array.isArray(filteredPayload.det)) {
    filteredPayload.det = filteredPayload.det.map((item: any) => {
      // Remove a propriedade 'imposto' que contém dados financeiros
      const { imposto, ...itemWithoutTax } = item;
      return itemWithoutTax;
    });
  }
  
  // Remove outras seções financeiras se existirem
  const financialSections = [
    'total_pedido',
    'lista_parcelas',
    'frete'
  ];
  
  financialSections.forEach(section => {
    if (filteredPayload[section]) {
      delete filteredPayload[section];
    }
  });
  
  return filteredPayload;
}

export class ListStage20OrdersEnrichedUseCase {
  constructor(
    private readonly ordersFetcher: Stage20OrdersFetcher,
    private readonly clientLookup: ClientLookup
  ) {}

  async execute(query: Stage20OrdersQuery): Promise<any> {
    const ordersPayload = await this.ordersFetcher.fetch(query);

    const { containerKey, orders } = extractOrdersArray(ordersPayload);

    const codes = Array.from(
      new Set(
        orders
          .map(extractOmieClientCode)
          .filter((x): x is bigint => x !== null)
          .map((x) => x.toString())
      )
    ).map((s) => BigInt(s));

    const clients: ClientSnapshot[] =
      codes.length > 0 ? await this.clientLookup.findManyByOmieClientCodes(codes) : [];

    const clientMap = new Map<string, ClientSnapshot>();
    for (const c of clients) clientMap.set(c.omieClientCode.toString(), c);

    const enrichedOrders = orders.map((order: any) => {
      const code = extractOmieClientCode(order);
      const client = code ? clientMap.get(code.toString()) ?? null : null;

      // Extrai nome do cliente (prefere tradeName, fallback para legalName)
      const nomeCliente = client
        ? (client.tradeName || client.legalName)
        : null;

      // Cria um novo objeto com nomeCliente logo após codigoCliente
      // Extraímos os campos que queremos em ordem específica
      const { id, omieCode, numeroPedido, codigoCliente, codigoEmpresa, etapa, cancelado, encerrado, dataPrevisao, rawPayload, ...otherFields } = order;
      
      // Filtra dados financeiros do rawPayload
      const filteredRawPayload = filterFinancialData(rawPayload);
      
      const enrichedOrder = {
        id,
        omieClientCode: omieCode, // Mantém compatibilidade
        omieCode,
        numeroPedido,
        codigoCliente,
        nomeCliente, // Adiciona nomeCliente logo após codigoCliente
        codigoEmpresa,
        etapa,
        cancelado,
        encerrado,
        dataPrevisao,
        rawPayload: filteredRawPayload,
        // Outros campos que podem existir
        ...otherFields,
        client: client
          ? {
              omieClientCode: client.omieClientCode.toString(), // JSON-safe
              legalName: client.legalName,
              tradeName: client.tradeName,
              document: client.document,
            }
          : null,
      };

      return enrichedOrder;
    });

    // Retorna apenas os pedidos enriquecidos
    return enrichedOrders;
  }
}