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
    console.log('🚀 Script de migração para Render');
    console.log('='.repeat(50));

    // =========================================================
    // 1. Baseline: garante _prisma_migrations existe
    //    Se não existe, cria com todas as migrações como aplicadas
    //    Se já existe (deploys subsequentes), retorna imediatamente
    // =========================================================
    baselineMigrations();

    // =========================================================
    // 2. db push: sincroniza schema Prisma com o banco
    //    Sem --accept-data-loss → NUNCA dropa tabelas não-Prisma
    //    (PgBoss, etc.). Cria apenas tabelas faltantes.
    // =========================================================
    console.log('\n📦 Sincronizando schema com prisma db push...');
    execSync('npx prisma db push', {
        encoding: 'utf8',
        stdio: 'inherit',
        timeout: 120000
    });
    console.log('✅ prisma db push concluído com sucesso!');

    // =========================================================
    // 3. Garantir que PgBoss use conexão DIRETA (sem PgBouncer)
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
    console.log('✨ Processo concluído!');
}

// Executar
if (require.main === module) {
    main();
}