#!/usr/bin/env node

/**
 * Script resiliente para migrações no Render (v2)
 *
 * Estratégia:
 *   1º deploy  → db push --force-reset (cria schema do zero) + baseline
 *   Deploys seguintes → migrate deploy (apenas migrations pendentes)
 *                        Se schema estiver inconsistente, aplica SQL manualmente
 */

const { execSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

console.log('🔄 Iniciando migração resiliente (v2)...');

// ======================================================================
// Utilitários
// ======================================================================

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

function runCommandInherit(cmd, ignoreErrors = false) {
    try {
        return execSync(cmd, { encoding: 'utf8', stdio: 'inherit', timeout: 120000 });
    } catch (error) {
        if (!ignoreErrors) {
            console.log(`❌ Erro no comando: ${cmd}`);
            console.log(`   Mensagem: ${error.message}`);
        }
        return null;
    }
}

function executeSqlFile(filePath) {
    const result = runCommand(`npx prisma db execute --file "${filePath}"`, true);
    if (result === null) {
        console.log(`   ❌ Falha ao executar: ${filePath}`);
        return false;
    }
    return true;
}

function queryDatabase(sql) {
    const tmpFile = '/tmp/prisma-query.sql';
    fs.writeFileSync(tmpFile, sql);
    return runCommand(`npx prisma db execute --file "${tmpFile}"`, true);
}

// ======================================================================
// Funções — deploy inicial
// ======================================================================

function prismaMigrationsExists() {
    const sql = `
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'integration' AND table_name = '_prisma_migrations'
        );
    `;
    const result = queryDatabase(sql);
    return result !== null && /\bt\b/.test(result);
}

function forceResetDatabase() {
    console.log('\n💥 Resetando banco para sync com schema Prisma...');
    console.log('   (apenas 1º deploy — banco sem dados críticos)');
    const result = runCommandInherit(
        'npx prisma db push --force-reset --accept-data-loss',
        false
    );
    if (result !== null) {
        console.log('✅ Banco resetado e schema sincronizado!');
        return true;
    }
    console.log('❌ Falha ao resetar banco');
    return false;
}

// ======================================================================
// Funções — baseline
// ======================================================================

function listMigrations() {
    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
    return fs
        .readdirSync(migrationsDir)
        .filter((f) => {
            if (f === 'migration_lock.toml') return false;
            return fs.statSync(path.join(migrationsDir, f)).isDirectory();
        })
        .sort();
}

function calculateChecksum(migrationDir) {
    const migFiles = fs
        .readdirSync(migrationDir)
        .filter((f) => f !== '.' && f !== '..')
        .sort();
    const hash = crypto.createHash('sha256');
    for (const file of migFiles) {
        const content = fs.readFileSync(path.join(migrationDir, file));
        hash.update(Buffer.from(file, 'utf8'));
        hash.update(Buffer.from([0]));
        hash.update(content);
        hash.update(Buffer.from([0]));
    }
    return hash.digest('hex');
}

function baselineMigrations() {
    console.log('\n🔍 Verificando baseline do Prisma...');
    if (prismaMigrationsExists()) {
        console.log('✅ _prisma_migrations já existe. Baseline não necessário.');
        return true;
    }

    const items = listMigrations();
    if (items.length === 0) return false;

    console.log(`📋 Registrando ${items.length} migrações como aplicadas...`);

    let sql = `
CREATE TABLE IF NOT EXISTS integration._prisma_migrations (
    "id" TEXT PRIMARY KEY, "checksum" TEXT NOT NULL,
    "finished_at" TIMESTAMPTZ, "migration_name" TEXT NOT NULL,
    "logs" TEXT, "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);`;
    sql += `DO $$ BEGIN\n`;
    for (const migration of items) {
        const migDir = path.join(__dirname, '..', 'prisma', 'migrations', migration);
        const checksum = calculateChecksum(migDir);
        const id = crypto.randomUUID();
        const sf = migration.replace(/'/g, "''");
        sql += `IF NOT EXISTS (SELECT 1 FROM integration._prisma_migrations WHERE migration_name='${sf}') THEN
            INSERT INTO integration._prisma_migrations (id,checksum,finished_at,migration_name,started_at,applied_steps_count)
            VALUES ('${id}','${checksum}',NOW(),'${sf}',NOW()-INTERVAL'1 second',1); END IF;\n`;
    }
    sql += `END $$;\n`;

    fs.writeFileSync('/tmp/prisma-baseline.sql', sql);
    const ok = runCommand(`npx prisma db execute --file /tmp/prisma-baseline.sql`, false);
    if (ok) console.log(`✅ Baseline concluído: ${items.length} migrações`);
    return ok !== null;
}

// ======================================================================
// Funções — schema consistency
// ======================================================================

function schemaIsConsistent() {
    const sql = `SELECT EXISTS (SELECT FROM information_schema.columns
        WHERE table_schema='integration' AND table_name='omie_production_order' AND column_name='omie_id');`;
    const result = queryDatabase(sql);
    const ok = result !== null && /\bt\b/.test(result);
    console.log(`   Coluna omie_id: ${ok ? '✅ existe' : '❌ ausente'}`);
    return ok;
}

function applyStaleMigrations() {
    const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
    const pivot = '20260626000000_add_product_omie_id_fields';
    const allMigrations = listMigrations();
    const pivotIndex = allMigrations.indexOf(pivot);
    if (pivotIndex === -1) { console.log('⚠️  Migration pivot não encontrada.'); return false; }

    const stale = allMigrations.slice(pivotIndex);
    console.log(`\n🔧 Aplicando ${stale.length} migrations pendentes manualmente...`);

    for (const migration of stale) {
        const sqlFile = path.join(migrationsDir, migration, 'migration.sql');
        if (!fs.existsSync(sqlFile)) continue;
        console.log(`   ▶️  ${migration}...`);
        if (!executeSqlFile(sqlFile)) return false;

        const checksum = calculateChecksum(path.join(migrationsDir, migration));
        const id = crypto.randomUUID();
        const sf = migration.replace(/'/g, "''");
        const regSql = `INSERT INTO integration._prisma_migrations (id,checksum,finished_at,migration_name,started_at,applied_steps_count)
            VALUES ('${id}','${checksum}',NOW(),'${sf}',NOW()-INTERVAL'1 second',1)
            ON CONFLICT (migration_name) DO UPDATE SET finished_at=NOW(), checksum=EXCLUDED.checksum, applied_steps_count=1;`;
        fs.writeFileSync('/tmp/prisma-resolve.sql', regSql);
        runCommand(`npx prisma db execute --file /tmp/prisma-resolve.sql`, true);
        console.log(`   ✅ ${migration} — aplicada e registrada`);
    }
    return true;
}

function runMigrateDeploy() {
    console.log('\n📦 Executando prisma migrate deploy...');
    const result = runCommandInherit('npx prisma migrate deploy', true);
    if (result === null) {
        console.log('⚠️  migrate deploy encontrou problemas.');
        return false;
    }
    console.log('✅ prisma migrate deploy concluído com sucesso!');
    return true;
}

// ======================================================================
// PgBoss setup
// ======================================================================

function setupPgBossDirectUrl() {
    const directUrl = process.env.DIRECT_URL || '';
    if (directUrl) {
        fs.writeFileSync('.env',
            `# Gerado por resilient-migrate.js\nPG_BOSS_CONNECTION_STRING="${directUrl}"\n`, 'utf8');
        console.log('🔧 .env com PG_BOSS_CONNECTION_STRING');
    } else {
        console.log('⚠️  DIRECT_URL não encontrada');
    }
}

// ======================================================================
// Main
// ======================================================================

function main() {
    console.log('🚀 Script de migração para Render (v2)');
    console.log('='.repeat(50));

    const isFirstDeploy = !prismaMigrationsExists();

    if (isFirstDeploy) {
        console.log('\n🆕 Primeiro deploy — resetando banco...');
        if (!forceResetDatabase()) process.exit(1);
        baselineMigrations();
    } else {
        if (!schemaIsConsistent()) {
            console.log('⚠️  Schema inconsistente — aplicando SQL manualmente...');
            if (!applyStaleMigrations()) {
                console.log('❌ Falha na aplicação manual. Abortando.');
                process.exit(1);
            }
        } else {
            console.log('✅ Schema consistente.');
        }
        runMigrateDeploy();
    }

    setupPgBossDirectUrl();
    console.log('\n🎯 Processo concluído!');
}

if (require.main === module) main();