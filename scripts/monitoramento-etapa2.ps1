# Script de Monitoramento Específico - Etapa 2 (Produção)
# Foco em endpoints críticos para gestão de produção/chão de fábrica

param(
    [switch]$RunAsService,
    [int]$CheckInterval = 30,  # 30 segundos para monitoramento mais frequente
    [string]$LogFile = "monitoramento-etapa2-$(Get-Date -Format 'yyyyMMdd').log",
    [string]$AlertEmail = "",
    [string]$AlertWebhook = "",
    [switch]$ProductionFocus  # Foco apenas em endpoints de produção
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
    ProductionEndpoints = @{}
}

# Endpoints CRÍTICOS para Etapa 2 - Foco em Produção
$productionEndpoints = @(
    # 1. ESTOQUE (Atualização: 2 minutos)
    @{Name="Estoque Produtos Omie"; Path="/v1/admin/omie/products/stock?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=true; Category="Estoque"; Priority=1},
    @{Name="Refresh Estoque Omie"; Path="/v1/admin/omie/products/stock/refresh"; Method="POST"; ExpectedStatus=200; Critical=true; Category="Estoque"; Priority=1},
    
    # 2. PEDIDOS VENDIDOS (Atualização: 1 minuto)  
    @{Name="Pedidos Stage 20"; Path="/v1/admin/orders/stage20?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=true; Category="Pedidos"; Priority=1},
    @{Name="Totais Stage 20"; Path="/v1/admin/orders/stage20/totals"; Method="GET"; ExpectedStatus=200; Critical=true; Category="Pedidos"; Priority=1},
    
    # 3. ORDENS PRODUÇÃO (Atualização: 30 segundos)
    @{Name="Ordens Produção Omie"; Path="/v1/admin/omie/production-orders?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=true; Category="Producao"; Priority=1},
    @{Name="Sync Ordens Produção"; Path="/v1/admin/omie/production-orders/sync"; Method="POST"; ExpectedStatus=200; Critical=true; Category="Producao"; Priority=1},
    
    # 4. CATÁLOGO PÚBLICO (Frontend)
    @{Name="Catálogo Público"; Path="/v1/products?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=true; Category="Catalogo"; Priority=2},
    
    # 5. HEALTH & STATUS
    @{Name="Health Check"; Path="/health"; Method="GET"; ExpectedStatus=200; Critical=true; Category="System"; Priority=1},
    @{Name="API Index"; Path="/v1"; Method="GET"; ExpectedStatus=200; Critical=false; Category="System"; Priority=3}
)

# Endpoints de SUPORTE para Etapa 2
$supportEndpoints = @(
    @{Name="Produtos Gerenciados"; Path="/v1/admin/managed-products?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=false; Category="Admin"; Priority=3},
    @{Name="Setores Produção"; Path="/v1/admin/sectors?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=false; Category="Admin"; Priority=3},
    @{Name="Planos Produção"; Path="/v1/admin/plans?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=false; Category="Admin"; Priority=3},
    @{Name="Clientes"; Path="/v1/admin/clients?page=1&pageSize=5"; Method="GET"; ExpectedStatus=200; Critical=false; Category="Admin"; Priority=3}
)

# Selecionar endpoints baseado no foco
if ($ProductionFocus) {
    $criticalEndpoints = $productionEndpoints
} else {
    $criticalEndpoints = $productionEndpoints + $supportEndpoints
}

# Funcao para log com categorias
function Write-MonitorLog {
    param($Message, $Level = "INFO", $Category = "MONITOR")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Category] [$Level] $Message"
    
    # Console (colorido por categoria)
    switch ($Category) {
        "ESTOQUE"   { $catColor = "Cyan" }
        "PEDIDOS"   { $catColor = "Yellow" }
        "PRODUCAO"  { $catColor = "Green" }
        "CATALOGO"  { $catColor = "Magenta" }
        "SYSTEM"    { $catColor = "Gray" }
        "ADMIN"     { $catColor = "DarkGray" }
        default     { $catColor = "White" }
    }
    
    # Nível de log
    switch ($Level) {
        "INFO"    { Write-Host "[INFO] " -NoNewline -ForegroundColor Gray; Write-Host $Message -ForegroundColor $catColor }
        "WARNING" { Write-Host "[WARN] " -NoNewline -ForegroundColor Yellow; Write-Host $Message -ForegroundColor $catColor }
        "ERROR"   { Write-Host "[ERROR] " -NoNewline -ForegroundColor Red; Write-Host $Message -ForegroundColor $catColor }
        "SUCCESS" { Write-Host "[OK] " -NoNewline -ForegroundColor Green; Write-Host $Message -ForegroundColor $catColor }
        "ALERT"   { Write-Host "[ALERT] " -NoNewline -ForegroundColor Red -BackgroundColor Black; Write-Host $Message -ForegroundColor Red }
    }
    
    # Arquivo de log
    $logEntry | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

# Funcao para testar endpoint com métricas específicas
function Test-Endpoint-Monitor {
    param($Endpoint)
    
    $monitoringData.TotalChecks++
    $endpointName = $Endpoint.Name
    $category = $Endpoint.Category
    $url = "$baseUrl$($Endpoint.Path)"
    
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri $url -Method $Endpoint.Method -TimeoutSec 10
        $endTime = Get-Date
        $responseTime = [math]::Round(($endTime - $startTime).TotalMilliseconds, 2)
        
        $isSuccess = $response.StatusCode -eq $Endpoint.ExpectedStatus
        
        # Inicializar dados do endpoint se necessário
        if (-not $monitoringData.Endpoints.ContainsKey($endpointName)) {
            $monitoringData.Endpoints[$endpointName] = @{
                Category = $category
                Priority = $Endpoint.Priority
                TotalChecks = 0
                FailedChecks = 0
                LastCheck = $null
                LastStatus = $null
                AvgResponseTime = 0
                ResponseTimes = @()
                History = @()
                Critical = $Endpoint.Critical
            }
        }
        
        $endpointData = $monitoringData.Endpoints[$endpointName]
        $endpointData.TotalChecks++
        $endpointData.LastCheck = Get-Date
        $endpointData.LastStatus = $response.StatusCode
        
        # Calcular tempo medio de resposta (janela deslizante de 10 amostras)
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
        
        # Adicionar ao historico (limite de 100 entradas)
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
            # Verificar performance (alerta se > 500ms para endpoints críticos)
            if ($Endpoint.Critical -and $responseTime -gt 500) {
                Write-MonitorLog "$endpointName - OK mas LENTO ($responseTime ms)" -Level "WARNING" -Category $category
                Send-PerformanceAlert -Endpoint $Endpoint -ResponseTime $responseTime
            } else {
                Write-MonitorLog "$endpointName - OK ($responseTime ms)" -Level "SUCCESS" -Category $category
            }
            return $true
        } else {
            $monitoringData.FailedChecks++
            $endpointData.FailedChecks++
            Write-MonitorLog "$endpointName - Status inesperado: $($response.StatusCode) (esperado: $($Endpoint.ExpectedStatus))" -Level "WARNING" -Category $category
            
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
        
        # Inicializar dados do endpoint se necessário
        if (-not $monitoringData.Endpoints.ContainsKey($endpointName)) {
            $monitoringData.Endpoints[$endpointName] = @{
                Category = $category
                Priority = $Endpoint.Priority
                TotalChecks = 0
                FailedChecks = 0
                LastCheck = $null
                LastStatus = $null
                AvgResponseTime = 0
                ResponseTimes = @()
                History = @()
                Critical = $Endpoint.Critical
            }
        }
        
        $endpointData = $monitoringData.Endpoints[$endpointName]
        $endpointData.TotalChecks++
        $endpointData.FailedChecks++
        $endpointData.LastCheck = Get-Date
        $endpointData.LastStatus = $statusCode
        
        Write-MonitorLog "$endpointName - ERRO: $errorMessage" -Level "ERROR" -Category $category
        
        # Enviar alerta para endpoints criticos
        if ($Endpoint.Critical) {
            Send-Alert -Endpoint $Endpoint -Error $errorMessage
        }
        
        return $false
    }
}

# Funcao para enviar alertas criticos
function Send-Alert {
    param($Endpoint, $Error)
    
    $alertId = "ALERT-ETAPA2-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    $endpointName = $Endpoint.Name
    $category = $Endpoint.Category
    $url = "$baseUrl$($Endpoint.Path)"
    
    $alertMessage = @"
🚨 ALERTA CRÍTICO ETAPA 2 - ENDPOINT DE PRODUÇÃO FALHOU
========================================================
ID: $alertId
Hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Categoria: $category
Endpoint: $endpointName
URL: $url
Erro: $Error
Status: FALHA CRÍTICA - IMPACTO NA PRODUÇÃO
========================================================
AÇÃO IMEDIATA REQUERIDA:
1. 🔴 PARAR implementação da Etapa 2
2. 📋 Verificar logs da API: apps\api\logs\
3. 🛠️ Testar endpoint manualmente
4. ⚡ Corrigir problema antes de continuar
5. ✅ Re-testar após correção
========================================================
Prioridade: ALTA - Endpoint crítico para produção
"@
    
    # Log do alerta
    Write-MonitorLog "ALERTA ENVIADO: $endpointName - $Error" -Level "ALERT" -Category $category
    
    # Salvar alerta em arquivo
    $alertDir = "alertas-etapa2"
    if (-not (Test-Path $alertDir)) {
        New-Item -ItemType Directory -Path $alertDir -Force | Out-Null
    }
    
    $alertFile = "$alertDir\alerta-$alertId.txt"
    $alertMessage | Out-File -FilePath $alertFile -Encoding UTF8
    
    # Enviar email (se configurado)
    if ($AlertEmail -and $AlertEmail -ne "") {
        try {
            Send-MailMessage -To $AlertEmail -Subject "[ALERTA ETAPA2] $endpointName falhou" -Body $alertMessage -From "monitoramento-etapa2@factory.com" -SmtpServer "localhost"
            Write-MonitorLog "Email enviado para: $AlertEmail" -Level "INFO" -Category "SYSTEM"
        } catch {
            Write-MonitorLog "Falha ao enviar email: $_" -Level "WARNING" -Category "SYSTEM"
        }
    }
    
    # Enviar webhook (se configurado)
    if ($AlertWebhook -and $AlertWebhook -ne "") {
        try {
            $webhookData = @{
                alert_id = $alertId
                timestamp = (Get-Date).ToString("o")
                category = $category
                endpoint = $endpointName
                url = $url
                error = $Error
                critical = $true
                etapa = 2
                priority = "HIGH"
            }
            
            Invoke-RestMethod -Uri $AlertWebhook -Method POST -Body ($webhookData | ConvertTo-Json) -ContentType "application/json"
            Write-MonitorLog "Webhook enviado para: $AlertWebhook" -Level "INFO" -Category "SYSTEM"
        } catch {
            Write-MonitorLog "Falha ao enviar webhook: $_" -Level "WARNING" -Category "SYSTEM"
        }
    }
    
    $monitoringData.AlertsSent++
    $monitoringData.LastAlertTime = Get-Date
    
    # Alerta visual no console
    Write-Host "`n" -NoNewline
    Write-Host "🚨🚨🚨 ALERTA CRÍTICO ETAPA 2 🚨🚨🚨" -ForegroundColor Red -BackgroundColor Black
    Write-Host "Categoria: $category" -ForegroundColor Red
    Write-Host "Endpoint: $endpointName" -ForegroundColor Red
    Write-Host "Erro: $Error" -ForegroundColor Yellow
    Write-Host "Hora: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
    Write-Host "`n" -NoNewline
}

# Funcao para alertas de performance
function Send-PerformanceAlert {
    param($Endpoint, $ResponseTime)
    
    $endpointName = $Endpoint.Name
    $category = $Endpoint.Category
    
    Write-MonitorLog "$endpointName - Performance degradada: $ResponseTime ms" -Level "WARNING" -Category $category
    
    # Log detalhado de performance
    $perfLog = @"
[PERFORMANCE] Endpoint lento detectado
Endpoint: $endpointName
Categoria: $category
Tempo de resposta: $ResponseTime ms
Limite: 500 ms
Recomendação: Otimizar endpoint ou verificar carga do servidor
"@
    
    $perfLog | Out-File -FilePath "logs\performance-$(Get-Date -Format 'yyyyMMdd').log" -Append -Encoding UTF8
}

# Funcao para gerar relatorio especifico da Etapa 2
function Get-Etapa2-Report {
    $uptime = (Get-Date) - $monitoringData.StartTime
    $uptimeFormatted = "{0:dd}d {0:hh}h {0:mm}m {0:ss}s" -f $uptime
    
    $successRate = if ($monitoringData.TotalChecks -gt 0) {
        [math]::Round((($monitoringData.TotalChecks - $monitoringData.FailedChecks) / $monitoringData.TotalChecks) * 100, 2)
    } else { 0 }
    
    # Agrupar endpoints por categoria
    $categories = @{}
    foreach ($endpointName in $monitoringData.Endpoints.Keys) {
        $data = $monitoringData.Endpoints[$endpointName]
        $category = $data.Category
        
        if (-not $categories.ContainsKey($category)) {
            $categories[$category] = @{
                TotalEndpoints = 0
                TotalChecks = 0
                FailedChecks = 0
                Endpoints = @()
            }
        }
        
        $catData = $categories[$category]
        $catData.TotalEndpoints++
        $catData.TotalChecks += $data.TotalChecks
        $catData.FailedChecks += $data.FailedChecks
        $catData.Endpoints += $endpointName
    }
    
    $report = @"
📊 RELATÓRIO DE MONITORAMENTO - ETAPA 2 (PRODUÇÃO)
==================================================
Período: $($monitoringData.StartTime.ToString('dd/MM/yyyy HH:mm')) - $(Get-Date -Format 'dd/MM/yyyy HH:mm')
Uptime: $uptimeFormatted
Total de verificações: $($monitoringData.TotalChecks)
Verificações falhas: $($monitoringData.FailedChecks)
Taxa de sucesso: $successRate%
Alertas enviados: $($monitoringData.AlertsSent)

📈 ESTATÍSTICAS POR CATEGORIA:
"@
    
    foreach ($category in $categories.Keys | Sort-Object) {
        $catData = $categories[$category]
        $catSuccessRate = if ($catData.TotalChecks -gt 0) {
            [math]::Round((($catData.TotalChecks - $catData.FailedChecks) / $catData.TotalChecks) * 100, 2)
        } else { 0 }
        
        $report += "`n  🔹 $category"
        $report += "`n     Endpoints: $($catData.TotalEndpoints) | Verificações: $($catData.TotalChecks)"
        $report += "`n     Falhas: $($catData.FailedChecks) | Sucesso: $catSuccessRate%"
    }
    
    $report += "`n`n🎯 ENDPOINTS CRÍTICOS (PRODUÇÃO):"
    
    $criticalEndpointsList = $criticalEndpoints | Where-Object { $_.Critical -eq $true } | Sort-Object Category, Name
    foreach ($endpoint in $criticalEndpointsList) {
        $endpointName = $endpoint.Name
        $status = "❓ NÃO VERIFICADO"
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
        
        $report += "`n  $status - $endpointName [$($endpoint.Category)]"
    }
    
    $report += "`n`n⚠️  RECOMENDAÇÕES PARA ETAPA 2:"
    
    if ($successRate -lt 90) {
        $report += "`n  ❌ API com problemas CRÍTICOS. CORRIGIR ANTES de continuar Etapa 2."
        $report += "`n     Foco: Endpoints de produção (estoque, pedidos, ordens produção)"
    } elseif ($successRate -lt 95) {
        $report += "`n  ⚠️  API com problemas menores. Monitorar ATENTAMENTE durante Etapa 2."
        $report += "`n     Verificar endpoints com falhas antes de implementar novas funcionalidades"
    } else {
        $report += "`n  ✅ API ESTÁVEL. Pode continuar implementação da Etapa 2 com segurança."
        $report += "`n     Manter monitoramento ativo durante desenvolvimento"
    }
    
    # Verificar endpoints críticos específicos
    $failedCritical = @()
    foreach ($endpoint in $criticalEndpointsList) {
        $endpointName = $endpoint.Name
        if ($monitoringData.Endpoints.ContainsKey($endpointName)) {
            $data = $monitoringData.Endpoints[$endpointName]
            if ($data.FailedChecks -gt 0) {
                $failedCritical += "$endpointName ($($data.FailedChecks) falhas)"
            }
        }
    }
    
    if ($failedCritical.Count -gt 0) {
        $report += "`n`n🚨 ENDPOINTS CRÍTICOS COM FALHAS (PRIORIDADE MÁXIMA):"
        $report += "`n  " + ($failedCritical -join "`n  ")
    }
    
    return $report
}

# Funcao para exibir dashboard focado em produção
function Show-Production-Dashboard {
    Clear-Host
    
    $uptime = (Get-Date) - $monitoringData.StartTime
    $uptimeFormatted = "{0:dd}d {0:hh}h {0:mm}m {0:ss}s" -f $uptime
    
    $successRate = if ($monitoringData.TotalChecks -gt 0) {
        [math]::Round((($monitoringData.TotalChecks - $monitoringData.FailedChecks) / $monitoringData.TotalChecks) * 100, 2)
    } else { 0 }
    
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   🏭 MONITORAMENTO ETAPA 2 - PRODUÇÃO         " -ForegroundColor Cyan
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
    
    Write-Host "🎯 ENDPOINTS CRÍTICOS - PRODUÇÃO:" -ForegroundColor Magenta
    
    # Agrupar por categoria
    $groupedEndpoints = $criticalEndpoints | Where-Object { $_.Critical -eq $true } | Group-Object Category
    
    foreach ($group in $groupedEndpoints) {
        Write-Host "`n  📁 $($group.Name):" -ForegroundColor White
        
        foreach ($endpoint in $group.Group) {
            $endpointName = $endpoint.Name
            $status = "❓"
            $color = "Gray"
            $details = ""
            
            if ($monitoringData.Endpoints.ContainsKey($endpointName)) {
                $data = $monitoringData.Endpoints[$endpointName]
                
                if ($data.TotalChecks -eq 0) {
                    $status = "⏳"
                    $color = "Yellow"
                    $details = "Aguardando"
                } elseif ($data.FailedChecks -eq 0) {
                    $status = "✅"
                    $color = "Green"
                    $details = "$($data.AvgResponseTime) ms"
                } else {
                    $status = "⚠️"
                    $color = "Red"
                    $failureRate = [math]::Round(($data.FailedChecks / $data.TotalChecks) * 100, 1)
                    $details = "$failureRate% falhas"
                }
            } else {
                $status = "🔍"
                $color = "DarkGray"
                $details = "Não verificado"
            }
            
            Write-Host "    $status $endpointName" -ForegroundColor $color
            Write-Host "      $details" -ForegroundColor DarkGray
        }
    }
    
    Write-Host ""
    Write-Host "🔧 COMANDOS DISPONÍVEIS:" -ForegroundColor Gray
    Write-Host "  [R] Relatório completo Etapa 2" -ForegroundColor Gray
    Write-Host "  [S] Status detalhado por categoria" -ForegroundColor Gray
    Write-Host "  [L] Ver logs de monitoramento" -ForegroundColor Gray
    Write-Host "  [P] Ver logs de performance" -ForegroundColor Gray
    Write-Host "  [A] Ver alertas enviados" -ForegroundColor Gray
    Write-Host "  [Q] Sair" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⏳ Próxima verificação em: $CheckInterval segundos" -ForegroundColor Gray
    Write-Host "================================================" -ForegroundColor Cyan
}

# Funcao principal para Etapa 2
function Start-Etapa2-Monitoring {
    Write-Host "🚀 Iniciando monitoramento ETAPA 2 (Produção)..." -ForegroundColor Green
    Write-Host "   API: $baseUrl" -ForegroundColor Gray
    Write-Host "   Intervalo: $CheckInterval segundos" -ForegroundColor Gray
    Write-Host "   Log: $LogFile" -ForegroundColor Gray
    Write-Host "   Foco: Produção/Chão de Fábrica" -ForegroundColor Gray
    Write-Host ""
    
    # Criar diretorios necessarios
    if (-not (Test-Path "alertas-etapa2")) {
        New-Item -ItemType Directory -Path "alertas-etapa2" -Force | Out-Null
    }
    
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" -Force | Out-Null
    }
    
    # Loop principal
    while ($true) {
        try {
            # Exibir dashboard de produção
            Show-Production-Dashboard
            
            # Testar todos os endpoints criticos (produção primeiro)
            $productionFirst = $criticalEndpoints | Sort-Object { $_.Priority }, { $_.Critical -eq $true } -Descending
            
            foreach ($endpoint in $productionFirst) {
                Test-Endpoint-Monitor -Endpoint $endpoint
                Start-Sleep -Seconds 1  # Pequena pausa entre endpoints
            }
            
            # Aguardar proximo ciclo
            Write-Host "`n⏳ Aguardando próximo ciclo de verificação..." -ForegroundColor Gray
            Start-Sleep -Seconds $CheckInterval
            
        } catch {
            Write-MonitorLog "ERRO NO LOOP PRINCIPAL: $_" -Level "ERROR" -Category "SYSTEM"
            Start-Sleep -Seconds 10
        }
    }
}

# Modo service (background) para Etapa 2
if ($RunAsService) {
    # Configuração específica para Etapa 2
    $config = @{
        BaseUrl = $baseUrl
        CheckInterval = $CheckInterval
        LogFile = $LogFile
        AlertEmail = $AlertEmail
        AlertWebhook = $AlertWebhook
        StartTime = (Get-Date).ToString("o")
        Etapa = 2
        Focus = if ($ProductionFocus) { "Production" } else { "All" }
    }
    
    $config | ConvertTo-Json | Out-File -FilePath "monitoramento-etapa2-config.json" -Encoding UTF8
    
    # Script simplificado para background
    $backgroundScript = @'
# Monitoramento Etapa 2 em background
$config = Get-Content -Path "monitoramento-etapa2-config.json" | ConvertFrom-Json

# Endpoints críticos de produção
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
    
    Write-Host "✅ Monitoramento ETAPA 2 iniciado em background" -ForegroundColor Green
    Write-Host "   🆔 Job ID: $($job.Id)" -ForegroundColor Gray
    Write-Host "   📊 Logs: $LogFile" -ForegroundColor Gray
    Write-Host "   🎯 Foco: Produção" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Para parar o monitoramento:" -ForegroundColor Gray
    Write-Host "   Stop-Job -Id $($job.Id)" -ForegroundColor Gray
    Write-Host "   Remove-Job -Id $($job.Id)" -ForegroundColor Gray
    
} else {
    # Modo interativo
    Start-Etapa2-Monitoring
}