# Script de Inicialização - Monitoramento Específico Etapa 2
# Foco absoluto em endpoints de produção/chão de fábrica

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   🏭 MONITORAMENTO ETAPA 2 - PRODUÇÃO  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se API está rodando
Write-Host "[1] Verificando se API está rodando..." -ForegroundColor Yellow

$apiRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3333/health" -Method GET -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        $healthData = $response.Content | ConvertFrom-Json
        if ($healthData.ok -eq $true) {
            Write-Host "   ✅ API está rodando e saudável" -ForegroundColor Green
            $apiRunning = $true
        } else {
            Write-Host "   ⚠️  API responde mas ok=false" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   ❌ API NÃO está rodando em http://localhost:3333" -ForegroundColor Red
}

if (-not $apiRunning) {
    Write-Host ""
    Write-Host "   ⚠️  ATENÇÃO: API precisa estar rodando para Etapa 2" -ForegroundColor Yellow
    Write-Host "   Execute primeiro: cd apps\api && pnpm dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Deseja iniciar a API agora? (S/N)" -ForegroundColor Gray
    $choice = Read-Host
    
    if ($choice -eq "S" -or $choice -eq "s") {
        Write-Host "   Iniciando API em novo terminal..." -ForegroundColor Gray
        
        # Comando para iniciar API
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\walll\OneDrive\projects_git\production_manager\apps\api'; pnpm dev"
        
        Write-Host "   ⏳ Aguarde 15 segundos para API iniciar..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
        
        # Verificar novamente
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3333/health" -Method GET -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "   ✅ API iniciada com sucesso!" -ForegroundColor Green
                $apiRunning = $true
            } else {
                Write-Host "   ❌ API ainda não está respondendo" -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "   ❌ Falha ao iniciar API" -ForegroundColor Red
            exit 1
        }
    } else {
        exit 1
    }
}

# Teste rápido dos endpoints CRÍTICOS para Etapa 2
Write-Host ""
Write-Host "[2] Testando endpoints CRÍTICOS da Etapa 2..." -ForegroundColor Magenta

$criticalEndpoints = @(
    @{Name="Health Check"; Path="/health"; Category="System"},
    @{Name="Estoque Produtos Omie"; Path="/v1/admin/omie/products/stock?page=1&pageSize=5"; Category="Estoque"},
    @{Name="Pedidos Stage 20"; Path="/v1/admin/orders/stage20?page=1&pageSize=5"; Category="Pedidos"},
    @{Name="Ordens Produção Omie"; Path="/v1/admin/omie/production-orders?page=1&pageSize=5"; Category="Producao"},
    @{Name="Catálogo Público"; Path="/v1/products?page=1&pageSize=5"; Category="Catalogo"}
)

$results = @()
$criticalFailures = @()

foreach ($endpoint in $criticalEndpoints) {
    Write-Host "   Testando: $($endpoint.Name) ($($endpoint.Category))..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3333$($endpoint.Path)" -Method GET -TimeoutSec 5
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ OK" -ForegroundColor Green
            $results += @{Name=$endpoint.Name; Category=$endpoint.Category; Status="OK"}
        } else {
            Write-Host " ⚠️ Status: $($response.StatusCode)" -ForegroundColor Yellow
            $results += @{Name=$endpoint.Name; Category=$endpoint.Category; Status="WARN"}
            $criticalFailures += $endpoint.Name
        }
    } catch {
        Write-Host " ❌ ERRO" -ForegroundColor Red
        $results += @{Name=$endpoint.Name; Category=$endpoint.Category; Status="ERROR"}
        $criticalFailures += $endpoint.Name
    }
    
    Start-Sleep -Seconds 1
}

# Resumo do teste rápido
Write-Host ""
Write-Host "📊 RESULTADO DO TESTE RÁPIDO ETAPA 2:" -ForegroundColor Cyan

# Agrupar por categoria
$groupedResults = $results | Group-Object Category

foreach ($group in $groupedResults) {
    Write-Host ""
    Write-Host "  📁 $($group.Name):" -ForegroundColor White
    
    foreach ($result in $group.Group) {
        $icon = switch ($result.Status) {
            "OK" { "✅" }
            "WARN" { "⚠️" }
            "ERROR" { "❌" }
            default { "❓" }
        }
        
        Write-Host "    $icon $($result.Name)" -ForegroundColor Gray
    }
}

$okCount = ($results | Where-Object { $_.Status -eq "OK" }).Count
$totalCount = $results.Count
$successRate = [math]::Round(($okCount / $totalCount) * 100, 1)

Write-Host ""
Write-Host "  📈 Estatísticas:" -ForegroundColor Gray
Write-Host "    ✅ $okCount/$totalCount endpoints funcionando" -ForegroundColor $(if ($okCount -eq $totalCount) { "Green" } elseif ($okCount -ge 3) { "Yellow" } else { "Red" })
Write-Host "    📊 Taxa de sucesso: $successRate%" -ForegroundColor Gray

# Recomendação baseada nos resultados
Write-Host ""
Write-Host "🎯 RECOMENDAÇÃO PARA ETAPA 2:" -ForegroundColor Magenta

if ($criticalFailures.Count -eq 0) {
    Write-Host "  ✅ TODOS endpoints críticos OK!" -ForegroundColor Green
    Write-Host "  🚀 Pode iniciar implementação da Etapa 2 com segurança" -ForegroundColor Green
} elseif ($criticalFailures.Count -le 2) {
    Write-Host "  ⚠️  Alguns endpoints com problemas:" -ForegroundColor Yellow
    Write-Host "     $($criticalFailures -join ', ')" -ForegroundColor Yellow
    Write-Host "  🔧 Recomendação: Corrigir antes de implementar novas funcionalidades" -ForegroundColor Yellow
} else {
    Write-Host "  ❌ MÚLTIPLOS endpoints críticos falharam:" -ForegroundColor Red
    Write-Host "     $($criticalFailures -join ', ')" -ForegroundColor Red
    Write-Host "  🛑 NÃO iniciar Etapa 2. Corrigir API primeiro." -ForegroundColor Red
}

# Opcoes de monitoramento
Write-Host ""
Write-Host "[3] Escolha o modo de monitoramento:" -ForegroundColor Cyan
Write-Host "   1. 🏭 Modo PRODUÇÃO (Foco absoluto em endpoints de produção)" -ForegroundColor Gray
Write-Host "   2. 🔧 Modo Background (Roda em segundo plano durante implementação)" -ForegroundColor Gray
Write-Host "   3. 📊 Dashboard Completo (Todos endpoints, modo interativo)" -ForegroundColor Gray
Write-Host "   4. ⚡ Teste Rápido e Sair (Apenas validação)" -ForegroundColor Gray
Write-Host ""

$mode = Read-Host "Digite o número da opção (1-4)"

switch ($mode) {
    "1" {
        # Modo PRODUÇÃO (foco absoluto)
        Write-Host ""
        Write-Host "🏭 Iniciando monitoramento MODO PRODUÇÃO..." -ForegroundColor Green
        Write-Host "   Foco: Endpoints críticos para chão de fábrica" -ForegroundColor Gray
        Write-Host "   Intervalo: 30 segundos" -ForegroundColor Gray
        Write-Host "   Alertas: Automáticos para falhas críticas" -ForegroundColor Gray
        Write-Host ""
        
        # Executar script específico para produção
        .\scripts\monitoramento-etapa2.ps1 -ProductionFocus
    }
    
    "2" {
        # Modo Background
        Write-Host ""
        Write-Host "🔧 Iniciando monitoramento em BACKGROUND..." -ForegroundColor Green
        Write-Host "   Ideal para execução durante implementação" -ForegroundColor Gray
        Write-Host "   Logs automáticos em arquivo diário" -ForegroundColor Gray
        Write-Host "   Alertas para endpoints críticos" -ForegroundColor Gray
        Write-Host ""
        
        # Configuração para background
        $config = @{
            BaseUrl = "http://localhost:3333"
            CheckInterval = 60
            LogFile = "monitoramento-etapa2-background-$(Get-Date -Format 'yyyyMMdd').log"
            StartTime = (Get-Date).ToString("o")
            Etapa = 2
        }
        
        $config | ConvertTo-Json | Out-File -FilePath "monitoramento-etapa2-config.json" -Encoding UTF8
        
        # Script simplificado para background
        $backgroundScript = @'
# Monitoramento Etapa 2 em background
$config = Get-Content -Path "monitoramento-etapa2-config.json" | ConvertFrom-Json

# Endpoints críticos de produção (prioridade máxima)
$productionEndpoints = @(
    @{Name="Health Check"; Path="/health"},
    @{Name="Estoque Produtos"; Path="/v1/admin/omie/products/stock?page=1&pageSize=5"},
    @{Name="Pedidos Stage 20"; Path="/v1/admin/orders/stage20?page=1&pageSize=5"},
    @{Name="Ordens Produção"; Path="/v1/admin/omie/production-orders?page=1&pageSize=5"}
)

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $allOk = $true
    
    foreach ($endpoint in $productionEndpoints) {
        try {
            $response = Invoke-WebRequest -Uri "$($config.BaseUrl)$($endpoint.Path)" -Method GET -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                "$timestamp - ✅ $($endpoint.Name) OK" | Out-File -FilePath $config.LogFile -Append -Encoding UTF8
            } else {
                "$timestamp - ⚠️ $($endpoint.Name) Status: $($response.StatusCode)" | Out-File -FilePath $config.LogFile -Append -Encoding UTF8
                $allOk = $false
            }
        } catch {
            "$timestamp - ❌ $($endpoint.Name) ERRO: $_" | Out-File -FilePath $config.LogFile -Append -Encoding UTF8
            $allOk = $false
        }
        
        Start-Sleep -Seconds 1
    }
    
    if (-not $allOk) {
        "$timestamp - 🚨 ALERTA: Um ou mais endpoints críticos falharam" | Out-File -FilePath $config.LogFile -Append -Encoding UTF8
    }
    
    Start-Sleep -Seconds $config.CheckInterval
}
'@
        
        # Salvar script de background
        $backgroundScript | Out-File -FilePath "scripts\monitoramento-etapa2-background.ps1" -Encoding UTF8
        
        # Iniciar job em background
        $job = Start-Job -ScriptBlock {
            param($scriptPath)
            & $scriptPath
        } -ArgumentList "scripts\monitoramento-etapa2-background.ps1"
        
        Write-Host "   ✅ Monitoramento iniciado em background" -ForegroundColor Green
        Write-Host "   🆔 Job ID: $($job.Id)" -ForegroundColor Gray
        Write-Host "   📊 Logs: $($config.LogFile)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Para parar o monitoramento:" -ForegroundColor Gray
        Write-Host "   Stop-Job -Id $($job.Id)" -ForegroundColor Gray
        Write-Host "   Remove-Job -Id $($job.Id)" -ForegroundColor Gray
    }
    
    "3" {
        # Dashboard Completo
        Write-Host ""
        Write-Host "📊 Iniciando DASHBOARD COMPLETO..." -ForegroundColor Green
        Write-Host "   Todos endpoints (críticos + suporte)" -ForegroundColor Gray
        Write-Host "   Dashboard interativo em tempo real" -ForegroundColor Gray
        Write-Host "   Comandos: [R] Relatório, [S] Status, [L] Logs, [Q] Sair" -ForegroundColor Gray
        Write-Host ""
        
        # Executar script completo
        .\scripts\monitoramento-etapa2.ps1
    }
    
    "4" {
        # Teste Rápido e Sair
        Write-Host ""
        Write-Host "⚡ Teste rápido concluído." -ForegroundColor Green
        
        if ($criticalFailures.Count -eq 0) {
            Write-Host "   ✅ API PRONTA para Etapa 2!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Corrigir antes de iniciar Etapa 2:" -ForegroundColor Yellow
            Write-Host "      $($criticalFailures -join ', ')" -ForegroundColor Yellow
        }
        
        exit 0
    }
    
    default {
        Write-Host "   ❌ Opção inválida" -ForegroundColor Red
        exit 1
    }
}