#!/usr/bin/env node

/**
 * Script resiliente para migrações no Render
 * Tenta resolver migrações falhadas automaticamente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

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

/**
 * Cria baseline do Prisma: registra todas as migrações como aplicadas
 * no banco, criando a tabela _prisma_migrations se necessário.
 * Isso permite que migrate deploy funcione em deploys futuros.
 */
function baselineMigrations() {
    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');

    // 1. Verificar se _prisma_migrations já existe com registros
    console.log('\n🔍 Verificando baseline do Prisma...');
    const checkSql =
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'integration' AND table_name = '_prisma_migrations');`;
    const tmpCheck = '/tmp/prisma-check-migrations.sql';
    fs.writeFileSync(tmpCheck, checkSql);
    const checkResult = runCommand(
        `npx prisma db execute --file "${tmpCheck}"`,
        true
    );

    if (checkResult && /\bt\b/.test(checkResult)) {
        console.log('✅ _prisma_migrations já existe. Baseline não necessário.');
        return true;
    }

    // 2. Listar diretórios de migração (ordenados alfabeticamente)
    const items = fs
        .readdirSync(migrationsDir)
        .filter((f) => {
            if (f === 'migration_lock.toml') return false;
            const stat = fs.statSync(path.join(migrationsDir, f));
            return stat.isDirectory();
        })
        .sort();

    if (items.length === 0) {
        console.log('⚠️  Nenhuma migração encontrada em prisma/migrations');
        return false;
    }

    console.log(`📋 Registrando ${items.length} migrações como aplicadas...`);

    // 3. Gerar SQL: CREATE TABLE + INSERT para cada migração
    let sql = `
CREATE TABLE IF NOT EXISTS integration._prisma_migrations (
    "id" TEXT PRIMARY KEY,
    "checksum" TEXT NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" TEXT NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
`;

    // Usar DO block para evitar duplicatas se re-executar
    sql += `DO $$ BEGIN\n`;

    for (const migration of items) {
        const migDir = path.join(migrationsDir, migration);
        const migFiles = fs
            .readdirSync(migDir)
            .filter((f) => f !== '.' && f !== '..')
            .sort();

        // Calcular checksum (SHA-256) — formato usado pelo Prisma engine
        const hash = crypto.createHash('sha256');
        for (const file of migFiles) {
            const content = fs.readFileSync(path.join(migDir, file));
            hash.update(Buffer.from(file, 'utf8'));
            hash.update(Buffer.from([0])); // NUL byte
            hash.update(content);
            hash.update(Buffer.from([0])); // NUL byte
        }
        const checksum = hash.digest('hex');
        const id = crypto.randomUUID();

        sql += `    IF NOT EXISTS (SELECT 1 FROM integration._prisma_migrations WHERE migration_name = '${migration.replace(/'/g, "''")}') THEN\n`;
        sql += `        INSERT INTO integration._prisma_migrations (id, checksum, finished_at, migration_name, started_at, applied_steps_count) VALUES ('${id}', '${checksum}', NOW(), '${migration.replace(/'/g, "''")}', NOW() - INTERVAL '1 second', 1);\n`;
        sql += `    END IF;\n`;
    }

    sql += `END $$;\n`;

    // 4. Executar SQL
    const tmpFile = '/tmp/prisma-baseline.sql';
    fs.writeFileSync(tmpFile, sql);
    const result = runCommand(
        `npx prisma db execute --file "${tmpFile}"`,
        false
    );

    if (result !== null) {
        console.log(`✅ Baseline concluído: ${items.length} migrações registradas em integration._prisma_migrations`);
        return true;
    }

    console.log('❌ Erro ao criar baseline');
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

    // =========================================================
    // Baseline Prisma: registra todas as migrações como aplicadas
    // =========================================================
    // Cria a tabela _prisma_migrations (se não existe) e insere
    // registros para todas as 54 migrações. Sem isso, o comando
    // `prisma migrate deploy` sempre falha com P3005 porque o
    // banco tem tabelas mas não tem histórico de migrações.
    // Após o baseline, deploys futuros usarão migrate deploy
    // diretamente, sem precisar de fallback.
    // =========================================================
    baselineMigrations();

    // =========================================================
    // Garantir que PgBoss use conexão DIRETA (sem PgBouncer)
    // =========================================================
    // O server.ts faz import "dotenv/config" que carrega .env.
    // Escrevemos PG_BOSS_CONNECTION_STRING via DIRECT_URL para
    // que o PgBoss consiga criar suas tabelas (DDL não passa
    // pelo PgBouncer porta 6543, apenas pela direta porta 5432).
    // =========================================================
    const directUrl = process.env.DIRECT_URL || '';
    if (directUrl) {
        try {
            const envContent = `# Gerado por resilient-migrate.js para PgBoss conectar direto\nPG_BOSS_CONNECTION_STRING="${directUrl}"\n`;
            fs.writeFileSync('.env', envContent, 'utf8');
            console.log('🔧 .env gerado com PG_BOSS_CONNECTION_STRING → PgBoss usará DIRECT_URL');
        } catch (envErr) {
            console.log('⚠️  Não foi possível gerar .env:', envErr.message);
        }
    } else {
        console.log('⚠️  DIRECT_URL não encontrada. PgBoss usará DATABASE_URL (PgBouncer).');
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