const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3333,
  path: '/v1/admin/orders/stage20/enriched',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.data && result.data.length > 0) {
        const primeiroPedido = result.data[0];
        
        console.log('=== ESTRUTURA DO PRIMEIRO PEDIDO ===');
        console.log(`id: ${primeiroPedido.id}`);
        console.log(`omieCode: ${primeiroPedido.omieCode}`);
        console.log(`numeroPedido: ${primeiroPedido.numeroPedido}`);
        console.log(`codigoCliente: ${primeiroPedido.codigoCliente}`);
        console.log(`nomeCliente: ${primeiroPedido.nomeCliente}`);
        console.log(`codigoEmpresa: ${primeiroPedido.codigoEmpresa}`);
        console.log(`etapa: ${primeiroPedido.etapa}`);
        console.log(`cancelado: ${primeiroPedido.cancelado}`);
        console.log(`encerrado: ${primeiroPedido.encerrado}`);
        console.log(`dataPrevisao: ${primeiroPedido.dataPrevisao}`);
        
        console.log('\n=== VERIFICAÇÃO DA ORDEM DOS CAMPOS ===');
        const campos = Object.keys(primeiroPedido);
        const indexCodigoCliente = campos.indexOf('codigoCliente');
        const indexNomeCliente = campos.indexOf('nomeCliente');
        
        console.log(`Posição de codigoCliente: ${indexCodigoCliente}`);
        console.log(`Posição de nomeCliente: ${indexNomeCliente}`);
        console.log(`nomeCliente está logo após codigoCliente? ${indexNomeCliente === indexCodigoCliente + 1}`);
        
        console.log('\n=== OBJETO CLIENT NO FINAL ===');
        console.log(`client: ${JSON.stringify(primeiroPedido.client, null, 2)}`);
        
        // Verificar se todos os pedidos têm nomeCliente
        console.log('\n=== ESTATÍSTICAS ===');
        const totalPedidos = result.data.length;
        const pedidosComNomeCliente = result.data.filter(p => p.nomeCliente).length;
        const pedidosComClient = result.data.filter(p => p.client).length;
        
        console.log(`Total de pedidos: ${totalPedidos}`);
        console.log(`Pedidos com nomeCliente: ${pedidosComNomeCliente} (${Math.round(pedidosComNomeCliente/totalPedidos*100)}%)`);
        console.log(`Pedidos com objeto client: ${pedidosComClient} (${Math.round(pedidosComClient/totalPedidos*100)}%)`);
      } else {
        console.log('Nenhum pedido encontrado');
      }
    } catch (error) {
      console.error('Erro ao processar resposta:', error.message);
      console.log('Resposta bruta:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('Erro na requisição:', error.message);
});

req.end();