// Teste para verificar se o cliente existe no banco de dados
const { PrismaClient } = require('@prisma/client');

async function testCliente() {
  const prisma = new PrismaClient();
  
  try {
    const codigoCliente = BigInt('9182202531');
    
    console.log('=== VERIFICANDO CLIENTE NO BANCO ===');
    console.log('Código do cliente:', codigoCliente.toString());
    
    // Buscar cliente no banco
    const cliente = await prisma.client.findFirst({
      where: {
        omieClientCode: codigoCliente
      },
      select: {
        omieClientCode: true,
        legalName: true,
        tradeName: true,
        document: true,
      }
    });
    
    if (cliente) {
      console.log('\n✅ CLIENTE ENCONTRADO:');
      console.log('Código Omie:', cliente.omieClientCode.toString());
      console.log('Nome legal:', cliente.legalName);
      console.log('Nome comercial:', cliente.tradeName);
      console.log('Documento:', cliente.document);
      
      // Verificar qual nome usar
      const nomeCliente = cliente.tradeName || cliente.legalName;
      console.log('\nNome do cliente a ser usado:', nomeCliente);
    } else {
      console.log('\n❌ CLIENTE NÃO ENCONTRADO no banco de dados');
      
      // Verificar quantos clientes existem no banco
      const totalClientes = await prisma.client.count();
      console.log(`Total de clientes no banco: ${totalClientes}`);
      
      // Verificar alguns clientes para ver o formato
      const algunsClientes = await prisma.client.findMany({
        take: 5,
        select: {
          omieClientCode: true,
          legalName: true,
          tradeName: true,
        }
      });
      
      console.log('\nExemplo de clientes no banco:');
      algunsClientes.forEach((c, i) => {
        console.log(`${i+1}. Código: ${c.omieClientCode.toString()} - Nome: ${c.tradeName || c.legalName}`);
      });
    }
    
  } catch (error) {
    console.error('Erro ao buscar cliente:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCliente();