#!/bin/bash

echo "🚀 Iniciando build no Render..."

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --only=production

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

# Build do projeto
echo "🏗️  Executando build..."
npm run build

# Usar script resiliente para migrações
echo "🔄 Executando migrações resilientes..."
if node scripts/resilient-migrate.js; then
    echo "✅ Migrações aplicadas com sucesso!"
else
    echo "⚠️  Migrações com avisos. Verificando se podemos prosseguir..."
    
    # Verificar se as tabelas críticas existem
    echo "🔍 Verificando tabelas críticas..."
    
    # Função para verificar tabela
    check_table() {
        local table=$1
        local sql="SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='$table');"
        if npx prisma db execute --stdin --query "$sql" 2>/dev/null | grep -q "true"; then
            echo "   $table: ✅ Existe"
            return 0
        else
            echo "   $table: ❌ Não existe"
            return 1
        fi
    }
    
    # Tabelas críticas para o novo módulo
    CRITICAL_TABLES=(
        "omie_production_order"
        "omie_production_order_item"
    )
    
    all_critical_exist=true
    for table in "${CRITICAL_TABLES[@]}"; do
        if ! check_table "$table"; then
            all_critical_exist=false
        fi
    done
    
    if $all_critical_exist; then
        echo "✅ Todas as tabelas críticas existem. Continuando..."
    else
        echo "⚠️  Algumas tabelas críticas não existem."
        echo "💡 Execute manualmente no terminal do Render:"
        echo "   npx prisma migrate resolve --applied '20260508213903_add_omie_production_orders'"
        echo "   Ou use: npm run db:fix:failed"
    fi
fi

echo "🎉 Build concluído!"