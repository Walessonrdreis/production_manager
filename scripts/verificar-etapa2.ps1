# Script de Verificação Automática - Pré-requisitos Etapa 2
# Execute: .\scripts\verificar-etapa2.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "VERIFICAÇÃO DE PRÉ-REQUISITOS - ETAPA 2" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# 1. Verificar diretório atual
Write-Host "[1/8] Verificando diretório atual..." -ForegroundColor Yellow
$currentDir = Get-Location
Write-Host "   Diretório: $currentDir" -ForegroundColor Gray

if ($currentDir -notlike "*production_manager*") {
    Write-Host "   ⚠️  ATENÇÃO: Você não está no diretório do projeto!" -ForegroundColor Red
    Write-Host "   Execute: cd c:\Users\walll\OneDrive\projects_git\production_manager" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar Node.js e pnpm
Write-Host "[2/8] Verificando Node.js e pnpm..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js não encontrado!" -ForegroundColor Red
    Write-Host "   Instale Node.js: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

try {
    $pnpmVersion = pnpm --version
    Write-Host "   ✅ pnpm: v$pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ pnpm não encontrado!" -ForegroundColor Red
    Write-Host "   Instale: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

# 3. Verificar arquivo .env
Write-Host "[3/8] Verificando variáveis de ambiente..." -ForegroundColor Yellow
$envFile = "apps\api\.env"
if (Test-Path $envFile) {
    Write-Host "   ✅ Arquivo .env encontrado" -ForegroundColor Green
    
    # Verificar variáveis críticas
    $envContent = Get-Content $envFile
    $requiredVars = @("OMIE_APP_KEY", "OMIE_APP_SECRET", "DATABASE_URL", "REDIS_URL")
    
    foreach ($var in $requiredVars) {
        $found = $envContent | Where-Object { $_ -match "^$var=" }
        if ($found) {
            Write-Host "   ✅ $var configurado" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $var NÃO configurado" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "   Crie o arquivo: apps\api\.env" -ForegroundColor Yellow
    exit 1
}

# 4. Verificar dependências
Write-Host "[4/8] Verificando dependências..." -ForegroundColor Yellow
$packageJson = "apps\api\package.json"
if (Test-Path $packageJson) {
    Write-Host "   ✅ package.json encontrado" -ForegroundColor Green
    
    # Verificar se node_modules existe
    $nodeModules = "apps\api\node_modules"
    if (Test-Path $nodeModules) {
        Write-Host "   ✅ node_modules encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  node_modules não encontrado" -ForegroundColor Yellow
        Write-Host "   Execute: cd apps\api && pnpm install" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ package.json não encontrado!" -ForegroundColor Red
    exit 1
}

# 5. Verificar Prisma
Write-Host "[5/8] Verificando Prisma e banco de dados..." -ForegroundColor Yellow
try {
    # Verificar status das migrações
    Push-Location "apps\api"
    $migrationStatus = npx prisma migrate status 2>&1
    Pop-Location
    
    if ($migrationStatus -match "Database schema is up to date") {
        Write-Host "   ✅ Migrações Prisma atualizadas" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Migrações Prisma pendentes" -ForegroundColor Yellow
        Write-Host "   Execute: cd apps\api && npx prisma migrate deploy" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao verificar Prisma: $_" -ForegroundColor Red
}

# 6. Verificar Redis
Write-Host "[6/8] Verificando conexão Redis..." -ForegroundColor Yellow
try {
    # Tentar conectar ao Redis
    $redisUrl = Get-Content $envFile | Where-Object { $_ -match "^REDIS_URL=" }
    if ($redisUrl) {
        $redisUrl = $redisUrl -replace "^REDIS_URL=", ""
        Write-Host "   ✅ REDIS_URL configurado: $($redisUrl.Substring(0, [Math]::Min(30, $redisUrl.Length)))..." -ForegroundColor Green
        
        # Testar conexão básica (requer módulo Redis)
        Write-Host "   ℹ️  Teste manual: redis-cli ping" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️  REDIS_URL não configurado" -ForegroundColor Yellow
        Write-Host "   Configure no .env: REDIS_URL=redis://localhost:6379" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Não foi possível verificar Redis: $_" -ForegroundColor Yellow
}

# 7. Verificar estrutura de diretórios
Write-Host "[7/8] Verificando estrutura do projeto..." -ForegroundColor Yellow
$requiredDirs = @(
    "apps\api\src\modules",
    "apps\api\src\shared",
    "apps\api\src\infra",
    ".trae\rules",
    "docs"
)

$allDirsExist = $true
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "   ✅ $dir" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $dir não encontrado" -ForegroundColor Red
        $allDirsExist = $false
    }
}

if (-not $allDirsExist) {
    Write-Host "   ⚠️  Alguns diretórios estão faltando" -ForegroundColor Yellow
}

# 8. Verificar documentação da Etapa 2
Write-Host "[8/8] Verificando documentação da Etapa 2..." -ForegroundColor Yellow
$requiredDocs = @(
    "docs\ETAPA_2_PRODUCAO.md",
    "docs\ENDPOINTS_OMPLETE_LISTA.md",
    "docs\ANALISE_ENDPOINTS_CRITICOS.md",
    "docs\SISTEMA_MONITORAMENTO_ESTOQUE.md",
    "docs\DASHBOARD_PRODUCAO_TEMPO_REAL.md",
    "docs\RESUMO_ETAPA_2_PRODUCAO.md",
    "docs\COMPATIBILIDADE_API_ATUAL.md"
)

$docsFound = 0
foreach ($doc in $requiredDocs) {
    if (Test-Path $doc) {
        $docsFound++
        Write-Host "   ✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $doc não encontrado" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "RESUMO DA VERIFICAÇÃO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Resumo
$checks = @(
    @{Name="Diretório correto"; Passed=$currentDir -like "*production_manager*"},
    @{Name="Node.js instalado"; Passed=$nodeVersion -ne $null},
    @{Name="pnpm instalado"; Passed=$pnpmVersion -ne $null},
    @{Name="Arquivo .env"; Passed=(Test-Path $envFile)},
    @{Name="package.json"; Passed=(Test-Path $packageJson)},
    @{Name="Estrutura básica"; Passed=$allDirsExist},
    @{Name="Documentação"; Passed=($docsFound -ge 5)}
)

$passed = 0
$total = $checks.Count

foreach ($check in $checks) {
    if ($check.Passed) {
        Write-Host "   ✅ $($check.Name)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ❌ $($check.Name)" -ForegroundColor Red
    }
}

Write-Host ""
$percentage = [math]::Round(($passed / $total) * 100)

if ($percentage -ge 90) {
    Write-Host "🎉 STATUS: PRONTO PARA ETAPA 2 ($percentage%)" -ForegroundColor Green
    Write-Host "   Você pode iniciar as fases de implementação!" -ForegroundColor Green
} elseif ($percentage -ge 70) {
    Write-Host "⚠️  STATUS: QUASE PRONTO ($percentage%)" -ForegroundColor Yellow
    Write-Host "   Corrija os itens em vermelho antes de começar" -ForegroundColor Yellow
} else {
    Write-Host "❌ STATUS: NÃO PRONTO ($percentage%)" -ForegroundColor Red
    Write-Host "   Corrija os problemas listados acima" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "PRÓXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

if ($percentage -ge 90) {
    Write-Host "1. Inicie a API: cd apps\api && pnpm dev" -ForegroundColor Green
    Write-Host "2. Teste endpoints: curl http://localhost:3333/v1/products" -ForegroundColor Green
    Write-Host "3. Quando estiver funcionando, avise para iniciarmos a Fase 1!" -ForegroundColor Green
} else {
    Write-Host "1. Corrija os itens marcados com ❌" -ForegroundColor Yellow
    Write-Host "2. Execute este script novamente após as correções" -ForegroundColor Yellow
    Write-Host "3. Consulte a documentação em docs\ para referências" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Documentação disponível:" -ForegroundColor Gray
Write-Host "   - docs\ETAPA_2_PRODUCAO.md (plano principal)" -ForegroundColor Gray
Write-Host "   - docs\COMPATIBILIDADE_API_ATUAL.md (uso por múltiplas apps)" -ForegroundColor Gray
Write-Host "   - .trae\rules\ (regras de desenvolvimento)" -ForegroundColor Gray

# Testes manuais recomendados
Write-Host ""
Write-Host "🔧 Testes manuais recomendados:" -ForegroundColor Gray
Write-Host "   1. cd apps\api && pnpm test" -ForegroundColor Gray
Write-Host "   2. cd apps\api && pnpm lint" -ForegroundColor Gray
Write-Host "   3. cd apps\api && pnpm dev (verifique logs)" -ForegroundColor Gray

exit 0