#!/usr/bin/env node

/**
 * Migração de banco para produção (Render)
 *
 * ⚠️  NUNCA usa db push --force-reset. Apenas migrate deploy (seguro).
 *      migrate deploy é idempotente — só aplica migrations pendentes.
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

function setupPgBoss() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) return;
  fs.writeFileSync('.env', `PG_BOSS_CONNECTION_STRING="${directUrl}"\n`);
  console.log('🔧 PG_BOSS_CONNECTION_STRING configurado');
}

// ─── Main ──────────────────────────────────────────────────────────────

console.log('='.repeat(50));
console.log('🚀  Migração de banco (produção)');
console.log('='.repeat(50));

if (!run('npx prisma migrate deploy')) {
  console.error('\n❌  migrate deploy falhou.');
  console.error('    Rode manualmente no terminal do Render:');
  console.error('    npx prisma migrate deploy');
  process.exit(1);
}

setupPgBoss();
console.log('\n✅  Migração concluída!');