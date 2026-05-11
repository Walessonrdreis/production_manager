# Script para corrigir erros de logger no código
# Corrige chamadas de logger que estão passando objeto primeiro em vez de string

Write-Host "Corrigindo erros de logger..." -ForegroundColor Green

# Lista de arquivos com erros de logger (baseado no output do TypeScript)
$filesToFix = @(
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

foreach ($file in $filesToFix) {
    $fullPath = Join-Path (Get-Location) $file
    if (Test-Path $fullPath) {
        Write-Host "Corrigindo $file..." -ForegroundColor Yellow
        
        # Ler conteúdo do arquivo
        $content = Get-Content $fullPath -Raw
        
        # Padrões para corrigir:
        # 1. logger.info({ objeto }, "mensagem") -> logger.info("mensagem", { objeto })
        # 2. logger.warn({ objeto }, "mensagem") -> logger.warn("mensagem", { objeto })
        # 3. logger.error({ objeto }, "mensagem") -> logger.error("mensagem", { objeto })
        # 4. logger.debug({ objeto }, "mensagem") -> logger.debug("mensagem", { objeto })
        
        # Corrigir logger.info
        $content = $content -replace 'logger\.info\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'logger.info("$2", $1)'
        $content = $content -replace 'this\.logger\.info\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'this.logger.info("$2", $1)'
        $content = $content -replace 'app\.log\.info\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'app.log.info("$2", $1)'
        
        # Corrigir logger.warn
        $content = $content -replace 'logger\.warn\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'logger.warn("$2", $1)'
        $content = $content -replace 'this\.logger\.warn\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'this.logger.warn("$2", $1)'
        $content = $content -replace 'app\.log\.warn\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'app.log.warn("$2", $1)'
        
        # Corrigir logger.error
        $content = $content -replace 'logger\.error\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'logger.error("$2", $1)'
        $content = $content -replace 'this\.logger\.error\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'this.logger.error("$2", $1)'
        $content = $content -replace 'app\.log\.error\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'app.log.error("$2", $1)'
        
        # Corrigir logger.debug
        $content = $content -replace 'logger\.debug\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'logger.debug("$2", $1)'
        $content = $content -replace 'this\.logger\.debug\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'this.logger.debug("$2", $1)'
        $content = $content -replace 'app\.log\.debug\(\s*({[^}]+})\s*,\s*"([^"]+)"\s*\)', 'app.log.debug("$2", $1)'
        
        # Salvar conteúdo corrigido
        Set-Content -Path $fullPath -Value $content -NoNewline
        
        Write-Host "  $file corrigido" -ForegroundColor Green
    } else {
        Write-Host "  Arquivo não encontrado: $file" -ForegroundColor Red
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