# Script para corrigir todos os erros de logger de uma vez

Write-Host "Corrigindo todos os erros de logger..." -ForegroundColor Green

# 1. Corrigir chamadas de logger.debug sem verificação
function Fix-DebugCalls {
    param([string]$content)
    
    # Padrão: logger.debug("mensagem", { objeto })
    # Precisamos adicionar verificação: if (logger.debug) { ... }
    
    $patterns = @(
        # logger.debug("mensagem", { objeto })
        '(logger\.debug\("([^"]+)",\s*\{([^}]+)\}\))',
        # this.logger.debug("mensagem", { objeto })
        '(this\.logger\.debug\("([^"]+)",\s*\{([^}]+)\}\))',
        # app.log.debug("mensagem", { objeto })
        '(app\.log\.debug\("([^"]+)",\s*\{([^}]+)\}\))'
    )
    
    foreach ($pattern in $patterns) {
        $content = $content -replace $pattern, 'if ($1) { $1 }'
    }
    
    return $content
}

# 2. Corrigir chamadas de logger.error com objeto primeiro
function Fix-ErrorCalls {
    param([string]$content)
    
    # Padrão: app.log.error("mensagem", { error: error })
    # Fastify espera: app.log.error({ error }, "mensagem")
    
    $content = $content -replace 'app\.log\.error\("([^"]+)",\s*\{\s*error:\s*([^}]+)\s*\}\)', 'app.log.error({ error: $2 }, "$1")'
    
    return $content
}

# 3. Corrigir chamadas de logger.info com objeto vazio
function Fix-EmptyObjectCalls {
    param([string]$content)
    
    # Padrão: logger.info({}, "mensagem")
    # Deve ser: logger.info("mensagem")
    
    $content = $content -replace 'logger\.info\(\{\},\s*"([^"]+)"\)', 'logger.info("$1")'
    $content = $content -replace 'this\.logger\.info\(\{\},\s*"([^"]+)"\)', 'this.logger.info("$1")'
    
    return $content
}

# Lista de arquivos para corrigir
$files = @(
    "src/modules/sync/application/use-cases/sync-stock.usecase.ts",
    "src/modules/sync/application/use-cases/sync-orders.usecase.ts",
    "src/modules/sync/application/use-cases/get-sync-status.usecase.ts",
    "src/modules/sync/infrastructure/integrations/omie.gateway.ts",
    "src/shared/services/IntelligentPollingService.ts",
    "src/shared/services/RetrySystem.ts",
    "src/modules/alerts/presentation/http/stock-alerts.controller.ts",
    "src/modules/production-queue/presentation/http/production-queue.controller.ts",
    "src/modules/sales-production-integration/presentation/http/sales-production-integration.controller.ts"
)

foreach ($file in $files) {
    $fullPath = Join-Path (Get-Location) $file
    if (Test-Path $fullPath) {
        Write-Host "Corrigindo $file..." -ForegroundColor Yellow
        
        $content = Get-Content $fullPath -Raw
        
        # Aplicar todas as correções
        $content = Fix-DebugCalls -content $content
        $content = Fix-ErrorCalls -content $content
        $content = Fix-EmptyObjectCalls -content $content
        
        # Salvar conteúdo corrigido
        Set-Content -Path $fullPath -Value $content -NoNewline
        
        Write-Host "  $file corrigido" -ForegroundColor Green
    }
}

Write-Host "`nCorreções aplicadas. Testando build..." -ForegroundColor Green

# Testar build
npx tsc --noEmit

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBuild bem-sucedido! Todos os erros foram corrigidos." -ForegroundColor Green
} else {
    Write-Host "`nAinda há erros na build. Execute novamente o script ou corrija manualmente." -ForegroundColor Red
}