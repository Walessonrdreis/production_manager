#!/usr/bin/env node

/**
 * Script para executar migrações no banco local
 * Usa DATABASE_URL para localhost em vez do .env
 */

const { execSync } = require('child_process');
const path = require('path');

// Configuração do banco local
const localDbUrl = 'postgresql://postgres:postgres@localhost:5432/production_manager?schema=public';

console.log('🚀 Executando migrações no banco local...');
console.log(`📊 Database URL: ${localDbUrl}`);

try {
  // Executar prisma migrate dev com a URL local
  const command = `npx prisma migrate dev --schema=prisma/schema.prisma`;
  
  // Definir a variável de ambiente
  const env = {
    ...process.env,
    DATABASE_URL: localDbUrl,
    DIRECT_URL: localDbUrl
  };
  
  console.log('📦 Executando migrações...');
  execSync(command, {
    env,
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Migrações aplicadas com sucesso no banco local!');
  
} catch (error) {
  console.error('❌ Erro ao executar migrações:', error.message);
  process.exit(1);
}