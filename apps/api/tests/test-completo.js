const http = require('http');

// Testar o endpoint
const options = {
  hostname: 'localhost',
  port: 3333,
  path: '/v1/admin/orders/stage20/enriched?page=1&pageSize=10',
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
};

console.log('Testando endpoint: http://localhost:3333/v1/admin/orders/stage20/enriched?page=1&pageSize=10\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      
      console.log('\n=== ANÁLISE DA RESPOSTA ===\n');
      
      // Verificar estrutura
      console.log(`1. Tem enrichedOrders? ${!!parsed.enrichedOrders}`);
      console.log(`2. Quantidade de pedidos: ${parsed.enrichedOrders?.length || 0}`);
      
      if (parsed.enrichedOrders && parsed.enrichedOrders.length > 0) {
        const firstOrder = parsed.enrichedOrders[0];
        
        console.log('\n3. Primeiro pedido:');
        console.log(`   - ID: ${firstOrder.id}`);
        console.log(`   - Código Omie: ${firstOrder.omieCode}`);
        console.log(`   - Número Pedido: ${firstOrder.numeroPedido}`);
        console.log(`   - Código Cliente: ${firstOrder.codigoCliente}`);
        console.log(`   - Nome Cliente: ${firstOrder.nomeCliente || '(NÃO PRESENTE)'}`);
        console.log(`   - Client object: ${firstOrder.client ? 'PRESENTE' : 'AUSENTE'}`);
        
        // Verificar se o campo nomeCliente está presente
        if (firstOrder.nomeCliente) {
          console.log('\n✅✅✅ CAMPO nomeCliente ESTÁ PRESENTE! ✅✅✅');
          console.log(`   Valor: "${firstOrder.nomeCliente}"`);
        } else {
          console.log('\n❌❌❌ CAMPO nomeCliente NÃO ESTÁ PRESENTE! ❌❌❌');
        }
        
        // Verificar o pedido específico que o usuário mencionou
        const specificOrder = parsed.enrichedOrders.find(
          order => order.codigoCliente === "9182202531"
        );
        
        if (specificOrder) {
          console.log('\n4. Pedido específico (codigoCliente: 9182202531):');
          console.log(`   - ID: ${specificOrder.id}`);
          console.log(`   - Nome Cliente: "${specificOrder.nomeCliente}"`);
          console.log(`   - Client: ${JSON.stringify(specificOrder.client, null, 2)}`);
        }
        
        // Contar quantos pedidos têm nomeCliente
        const withNomeCliente = parsed.enrichedOrders.filter(o => o.nomeCliente).length;
        console.log(`\n5. Estatísticas:`);
        console.log(`   - Pedidos com nomeCliente: ${withNomeCliente}/${parsed.enrichedOrders.length}`);
        console.log(`   - Pedidos sem nomeCliente: ${parsed.enrichedOrders.length - withNomeCliente}/${parsed.enrichedOrders.length}`);
        
      } else {
        console.log('\n❌ Nenhum pedido retornado');
      }
      
    } catch (error) {
      console.error('\n❌ Erro ao analisar resposta:', error.message);
      console.log('Resposta bruta (primeiros 500 caracteres):', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Erro na requisição:', error.message);
});

req.end();