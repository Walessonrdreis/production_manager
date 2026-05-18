// Teste rápido para verificar a lógica do orders-enriched

// Simulação dos dados que o use case processa
const mockOrder = {
  id: "00c5c522-9f4d-4b5d-9d57-6d6d0f8abc53",
  omieCode: "9541964099",
  numeroPedido: "3052",
  codigoCliente: "9541964098",
  codigoEmpresa: "9084171408",
  etapa: "20",
  cancelado: "N",
  encerrado: "N",
  dataPrevisao: "2026-05-14T00:00:00.000Z",
  rawPayload: {
    det: {}
  }
};

// Simulação de cliente encontrado
const mockClient = {
  omieClientCode: BigInt("9541964098"),
  legalName: "EMPRESA XYZ LTDA",
  tradeName: "XYZ COMERCIAL",
  document: "12.345.678/0001-99"
};

// Lógica do use case (simplificada)
function extractOmieClientCode(order) {
  const code = order.codigoCliente;
  if (!code) return null;
  try {
    return BigInt(code);
  } catch {
    return null;
  }
}

function processOrder(order, clientMap) {
  const code = extractOmieClientCode(order);
  const client = code ? clientMap.get(code.toString()) ?? null : null;
  
  // Extrai nome do cliente (prefere tradeName, fallback para legalName)
  const nomeCliente = client
    ? (client.tradeName || client.legalName)
    : null;

  return {
    ...order,
    // Adiciona nomeCliente diretamente no objeto do pedido
    nomeCliente,
    client: client
      ? {
          omieClientCode: client.omieClientCode.toString(),
          legalName: client.legalName,
          tradeName: client.tradeName,
          document: client.document,
        }
      : null,
  };
}

// Teste
const clientMap = new Map();
clientMap.set("9541964098", mockClient);

const result = processOrder(mockOrder, clientMap);

console.log("✅ Teste da lógica do orders-enriched");
console.log("Pedido original tem codigoCliente:", mockOrder.codigoCliente);
console.log("Pedido enriquecido tem nomeCliente:", result.nomeCliente);
console.log("Pedido enriquecido tem client object:", result.client ? "Sim" : "Não");

console.log("\n📋 Resultado completo:");
console.log(JSON.stringify(result, null, 2));

// Verificação
if (result.nomeCliente === "XYZ COMERCIAL") {
  console.log("\n✅ TESTE PASSOU: nomeCliente adicionado corretamente!");
} else {
  console.log("\n❌ TESTE FALHOU: nomeCliente não foi adicionado corretamente.");
}