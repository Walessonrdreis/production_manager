// Script para verificar clientes no banco de dados
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClients() {
  try {
    console.log('🔍 Verificando clientes no banco de dados...');
    
    // Contar total de clientes
    const totalClients = await prisma.client.count();
    console.log(`📊 Total de clientes no banco: ${totalClients}`);
    
    // Buscar cliente específico pelo código
    const clientCode = BigInt("9542198176");
    const specificClient = await prisma.client.findUnique({
      where: { omieClientCode: clientCode },
      select: {
        omieClientCode: true,
        legalName: true,
        tradeName: true,
        document: true,
      }
    });
    
    console.log('\n🔎 Cliente específico (código 9542198176):');
    if (specificClient) {
      console.log('✅ ENCONTRADO!');
      console.log('   Código:', specificClient.omieClientCode.toString());
      console.log('   Nome Legal:', specificClient.legalName);
      console.log('   Nome Fantasia:', specificClient.tradeName || '(não informado)');
      console.log('   Documento:', specificClient.document);
    } else {
      console.log('❌ NÃO ENCONTRADO!');
      console.log('   Este cliente não existe no banco de dados.');
    }
    
    // Listar alguns clientes para referência
    console.log('\n📋 Alguns clientes no banco (primeiros 5):');
    const someClients = await prisma.client.findMany({
      take: 5,
      select: {
        omieClientCode: true,
        legalName: true,
        tradeName: true,
      },
      orderBy: { omieClientCode: 'asc' }
    });
    
    someClients.forEach((client, index) => {
      console.log(`   ${index + 1}. Código: ${client.omieClientCode.toString()} | Nome: ${client.legalName} ${client.tradeName ? `(${client.tradeName})` : ''}`);
    });
    
    // Verificar se há algum cliente com código similar
    console.log('\n🔍 Buscando clientes com códigos próximos...');
    const similarClients = await prisma.client.findMany({
      where: {
        omieClientCode: {
          gte: BigInt("9542198000"),
          lte: BigInt("9542199000")
        }
      },
      take: 10,
      select: {
        omieClientCode: true,
        legalName: true,
      }
    });
    
    if (similarClients.length > 0) {
      console.log(`   Encontrados ${similarClients.length} clientes com códigos próximos:`);
      similarClients.forEach(client => {
        console.log(`   - ${client.omieClientCode.toString()}: ${client.legalName}`);
      });
    } else {
      console.log('   Nenhum cliente encontrado com códigos próximos.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar clientes:', error.message);
    console.error('   Detalhes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClients();