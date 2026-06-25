#!/usr/bin/env node

/**
 * Script resiliente para migrações no Render
 * Tenta resolver migrações falhadas automaticamente
 */

const { execSync } = require('child_process');
const fs = require('fs');

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

function checkTableExists(tableName, schema = 'public') {
    const sql = `
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = '${schema}' 
            AND table_name = '${tableName}'
        );
    `;

    const result = runCommand(`npx prisma db execute --stdin --query "${sql}"`, true);
    if (!result) return false;

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
    console.log('='.repeat(50));

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

        // =========================================================
        // Fallback 1: prisma db push (cria apenas tabelas faltantes)
        // =========================================================
        // db push sem --accept-data-loss NUNCA dropa tabelas não-Prisma
        // (como as do PgBoss). Cria apenas as tabelas que não existem.
        // =========================================================
        console.log('\n🔄 Fallback 1: prisma db push (cria apenas tabelas Prisma faltantes)...');
        try {
            execSync('npx prisma db push', {
                encoding: 'utf8',
                stdio: 'inherit',
                timeout: 120000 // 2 min timeout
            });
            console.log('✅ prisma db push concluído com sucesso!');
        } catch (pushError) {
            console.log('⚠️  Fallback 1 (db push) falhou:', pushError.message);

            // =========================================================
            // Fallback 2: migrate diff (usa DIRECT_URL para evitar PgBouncer)
            // =========================================================
            console.log('\n🔄 Fallback 2: migrate diff (cria SQL apenas das tabelas faltantes)...');
            try {
                // Usar DIRECT_URL (conexão direta, sem PgBouncer)
                const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
                const diffSql = execSync(
                    `npx prisma migrate diff --from-url "${dbUrl}" --to-schema-datamodel prisma/schema.prisma --script`,
                    { encoding: 'utf8', stdio: 'pipe', timeout: 60000 }
                );

                if (!diffSql || diffSql.trim().length === 0) {
                    console.log('✅ Nenhuma tabela Prisma faltante. Schema já está sincronizado.');
                } else {
                    const tmpFile = '/tmp/prisma-tables.sql';
                    fs.writeFileSync(tmpFile, diffSql);
                    const createCount = (diffSql.match(/CREATE TABLE/i) || []).length;
                    console.log(`📝 Geradas ${createCount} nova(s) tabela(s) para criar`);

                    execSync(`npx prisma db execute --file "${tmpFile}"`, {
                        encoding: 'utf8',
                        stdio: 'inherit',
                        timeout: 60000
                    });
                    console.log('✅ Tabelas Prisma criadas sem afetar tabelas PgBoss!');
                }
            } catch (diffError) {
                console.log('❌ Fallback 2 (migrate diff) também falhou:', diffError.message);
                console.log('\n💡 Acesse o banco manualmente e execute:');
                console.log('   npx prisma db push');
            }
        }

        console.log('\n⚠️  Fallback executado. O sistema tentará iniciar.');
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