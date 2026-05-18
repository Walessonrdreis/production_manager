// Teste específico para o problema do nomeCliente

// Simulação do pedido exato do JSON
const mockOrder = {
  "id": "83443280-afa9-45a1-b9c5-655cbfd021db",
  "omieCode": "9542202219",
  "numeroPedido": "3061",
  "codigoCliente": "9542198176",  // ← string no objeto principal
  "codigoEmpresa": "9084171408",
  "etapa": "20",
  "cancelado": "N",
  "encerrado": "N",
  "dataPrevisao": "2026-05-15T00:00:00.000Z",
  "rawPayload": {
    "cabecalho": {
      "codigo_cliente": 9542198176  // ← número no rawPayload
    }
  }
};

// Função do use case (versão simplificada)
function tryBigInt(value) {
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

function extractOmieClientCode(order) {
  // ✅ FORMATO A — payload Omie cru
  const fromHeader = order?.rawPayload?.cabecalho?.codigo_cliente;
  const parsedFromHeader = tryBigInt(fromHeader);
  if (parsedFromHeader) {
    console.log("📌 Código extraído do rawPayload.cabecalho.codigo_cliente:", fromHeader, "→", parsedFromHeader);
    return parsedFromHeader;
  }

  // ✅ FORMATO B — payload normalizado (camelCase)
  const camel = order?.codigoCliente ?? order?.codigoClienteOmie ?? order?.omieClientCode;
  const parsedCamel = tryBigInt(camel);
  if (parsedCamel) {
    console.log("📌 Código extraído do codigoCliente (camelCase):", camel, "→", parsedCamel);
    return parsedCamel;
  }

  // ✅ FORMATO C — payload snake_case (defensivo)
  const snake = order?.codigo_cliente ?? order?.codigo_cliente_omie;
  const parsedSnake = tryBigInt(snake);
  if (parsedSnake) {
    console.log("📌 Código extraído do codigo_cliente (snake_case):", snake, "→", parsedSnake);
    return parsedSnake;
  }

  console.log("❌ Nenhum código de cliente encontrado");
  return null;
}

// Teste da extração
console.log("🔍 Testando extração do código do cliente...");
const extractedCode = extractOmieClientCode(mockOrder);
console.log("✅ Código extraído:", extractedCode);

// Simulação de cliente encontrado
const mockClient = {
  omieClientCode: BigInt("9542198176"),
  legalName: "LABARR C DE ORIGEM LTDA",  // ← nome do cliente do JSON
  tradeName: null,  // ← tradeName é null no JSON
  document: "28.866.837/0001-37"
};

// Processamento do pedido
const clientMap = new Map();
clientMap.set("9542198176", mockClient);

const code = extractedCode;
const client = code ? clientMap.get(code.toString()) ?? null : null;

// Extrai nome do cliente (prefere tradeName, fallback para legalName)
const nomeCliente = client
  ? (client.tradeName || client.legalName)
  : null;

console.log("\n📊 Resultado do processamento:");
console.log("🔹 Código do cliente:", code);
console.log("🔹 Cliente encontrado:", client ? "Sim" : "Não");
console.log("🔹 tradeName:", client?.tradeName);
console.log("🔹 legalName:", client?.legalName);
console.log("🔹 nomeCliente calculado:", nomeCliente);

// Resultado final
const result = {
  ...mockOrder,
  nomeCliente,  // ← Deve ser "LABARR C DE ORIGEM LTDA"
  client: client
    ? {
        omieClientCode: client.omieClientCode.toString(),
        legalName: client.legalName,
        tradeName: client.tradeName,
        document: client.document,
      }
    : null,
};

console.log("\n🎯 Resultado final (simplificado):");
console.log(JSON.stringify({
  id: result.id,
  codigoCliente: result.codigoCliente,
  nomeCliente: result.nomeCliente,
  client: result.client ? "Presente" : "Ausente"
}, null, 2));

if (nomeCliente === "LABARR C DE ORIGEM LTDA") {
  console.log("\n✅ TESTE PASSOU: nomeCliente seria adicionado corretamente!");
} else {
  console.log("\n❌ TESTE FALHOU: nomeCliente não seria adicionado corretamente.");
  console.log("   Esperado: 'LABARR C DE ORIGEM LTDA'");
  console.log("   Obtido:", nomeCliente);
}