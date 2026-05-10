# Script de Monitoramento Contínuo - Endpoints da API
# Execute em background: .\scripts\monitoramento-continuo.ps1 -RunAsService

param(
    [switch]$RunAsService,
    [int]$CheckInterval = 60,  # segundos entre verificacoes
    [string]$LogFile = "monitoramento-$(Get-Date -Format 'yyyyMMdd').log",
    [string]$AlertEmail = "",
    [string]$AlertWebhook = ""
)

# Configuracoes
$baseUrl = "http://localhost:3333"
$monitoringData = @{
    StartTime = Get-Date
    TotalChecks = 0
    FailedChecks = 0
    Endpoints = @{}
    AlertsSent = 0
    LastAlertTime = $null
}

# Endpoints criticos para monitoramento
$criticalEndpoints = @(
    @{Name="Health Check"; Path="/health"; Method="GET"; ExpectedStatus=200; Critical=true},
    @{Name="Catalogo Publico"; Path="/v1/products?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=true},
    @{Name="Pedidos Etapa 20"; Path="/v1/orders?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=true},
    @{Name="Produtos Gerenciados"; Path="/v1/admin/managed-products?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=false},
    @{Name="Setores"; Path="/v1/admin/sectors?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=false},
    @{Name="Planos Producao"; Path="/v1/admin/plans?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=false},
    @{Name="Produtos Omie"; Path="/v1/admin/omie/products?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=true}
)

# Funcao para log
function Write-MonitorLog {
    param($Message, $Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Console (colorido)
    switch ($Level) {
        "INFO"    { Write-Host $logEntry -ForegroundColor Gray }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "ERROR"   { Write-Host $logEntry -ForegroundColor Red }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
    }
    
    # Arquivo de log
    $logEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

# Funcao para testar endpoint
function Test-Endpoint-Monitor {
    param($Endpoint)
    
    $monitoringData.TotalChecks++
    $endpointName = $Endpoint.Name
    $url = "$baseUrl$($Endpoint.Path)"
    
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri $url -Method $Endpoint.Method -TimeoutSec 10
        $endTime = Get-Date
        $responseTime = [math]::Round(($endTime - $startTime).TotalMilliseconds, 2)
        
        $isSuccess = $response.StatusCode -eq $Endpoint.ExpectedStatus
        
        # Atualizar dados do endpoint
        if (-not $monitoringData.Endpoints.ContainsKey($endpointName)) {
            $monitoringData.Endpoints[$endpointName] = @{
                TotalChecks = 0
                FailedChecks = 0
                LastCheck = $null
                LastStatus = $null
                AvgResponseTime = 0
                ResponseTimes = @()
                History = @()
            }
        }
        
        $endpointData = $monitoringData.Endpoints[$endpointName]
        $endpointData.TotalChecks++
        $endpointData.LastCheck = Get-Date
        $endpointData.LastStatus = $response.StatusCode
        
        # Calcular tempo medio de resposta
        $endpointData.ResponseTimes += $responseTime
        if ($endpointData.ResponseTimes.Count -gt 10) {
            $endpointData.ResponseTimes = $endpointData.ResponseTimes | Select-Object -Last 10
        }
        
        # Calcular media de forma segura
        if ($endpointData.ResponseTimes.Count -gt 0) {
            $sum = 0
            foreach ($time in $endpointData.ResponseTimes) {
                $sum += $time
            }
            $endpointData.AvgResponseTime = [math]::Round($sum / $endpointData.ResponseTimes.Count, 2)
        } else {
            $endpointData.AvgResponseTime = 0
        }
        
        # Adicionar ao historico
        $endpointData.History += @{
            Timestamp = Get-Date
            Status = $response.StatusCode
            ResponseTime = $responseTime
            Success = $isSuccess
        }
        
        if ($endpointData.History.Count -gt 100) {
            $endpointData.History = $endpointData.History | Select-Object -Last 100
        }
        
        if ($isSuccess) {
            Write-MonitorLog "✅ $endpointName - OK ($responseTime ms)" -Level "SUCCESS"
            return $true
        } else {
            $monitoringData.FailedChecks++
            $endpointData.FailedChecks++
            Write-MonitorLog "⚠️ $endpointName - Status inesperado: $($response.StatusCode) (esperado: $($Endpoint.ExpectedStatus))" -Level "WARNING"
            
            if ($Endpoint.Critical) {
                Send-Alert -Endpoint $Endpoint -Error "Status $($response.StatusCode) (esperado: $($Endpoint.ExpectedStatus))"
            }
            
            return $false
        }
        
    } catch {
        $monitoringData.FailedChecks++
        
        # Tentar extrair status code do erro
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        $errorMessage = $_.Exception.Message
        
        # Atualizar dados do endpoint
        if (-not $monitoringData.Endpoints.ContainsKey($endpointName)) {
            $monitoringData.Endpoints[$endpointName] = @{
                TotalChecks = 0
                FailedChecks = 0
                LastCheck = $null
                LastStatus = $null
                AvgResponseTime = 0
                ResponseTimes = @()
                History = @()
            }
        }
        
        $endpointData = $monitoringData.Endpoints[$endpointName]
        $endpointData.TotalChecks++
        $endpointData.FailedChecks++
        $endpointData.LastCheck = Get-Date
        $endpointData.LastStatus = $statusCode
        
        Write-MonitorLog "❌ $endpointName - ERRO: $errorMessage" -Level "ERROR"
        
        # Enviar alerta para endpoints criticos
        if ($Endpoint.Critical) {
            Send-Alert -Endpoint $Endpoint -Error $errorMessage
        }
        
        return $false
    }
}

# Funcao para enviar alertas
function Send-Alert {
    param($Endpoint, $Error)
    
    $alertId = "ALERT-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $endpointName = $Endpoint.Name
    $url = "$baseUrl$($Endpoint.Path)"
    
    $alertMessage = @"
🚨 ALERTA DE MONITORAMENTO - ENDPOINT CRITICO FALHOU
===================================================
ID: $alertId
Hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Endpoint: $endpointName
URL: $url
Erro: $Error
Status: FALHA CRITICA
===================================================
Acao recomendada:
1. Verificar se API esta rodando
2. Checar logs da aplicacao
3. Testar endpoint manualmente
4. Corrigir problema imediatamente
"@
    
    # Log do alerta
    Write-MonitorLog "🚨 ALERTA ENVIADO: $endpointName - $Error" -Level "ERROR"
    
    # Salvar alerta em arquivo
    $alertFile = "alertas\alerta-$alertId.txt"
    $alertMessage | Out-File -FilePath $alertFile -Encoding UTF8
    
    # Enviar email (se configurado)
    if ($AlertEmail -and $AlertEmail -ne "") {
        try {
            Send-MailMessage -To $AlertEmail -Subject "ALERTA: $endpointName falhou" -Body $alertMessage -From "monitoramento@factory.com" -SmtpServer "localhost"
            Write-MonitorLog "📧 Email enviado para: $AlertEmail" -Level "INFO"
        } catch {
            Write-MonitorLog "⚠️ Falha ao enviar email: $_" -Level "WARNING"
        }
    }
    
    # Enviar webhook (se configurado)
    if ($AlertWebhook -and $AlertWebhook -ne "") {
        try {
            $webhookData = @{
                alert_id = $alertId
                timestamp = (Get-Date).ToString("o")
                endpoint = $endpointName
                url = $url
                error = $Error
                critical = $true
            }
            
            Invoke-RestMethod -Uri $AlertWebhook -Method POST -Body ($webhookData | ConvertTo-Json) -ContentType "application/json"
            Write-MonitorLog "🔗 Webhook enviado para: $AlertWebhook" -Level "INFO"
        } catch {
            Write-MonitorLog "⚠️ Falha ao enviar webhook: $_" -Level "WARNING"
        }
    }
    
    $monitoringData.AlertsSent++
    $monitoringData.LastAlertTime = Get-Date
    
    # Tambem escrever no console para visibilidade imediata
    Write-Host "`n🚨🚨🚨 ALERTA CRITICO 🚨🚨🚨" -ForegroundColor Red -BackgroundColor Black
    Write-Host "Endpoint: $endpointName" -ForegroundColor Red
    Write-Host "Erro: $Error" -ForegroundColor Yellow
    Write-Host "Hora: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    Write-Host "`n" -NoNewline
}

# Funcao para gerar relatorio
function Get-MonitoringReport {
    $uptime = (Get-Date) - $monitoringData.StartTime
    $uptimeFormatted = "{0:dd}d {0:hh}h {0:mm}m {0:ss}s" -f $uptime
    
    $successRate = if ($monitoringData.TotalChecks -gt 0) {
        [math]::Round((($monitoringData.TotalChecks - $monitoringData.FailedChecks) / $monitoringData.TotalChecks) * 100, 2)
    } else { 0 }
    
    $report = @"
📊 RELATORIO DE MONITORAMENTO
=============================
Periodo: $($monitoringData.StartTime.ToString('dd/MM/yyyy HH:mm')) - $(Get-Date -Format 'dd/MM/yyyy HH:mm')
Uptime: $uptimeFormatted
Total de verificacoes: $($monitoringData.TotalChecks)
Verificacoes falhas: $($monitoringData.FailedChecks)
Taxa de sucesso: $successRate%
Alertas enviados: $($monitoringData.AlertsSent)

📈 ENDPOINTS MONITORADOS:
"@
    
    foreach ($endpointName in $monitoringData.Endpoints.Keys | Sort-Object) {
        $data = $monitoringData.Endpoints[$endpointName]
        $endpointSuccessRate = if ($data.TotalChecks -gt 0) {
            [math]::Round((($data.TotalChecks - $data.FailedChecks) / $data.TotalChecks) * 100, 2)
        } else { 0 }
        
        $lastCheck = if ($data.LastCheck) { $data.LastCheck.ToString("HH:mm:ss") } else { "Nunca" }
        $status = if ($data.LastStatus) { $data.LastStatus } else { "Desconhecido" }
        
        $report += "`n  🔹 $endpointName"
        $report += "`n     Verificacoes: $($data.TotalChecks) | Falhas: $($data.FailedChecks) | Sucesso: $endpointSuccessRate%"
        $report += "`n     Ultima verificacao: $lastCheck | Status: $status | Tempo medio: $($data.AvgResponseTime) ms"
    }
    
    $report += "`n`n⚠️  RECOMENDACOES:"
    
    if ($successRate -lt 90) {
        $report += "`n  ❌ API com problemas criticos. Corrigir antes de continuar."
    } elseif ($successRate -lt 95) {
        $report += "`n  ⚠️  API com problemas menores. Monitorar atentamente."
    } else {
        $report += "`n  ✅ API estavel. Pode continuar implementacao."
    }
    
    # Verificar endpoints criticos
    $criticalFailures = $criticalEndpoints | Where-Object { $_.Critical -eq $true } | ForEach-Object {
        $endpointName = $_.Name
        if ($monitoringData.Endpoints.ContainsKey($endpointName)) {
            $data = $monitoringData.Endpoints[$endpointName]
            if ($data.FailedChecks -gt 0) {
                "$endpointName ($($data.FailedChecks) falhas)"
            }
        }
    }
    
    if ($criticalFailures.Count -gt 0) {
        $report += "`n  🚨 Endpoints criticos com falhas: $($criticalFailures -join ', ')"
    }
    
    return $report
}

# Funcao para exibir dashboard em tempo real
function Show-MonitoringDashboard {
    Clear-Host
    
    $uptime = (Get-Date) - $monitoringData.StartTime
    $uptimeFormatted = "{0:dd}d {0:hh}h {0:mm}m {0:ss}s" -f $uptime
    
    $successRate = if ($monitoringData.TotalChecks -gt 0) {
        [math]::Round((($monitoringData.TotalChecks - $monitoringData.FailedChecks) / $monitoringData.TotalChecks) * 100, 2)
    } else { 0 }
    
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   🚀 MONITORAMENTO CONTÍNUO - API ETAPA 2     " -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "📊 ESTATÍSTICAS GERAIS:" -ForegroundColor Magenta
    Write-Host "  Início: $($monitoringData.StartTime.ToString('dd/MM HH:mm:ss'))" -ForegroundColor Gray
    Write-Host "  Uptime: $uptimeFormatted" -ForegroundColor Gray
    Write-Host "  Verificações: $($monitoringData.TotalChecks)" -ForegroundColor Gray
    Write-Host "  Falhas: $($monitoringData.FailedChecks)" -ForegroundColor Gray
    Write-Host "  Sucesso: $successRate%" -ForegroundColor $(if ($successRate -ge 95) { "Green" } elseif ($successRate -ge 90) { "Yellow" } else { "Red" })
    Write-Host "  Alertas: $($monitoringData.AlertsSent)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📈 STATUS DOS ENDPOINTS CRÍTICOS:" -ForegroundColor Magenta
    
    foreach ($endpoint in $criticalEndpoints | Where-Object { $_.Critical -eq $true }) {
        $endpointName = $endpoint.Name
        $status = "❓ DESCONHECIDO"
        $color = "Gray"
        
        if ($monitoringData.Endpoints.ContainsKey($endpointName)) {
            $data = $monitoringData.Endpoints[$endpointName]
            
            if ($data.TotalChecks -eq 0) {
                $status = "⏳ AGUARDANDO"
                $color = "Yellow"
            } elseif ($data.FailedChecks -eq 0) {
                $status = "✅ ESTÁVEL"
                $color = "Green"
            } else {
                $failureRate = [math]::Round(($data.FailedChecks / $data.TotalChecks) * 100, 1)
                $status = "⚠️  $failureRate% FALHAS"
                $color = "Red"
            }
        }
        
        Write-Host "  $status - $endpointName" -ForegroundColor $color
    }
    
    Write-Host ""
    Write-Host "🔧 COMANDOS DISPONÍVEIS:" -ForegroundColor Gray
    Write-Host "  [R] Relatório completo" -ForegroundColor Gray
    Write-Host "  [S] Status detalhado" -ForegroundColor Gray
    Write-Host "  [L] Ver logs" -ForegroundColor Gray
    Write-Host "  [Q] Sair" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⏳ Próxima verificação em: $CheckInterval segundos" -ForegroundColor Gray
    Write-Host "================================================" -ForegroundColor Cyan
}

# Funcao principal
function Start-Monitoring {
    Write-Host "🚀 Iniciando monitoramento contínuo..." -ForegroundColor Green
    Write-Host "   API: $baseUrl" -ForegroundColor Gray
    Write-Host "   Intervalo: $CheckInterval segundos" -ForegroundColor Gray
    Write-Host "   Log: $LogFile" -ForegroundColor Gray
    Write-Host ""
    
    # Criar diretorio para alertas
    if (-not (Test-Path "alertas")) {
        New-Item -ItemType Directory -Path "alertas" -Force | Out-Null
    }
    
    # Loop principal
    while ($true) {
        try {
            # Exibir dashboard
            Show-MonitoringDashboard
            
            # Testar todos os endpoints criticos
            foreach ($endpoint in $criticalEndpoints) {
                Test-Endpoint-Monitor -Endpoint $endpoint
                Start-Sleep -Seconds 2  # Pequena pausa entre endpoints
            }
            
            # Aguardar proximo ciclo
            Write-Host "`n⏳ Aguardando proximo ciclo de verificacao..." -ForegroundColor Gray
            Start-Sleep -Seconds $CheckInterval
            
        } catch {
            Write-MonitorLog "❌ ERRO NO LOOP PRINCIPAL: $_" -Level "ERROR"
            Start-Sleep -Seconds 10
        }
    }
}

# Modo service (background)
if ($RunAsService) {
    # Criar arquivo de configuracao
    $config = @{
        BaseUrl = $baseUrl
        CheckInterval = $CheckInterval
        LogFile = $LogFile
        AlertEmail = $AlertEmail
        AlertWebhook = $AlertWebhook
        StartTime = (Get-Date).ToString("o")
    }
    
    $config | ConvertTo-Json | Out-File -FilePath "monitoramento-config.json" -Encoding UTF8
    
    # Executar em background
    $scriptBlock = {
        param($configPath)
        
        $config = Get-Content -Path $configPath | ConvertFrom-Json
        
        # Importar funcoes (simplificado para background)
        function Write-BackgroundLog {
            param($Message)
            "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - $Message" | Out-File -FilePath $config.LogFile -Append -Encoding UTF8
        }
        
        while ($true) {
            try {
                $response = Invoke-WebRequest -Uri "$($config.BaseUrl)/health" -Method GET -TimeoutSec 5
                if ($response.StatusCode -eq 200) {
                    Write-BackgroundLog "✅ API OK"
                } else {
                    Write-BackgroundLog "⚠️ API Status: $($response.StatusCode)"
                }
            } catch {
                Write-BackgroundLog "❌ API ERRO: $_"
            }
            
            Start-Sleep -Seconds $config.CheckInterval
        }
    }
    
    # Iniciar job em background
    $job = Start-Job -ScriptBlock $scriptBlock -ArgumentList "monitoramento-config.json"
    
    Write-Host "✅ Monitoramento iniciado em background (Job ID: $($job.Id))" -ForegroundColor Green
    Write-Host "   Logs: $LogFile" -ForegroundColor Gray
    Write-Host "   Para parar: Stop-Job -Id $($job.Id)" -ForegroundColor Gray
    
} else {
    # Modo interativo
    Start-Monitoring
}