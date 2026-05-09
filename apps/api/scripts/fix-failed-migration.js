#!/usr/bin/env node

/**
 * Script para resolver migração falhada no Render
 * Executar: node scripts/fix-failed-migration.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const MIGRATION_NAME = '20260508213903_add_omie_production_orders';

console.log('🔧 Script para resolver migração falhada no Render');
console.log(`📋 Migração: ${MIGRATION_NAME}`);
console.log('=' .repeat(50));

// Verificar status atual
console.log('\n📊 Verificando status das migrações...');
try {
  const statusOutput = execSync('npx prisma migrate status', { encoding: 'utf8' });
  console.log(statusOutput);
} catch (error) {
  console.log('❌ Erro ao verificar status:', error.message);
}

// Verificar se as tabelas existem
console.log('\n🔍 Verificando se as tabelas foram criadas...');
try {
  const checkTables = `
    npx prisma db execute --stdin << 'EOF'
    SELECT 
      table_name,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = table_name
      ) as exists
    FROM (VALUES ('omie_production_order'), ('omie_production_order_item')) AS t(table_name);
    EOF
  `;
  
  const tableCheck = execSync(checkTables, { encoding: 'utf8', shell: true });
  console.log('Resultado da verificação de tabelas:');
  console.log(tableCheck);
} catch (error) {
  console.log('⚠️  Não foi possível verificar tabelas:', error.message);
}

// Perguntar ao usuário como resolver
rl.question('\n🤔 Como deseja resolver a migração falhada?\n1. Marcar como APLICADA (se as tabelas foram criadas)\n2. Marcar como REVERTIDA (se a migração falhou completamente)\n3. Cancelar\n\nEscolha (1-3): ', (answer) => {
  if (answer === '1') {
    console.log('\n✅ Marcando migração como APLICADA...');
    try {
      execSync(`npx prisma migrate resolve --applied "${MIGRATION_NAME}"`, { stdio: 'inherit' });
      console.log('🎉 Migração marcada como aplicada com sucesso!');
    } catch (error) {
      console.log('❌ Erro ao marcar migração como aplicada:', error.message);
      console.log('\n💡 Tente executar manualmente:');
      console.log(`npx prisma migrate resolve --applied "${MIGRATION_NAME}"`);
    }
  } else if (answer === '2') {
    console.log('\n🔄 Marcando migração como REVERTIDA...');
    try {
      execSync(`npx prisma migrate resolve --rolled-back "${MIGRATION_NAME}"`, { stdio: 'inherit' });
      console.log('🔄 Migração marcada como revertida com sucesso!');
    } catch (error) {
      console.log('❌ Erro ao marcar migração como revertida:', error.message);
      console.log('\n💡 Tente executar manualmente:');
      console.log(`npx prisma migrate resolve --rolled-back "${MIGRATION_NAME}"`);
    }
  } else {
    console.log('❌ Operação cancelada.');
  }
  
  // Verificar status final
  console.log('\n📊 Status final das migrações:');
  try {
    const finalStatus = execSync('npx prisma migrate status', { encoding: 'utf8' });
    console.log(finalStatus);
  } catch (error) {
    console.log('⚠️  Não foi possível verificar status final:', error.message);
  }
  
  console.log('\n✨ Script concluído!');
  rl.close();
});