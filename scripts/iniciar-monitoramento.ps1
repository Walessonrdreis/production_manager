# Script de Inicialização Fácil - Monitoramento Contínuo
# Execute: .\scripts\iniciar-monitoramento.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   🚀 INICIAR MONITORAMENTO CONTÍNUO    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se API está rodando
Write-Host "[1] Verificando se API está rodando..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3333/health" -Method GET -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        $healthData = $response.Content | ConvertFrom-Json
        if ($healthData.ok -eq $true) {
            Write-Host "   ✅ API está rodando e saudável" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  API responde mas ok=false" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   ❌ API NÃO está rodando em http://localhost:3333" -ForegroundColor Red
    Write-Host "   Execute primeiro: cd apps\api && pnpm dev" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Deseja iniciar a API agora? (S/N)" -ForegroundColor Gray
    $choice = Read-Host
    
    if ($choice -eq "S" -or $choice -eq "s") {
        Write-Host "   Iniciando API em novo terminal..." -ForegroundColor Gray
        
        # Comando para iniciar API (pode precisar ajuste)
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\walll\OneDrive\projects_git\production_manager\apps\api'; pnpm dev"
        
        Write-Host "   ⏳ Aguarde 10 segundos para API iniciar..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        # Verificar novamente
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3333/health" -Method GET -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "   ✅ API iniciada com sucesso!" -ForegroundColor Green
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

# Opcoes de monitoramento
Write-Host ""
Write-Host "[2] Escolha o modo de monitoramento:" -ForegroundColor Magenta
Write-Host "   1. 🖥️  Modo Interativo (Dashboard em tempo real)" -ForegroundColor Gray
Write-Host "   2. 🔧 Modo Background (Roda em segundo plano)" -ForegroundColor Gray
Write-Host "   3. ⚡ Modo Rápido (Teste rápido e sai)" -ForegroundColor Gray
Write-Host ""

$mode = Read-Host "Digite o número da opção (1-3)"

switch ($mode) {
    "1" {
        # Modo Interativo
        Write-Host ""
        Write-Host "🚀 Iniciando monitoramento interativo..." -ForegroundColor Green
        Write-Host "   Pressione [Q] para sair" -ForegroundColor Gray
        Write-Host "   Pressione [R] para relatório" -ForegroundColor Gray
        Write-Host ""
        
        # Executar script principal
        .\scripts\monitoramento-continuo.ps1
    }
    
    "2" {
        # Modo Background
        Write-Host ""
        Write-Host "🚀 Iniciando monitoramento em background..." -ForegroundColor Green
        
        # Criar arquivo de configuracao
        $config = @{
            BaseUrl = "http://localhost:3333"
            CheckInterval = 60
            LogFile = "monitoramento-$(Get-Date -Format 'yyyyMMdd').log"
            StartTime = (Get-Date).ToString("o")
        }
        
        $config | ConvertTo-Json | Out-File -FilePath "monitoramento-config.json" -Encoding UTF8
        
        # Script simplificado para background
        $backgroundScript = @'
# Monitoramento em background
$config = Get-Content -Path "monitoramento-config.json" | ConvertFrom-Json

while ($true) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    try {
        $response = Invoke-WebRequest -Uri "$($config.BaseUrl)/health" -Method GET -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            "$timestamp - ✅ API OK" | Out-File -FilePath $config.LogFile -Append -Encoding UTF8
        } else {
            "$timestamp - ⚠️ API Status: $($response.StatusCode)" | Out-File -FilePath $config.LogFile -Append -Encoding UTF8
        }
    } catch {
        "$timestamp - ❌ API ERRO: $_" | Out-File -FilePath $config.LogFile -Append -Encoding UTF8
    }
    
    Start-Sleep -Seconds $config.CheckInterval
}
'@
        
        # Salvar script de background
        $backgroundScript | Out-File -FilePath "scripts\monitoramento-background.ps1" -Encoding UTF8
        
        # Iniciar em background
        $job = Start-Job -ScriptBlock {
            param($scriptPath)
            & $scriptPath
        } -ArgumentList "scripts\monitoramento-background.ps1"
        
        Write-Host "   ✅ Monitoramento iniciado em background" -ForegroundColor Green
        Write-Host "   📊 Logs: $($config.LogFile)" -ForegroundColor Gray
        Write-Host "   🆔 Job ID: $($job.Id)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Para parar o monitoramento:" -ForegroundColor Gray
        Write-Host "   Stop-Job -Id $($job.Id)" -ForegroundColor Gray
        Write-Host "   Remove-Job -Id $($job.Id)" -ForegroundColor Gray
    }
    
    "3" {
        # Modo Rápido
        Write-Host ""
        Write-Host "⚡ Executando teste rápido..." -ForegroundColor Green
        
        $endpoints = @(
            @{Name="Health Check"; Path="/health"},
            @{Name="Catalogo Publico"; Path="/v1/products?page=1&pageSize=5"},
            @{Name="Pedidos Etapa 20"; Path="/v1/orders?page=1&pageSize=5"}
        )
        
        $results = @()
        
        foreach ($endpoint in $endpoints) {
            Write-Host "   Testando: $($endpoint.Name)..." -NoNewline
            
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3333$($endpoint.Path)" -Method GET -TimeoutSec 5
                
                if ($response.StatusCode -eq 200) {
                    Write-Host " ✅ OK" -ForegroundColor Green
                    $results += @{Name=$endpoint.Name; Status="OK"}
                } else {
                    Write-Host " ⚠️ Status: $($response.StatusCode)" -ForegroundColor Yellow
                    $results += @{Name=$endpoint.Name; Status="WARN"}
                }
            } catch {
                Write-Host " ❌ ERRO" -ForegroundColor Red
                $results += @{Name=$endpoint.Name; Status="ERROR"}
            }
            
            Start-Sleep -Seconds 1
        }
        
        Write-Host ""
        Write-Host "📊 Resultado do teste rápido:" -ForegroundColor Magenta
        
        $okCount = ($results | Where-Object { $_.Status -eq "OK" }).Count
        $totalCount = $results.Count
        
        foreach ($result in $results) {
            $icon = switch ($result.Status) {
                "OK" { "✅" }
                "WARN" { "⚠️" }
                "ERROR" { "❌" }
                default { "❓" }
            }
            
            Write-Host "   $icon $($result.Name)" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Host "   ✅ $okCount/$totalCount endpoints funcionando" -ForegroundColor $(if ($okCount -eq $totalCount) { "Green" } elseif ($okCount -ge 2) { "Yellow" } else { "Red" })
        
        if ($okCount -eq $totalCount) {
            Write-Host "   🎉 API está pronta para Etapa 2!" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Alguns endpoints precisam de atenção" -ForegroundColor Yellow
        }
    }
    
    default {
        Write-Host "   ❌ Opção inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   📚 DOCUMENTAÇÃO DISPONÍVEL           " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "   📖 docs\USO_SCRIPT_TESTES_ENDPOINTS.md" -ForegroundColor Gray
Write-Host "   📖 docs\COMPATIBILIDADE_API_ATUAL.md" -ForegroundColor Gray
Write-Host "   📖 docs\ETAPA_2_PRODUCAO.md" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Para mais opções:" -ForegroundColor Gray
Write-Host "   .\scripts\monitoramento-continuo.ps1 -RunAsService" -ForegroundColor Gray
Write-Host "   .\scripts\testar-endpoints.ps1" -ForegroundColor Gray
Write-Host "   .\scripts\verificar-etapa2-v2.ps1" -ForegroundColor Gray