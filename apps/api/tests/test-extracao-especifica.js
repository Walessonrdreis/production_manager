// Teste específico para o pedido com codigoCliente: "9182202531"

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

// Simular o pedido que você mostrou
const pedidoExemplo = {
  "id": "4762eb51-d1a0-4778-904a-ea5fdd7046d3",
  "omieCode": "9542615497",
  "numeroPedido": "3063",
  "codigoCliente": "9182202531",
  "codigoEmpresa": "9084171408",
  "etapa": "20",
  "cancelado": "N",
  "encerrado": "N",
  "dataPrevisao": "2026-05-18T00:00:00.000Z",
  "rawPayload": {
    "cabecalho": {
      "codigo_cliente": 9182202531
    }
  }
};

console.log('=== TESTE DE EXTRAÇÃO ===');
console.log('Pedido completo:', JSON.stringify(pedidoExemplo, null, 2));
console.log('\n--- Extraindo código do cliente ---');

const codigoExtraido = extractOmieClientCode(pedidoExemplo);
console.log('Código extraído:', codigoExtraido);
console.log('Tipo do código extraído:', typeof codigoExtraido);

if (codigoExtraido) {
  console.log('Código como string:', codigoExtraido.toString());
  console.log('Código como número:', Number(codigoExtraido));
} else {
  console.log('ERRO: Não foi possível extrair o código do cliente');
  
  // Verificar cada caminho individualmente
  console.log('\n--- Debug detalhado ---');
  console.log('1. order?.cabecalho?.codigo_cliente:', pedidoExemplo?.cabecalho?.codigo_cliente);
  console.log('2. order?.codigoCliente:', pedidoExemplo?.codigoCliente);
  console.log('3. order?.codigoClienteOmie:', pedidoExemplo?.codigoClienteOmie);
  console.log('4. order?.omieClientCode:', pedidoExemplo?.omieClientCode);
  console.log('5. order?.codigo_cliente:', pedidoExemplo?.codigo_cliente);
  console.log('6. order?.codigo_cliente_omie:', pedidoExemplo?.codigo_cliente_omie);
}