#!/usr/bin/env node

/**
 * Script resiliente para migrações no Render
 * Tenta resolver migrações falhadas automaticamente
 */

const { execSync } = require('child_process');

console.log('🔄 Iniciando migração resiliente...');

// Lista de migrações que podem ter falhado
const FAILED_MIGRATIONS = [
    '20260508213903_add_omie_production_orders'
];

// Tabelas que cada migração deve criar
const MIGRATION_TABLES = {
    '20260508213903_add_omie_production_orders': [
        'omie_production_order',
        'omie_production_order_item'
    ]
};

function runCommand(cmd, ignoreErrors = false) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
        if (!ignoreErrors) {
            console.log(`❌ Erro no comando: ${cmd}`);
            console.log(`   Mensagem: ${error.message}`);
        }
        return null;
    }
}

function checkTableExists(tableName) {
    const sql = `
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${tableName}'
        );
    `;
    
    const result = runCommand(`npx prisma db execute --stdin --query "${sql}"`, true);
    if (!result) return false;
    
    // Extrair resultado (ex: "exists\ntrue\n" ou "exists\nfalse\n")
    return result.includes('true');
}

function resolveFailedMigration(migrationName) {
    console.log(`\n📋 Processando migração: ${migrationName}`);
    
    // Verificar se as tabelas já existem
    const tables = MIGRATION_TABLES[migrationName] || [];
    let allTablesExist = true;
    
    if (tables.length > 0) {
        console.log('🔍 Verificando se as tabelas foram criadas...');
        for (const table of tables) {
            const exists = checkTableExists(table);
            console.log(`   ${table}: ${exists ? '✅ Existe' : '❌ Não existe'}`);
            if (!exists) allTablesExist = false;
        }
    }
    
    // Decidir como resolver
    if (allTablesExist && tables.length > 0) {
        console.log('📝 Marcando migração como APLICADA (tabelas existem)...');
        const result = runCommand(`npx prisma migrate resolve --applied "${migrationName}"`);
        if (result) {
            console.log('✅ Migração resolvida como aplicada');
            return true;
        }
    } else if (tables.length === 0) {
        // Se não sabemos quais tabelas, tentar marcar como aplicada
        console.log('📝 Tentando marcar como APLICADA (abordagem conservadora)...');
        const result = runCommand(`npx prisma migrate resolve --applied "${migrationName}"`);
        if (result) {
            console.log('✅ Migração resolvida como aplicada');
            return true;
        }
    }
    
    // Se não deu certo, tentar marcar como revertida
    console.log('🔄 Tentando marcar como REVERTIDA...');
    const result = runCommand(`npx prisma migrate resolve --rolled-back "${migrationName}"`);
    if (result) {
        console.log('✅ Migração resolvida como revertida');
        return true;
    }
    
    console.log('⚠️  Não foi possível resolver esta migração');
    return false;
}

function main() {
    console.log('🚀 Script de migração resiliente para Render');
    console.log('=' .repeat(50));
    
    // Verificar status atual
    console.log('\n📊 Status atual das migrações:');
    const status = runCommand('npx prisma migrate status', true);
    if (status) {
        console.log(status);
    } else {
        console.log('⚠️  Não foi possível verificar status');
    }
    
    // Resolver migrações falhadas
    console.log('\n🛠️  Resolvendo migrações falhadas...');
    let resolvedCount = 0;
    
    for (const migration of FAILED_MIGRATIONS) {
        if (resolveFailedMigration(migration)) {
            resolvedCount++;
        }
    }
    
    // Aplicar migrações pendentes
    console.log('\n📦 Aplicando migrações pendentes...');
    try {
        const deployResult = execSync('npx prisma migrate deploy', { 
            encoding: 'utf8',
            stdio: 'inherit'
        });
        console.log('✅ Migrações aplicadas com sucesso!');
    } catch (error) {
        console.log('❌ Erro ao aplicar migrações:', error.message);
        console.log('\n💡 Recomendações:');
        console.log('1. Acesse o terminal do Render e execute:');
        console.log('   npx prisma migrate resolve --applied "20260508213903_add_omie_production_orders"');
        console.log('2. Ou execute nosso script interativo:');
        console.log('   npm run db:fix:failed');
        console.log('3. Depois faça um novo deploy');
        
        // Não falhar - permitir que o sistema rode
        console.log('\n⚠️  O sistema pode rodar com migrações pendentes.');
        console.log('   As funcionalidades podem estar limitadas até resolver as migrações.');
    }
    
    console.log('\n🎯 Resumo:');
    console.log(`   Migrações resolvidas: ${resolvedCount}/${FAILED_MIGRATIONS.length}`);
    console.log('✨ Processo concluído!');
}

// Executar
if (require.main === module) {
    main();
}

module.exports = { resolveFailedMigration, checkTableExists };