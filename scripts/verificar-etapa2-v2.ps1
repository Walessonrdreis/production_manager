# Script de Verificação Automática - Pré-requisitos Etapa 2
# Execute: .\scripts\verificar-etapa2-v2.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "VERIFICACAO DE PRE-REQUISITOS - ETAPA 2" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# 1. Verificar diretório atual
Write-Host "[1/8] Verificando diretorio atual..." -ForegroundColor Yellow
$currentDir = Get-Location
Write-Host "   Diretorio: $currentDir" -ForegroundColor Gray

if ($currentDir -notlike "*production_manager*") {
    Write-Host "   ATENCAO: Voce nao esta no diretorio do projeto!" -ForegroundColor Red
    Write-Host "   Execute: cd c:\Users\walll\OneDrive\projects_git\production_manager" -ForegroundColor Yellow
    exit 1
}

# 2. Verificar Node.js e pnpm
Write-Host "[2/8] Verificando Node.js e pnpm..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   OK Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERRO Node.js nao encontrado!" -ForegroundColor Red
    Write-Host "   Instale Node.js: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

try {
    $pnpmVersion = pnpm --version
    Write-Host "   OK pnpm: v$pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERRO pnpm nao encontrado!" -ForegroundColor Red
    Write-Host "   Instale: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

# 3. Verificar arquivo .env
Write-Host "[3/8] Verificando variaveis de ambiente..." -ForegroundColor Yellow
$envFile = "apps\api\.env"
if (Test-Path $envFile) {
    Write-Host "   OK Arquivo .env encontrado" -ForegroundColor Green
    
    # Verificar variaveis criticas
    $envContent = Get-Content $envFile
    $requiredVars = @("OMIE_APP_KEY", "OMIE_APP_SECRET", "DATABASE_URL", "REDIS_URL")
    
    foreach ($var in $requiredVars) {
        $found = $envContent | Where-Object { $_ -match "^$var=" }
        if ($found) {
            Write-Host "   OK $var configurado" -ForegroundColor Green
        } else {
            Write-Host "   ATENCAO $var NAO configurado" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ERRO Arquivo .env nao encontrado!" -ForegroundColor Red
    Write-Host "   Crie o arquivo: apps\api\.env" -ForegroundColor Yellow
    exit 1
}

# 4. Verificar dependencias
Write-Host "[4/8] Verificando dependencias..." -ForegroundColor Yellow
$packageJson = "apps\api\package.json"
if (Test-Path $packageJson) {
    Write-Host "   OK package.json encontrado" -ForegroundColor Green
    
    # Verificar se node_modules existe
    $nodeModules = "apps\api\node_modules"
    if (Test-Path $nodeModules) {
        Write-Host "   OK node_modules encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ATENCAO node_modules nao encontrado" -ForegroundColor Yellow
        Write-Host "   Execute: cd apps\api && pnpm install" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ERRO package.json nao encontrado!" -ForegroundColor Red
    exit 1
}

# 5. Verificar Prisma
Write-Host "[5/8] Verificando Prisma e banco de dados..." -ForegroundColor Yellow
try {
    # Verificar status das migracoes
    Push-Location "apps\api"
    $migrationStatus = npx prisma migrate status 2>&1
    Pop-Location
    
    if ($migrationStatus -match "Database schema is up to date") {
        Write-Host "   OK Migracoes Prisma atualizadas" -ForegroundColor Green
    } else {
        Write-Host "   ATENCAO Migracoes Prisma pendentes" -ForegroundColor Yellow
        Write-Host "   Execute: cd apps\api && npx prisma migrate deploy" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ERRO ao verificar Prisma: $_" -ForegroundColor Red
}

# 6. Verificar Redis
Write-Host "[6/8] Verificando conexao Redis..." -ForegroundColor Yellow
try {
    # Tentar conectar ao Redis
    $redisUrl = Get-Content $envFile | Where-Object { $_ -match "^REDIS_URL=" }
    if ($redisUrl) {
        $redisUrl = $redisUrl -replace "^REDIS_URL=", ""
        $displayUrl = if ($redisUrl.Length -gt 30) { $redisUrl.Substring(0, 30) + "..." } else { $redisUrl }
        Write-Host "   OK REDIS_URL configurado: $displayUrl" -ForegroundColor Green
        
        # Testar conexao basica (requer modulo Redis)
        Write-Host "   INFO Teste manual: redis-cli ping" -ForegroundColor Gray
    } else {
        Write-Host "   ATENCAO REDIS_URL nao configurado" -ForegroundColor Yellow
        Write-Host "   Configure no .env: REDIS_URL=redis://localhost:6379" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ATENCAO Nao foi possivel verificar Redis: $_" -ForegroundColor Yellow
}

# 7. Verificar estrutura de diretorios
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
        Write-Host "   OK $dir" -ForegroundColor Green
    } else {
        Write-Host "   ERRO $dir nao encontrado" -ForegroundColor Red
        $allDirsExist = $false
    }
}

if (-not $allDirsExist) {
    Write-Host "   ATENCAO Alguns diretorios estao faltando" -ForegroundColor Yellow
}

# 8. Verificar documentacao da Etapa 2
Write-Host "[8/8] Verificando documentacao da Etapa 2..." -ForegroundColor Yellow
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
        Write-Host "   OK $doc" -ForegroundColor Green
    } else {
        Write-Host "   ATENCAO $doc nao encontrado" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "RESUMO DA VERIFICACAO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Resumo
$checks = @(
    @{Name="Diretorio correto"; Passed=$currentDir -like "*production_manager*"},
    @{Name="Node.js instalado"; Passed=$nodeVersion -ne $null},
    @{Name="pnpm instalado"; Passed=$pnpmVersion -ne $null},
    @{Name="Arquivo .env"; Passed=(Test-Path $envFile)},
    @{Name="package.json"; Passed=(Test-Path $packageJson)},
    @{Name="Estrutura basica"; Passed=$allDirsExist},
    @{Name="Documentacao"; Passed=($docsFound -ge 5)}
)

$passed = 0
$total = $checks.Count

foreach ($check in $checks) {
    if ($check.Passed) {
        Write-Host "   OK $($check.Name)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   ERRO $($check.Name)" -ForegroundColor Red
    }
}

Write-Host ""
$percentage = [math]::Round(($passed / $total) * 100)

if ($percentage -ge 90) {
    Write-Host "STATUS: PRONTO PARA ETAPA 2 ($percentage%)" -ForegroundColor Green
    Write-Host "   Voce pode iniciar as fases de implementacao!" -ForegroundColor Green
} elseif ($percentage -ge 70) {
    Write-Host "STATUS: QUASE PRONTO ($percentage%)" -ForegroundColor Yellow
    Write-Host "   Corrija os itens em vermelho antes de comecar" -ForegroundColor Yellow
} else {
    Write-Host "STATUS: NAO PRONTO ($percentage%)" -ForegroundColor Red
    Write-Host "   Corrija os problemas listados acima" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "PROXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

if ($percentage -ge 90) {
    Write-Host "1. Inicie a API: cd apps\api && pnpm dev" -ForegroundColor Green
    Write-Host "2. Teste endpoints: curl http://localhost:3333/v1/products" -ForegroundColor Green
    Write-Host "3. Quando estiver funcionando, avise para iniciarmos a Fase 1!" -ForegroundColor Green
} else {
    Write-Host "1. Corrija os itens marcados com ERRO" -ForegroundColor Yellow
    Write-Host "2. Execute este script novamente apos as correcoes" -ForegroundColor Yellow
    Write-Host "3. Consulte a documentacao em docs\ para referencias" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Documentacao disponivel:" -ForegroundColor Gray
Write-Host "   - docs\ETAPA_2_PRODUCAO.md (plano principal)" -ForegroundColor Gray
Write-Host "   - docs\COMPATIBILIDADE_API_ATUAL.md (uso por multiplas apps)" -ForegroundColor Gray
Write-Host "   - .trae\rules\ (regras de desenvolvimento)" -ForegroundColor Gray

# Testes manuais recomendados
Write-Host ""
Write-Host "Testes manuais recomendados:" -ForegroundColor Gray
Write-Host "   1. cd apps\api && pnpm test" -ForegroundColor Gray
Write-Host "   2. cd apps\api && pnpm lint" -ForegroundColor Gray
Write-Host "   3. cd apps\api && pnpm dev (verifique logs)" -ForegroundColor Gray

exit 0