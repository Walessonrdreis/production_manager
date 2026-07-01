#!/usr/bin/env node

/**
 * Migração de banco segura para produção (Render)
 *
 * - Cria schemas e tabela de controle se for banco novo
 * - Depois aplica apenas migrations pendentes (idempotente)
 * - NUNCA usa db push --force-reset
 */

const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 120000 });
    return true;
  } catch {
    return false;
  }
}

function sql(statement) {
  const tmp = '/tmp/prisma-setup.sql';
  fs.writeFileSync(tmp, statement);
  return run(`npx prisma db execute --file "${tmp}"`);
}

// ─── Main ──────────────────────────────────────────────────────────────

console.log('='.repeat(50));
console.log('🚀  Migração de banco (produção)');
console.log('='.repeat(50));

// Garante schemas e tabela de controle (banco novo ou resetado)
sql(`CREATE SCHEMA IF NOT EXISTS integration;`);
sql(`CREATE SCHEMA IF NOT EXISTS read_model;`);

// Garante que o search_path inclua o schema integration
// Necessário para Prisma multiSchema encontrar _prisma_migrations
sql(`ALTER ROLE CURRENT_USER SET search_path TO integration, read_model, public;`);

// Tabela de controle de migrations (Prisma multiSchema exige)
sql(`CREATE TABLE IF NOT EXISTS integration._prisma_migrations (
  "id" TEXT PRIMARY KEY,
  "checksum" TEXT NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" TEXT NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);`);

// Reconecta para pegar o novo search_path e aplica migrations
if (!run('npx prisma migrate deploy')) {
  console.error('\n❌  migrate deploy falhou.');
  process.exit(1);
}

// Configura PgBoss se DIRECT_URL estiver disponível
const directUrl = process.env.DIRECT_URL;
if (directUrl) {
  fs.writeFileSync('.env', `PG_BOSS_CONNECTION_STRING="${directUrl}"\n`);
  console.log('🔧 PG_BOSS_CONNECTION_STRING configurado');
}

console.log('\n✅  Migração concluída!');