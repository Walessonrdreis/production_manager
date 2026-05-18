const { PrismaClient } = require('@prisma/client');

async function checkClient() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Consultando cliente com código Omie: 9542198176');
    
    // Primeiro, vamos verificar se o cliente existe
    const client = await prisma.client.findFirst({
      where: {
        omieClientCode: BigInt('9542198176')
      },
      select: {
        omieClientCode: true,
        legalName: true,
        tradeName: true,
        document: true,
      }
    });
    
    console.log('Resultado da consulta:', client);
    
    if (client) {
      console.log('\nCliente encontrado:');
      console.log(`- Código Omie: ${client.omieClientCode}`);
      console.log(`- Legal Name: ${client.legalName}`);
      console.log(`- Trade Name: ${client.tradeName || '(não informado)'}`);
      console.log(`- Documento: ${client.document}`);
      
      // Testar a lógica de extração de nome
      const nomeCliente = client.tradeName || client.legalName;
      console.log(`\nNome do cliente (tradeName || legalName): ${nomeCliente}`);
    } else {
      console.log('\n❌ Cliente NÃO encontrado no banco de dados');
      
      // Vamos listar alguns clientes para ver o formato
      const someClients = await prisma.client.findMany({
        take: 5,
        select: {
          omieClientCode: true,
          legalName: true,
          tradeName: true,
        }
      });
      
      console.log('\nAlguns clientes no banco:');
      someClients.forEach(c => {
        console.log(`- ${c.omieClientCode}: ${c.legalName} (trade: ${c.tradeName || 'n/a'})`);
      });
    }
    
  } catch (error) {
    console.error('Erro ao consultar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClient();