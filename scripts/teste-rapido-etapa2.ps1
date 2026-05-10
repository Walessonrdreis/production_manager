# Teste Rápido - Endpoints Críticos Etapa 2 (Produção)
# Validação rápida antes de iniciar implementação

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   ⚡ TESTE RÁPIDO - ETAPA 2 (PRODUÇÃO) " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuração
$baseUrl = "http://localhost:3333"
$timeout = 5  # segundos

# Endpoints CRÍTICOS para Etapa 2 - Prioridade MÁXIMA
$criticalEndpoints = @(
    # 1. SISTEMA (Fundamental)
    @{Name="Health Check"; Path="/health"; ExpectedStatus=200; Category="System"; Priority=1},
    
    # 2. ESTOQUE (Atualização: 2 minutos)
    @{Name="Estoque Produtos Omie"; Path="/v1/admin/omie/products/stock?page=1&pageSize=5"; ExpectedStatus=200; Category="Estoque"; Priority=1},
    @{Name="Refresh Estoque Omie"; Path="/v1/admin/omie/products/stock/refresh"; ExpectedStatus=200; Category="Estoque"; Priority=1; Method="POST"},
    
    # 3. PEDIDOS VENDIDOS (Atualização: 1 minuto)
    @{Name="Pedidos Stage 20"; Path="/v1/admin/orders/stage20?page=1&pageSize=5"; ExpectedStatus=200; Category="Pedidos"; Priority=1},
    @{Name="Totais Stage 20"; Path="/v1/admin/orders/stage20/totals"; ExpectedStatus=200; Category="Pedidos"; Priority=1},
    
    # 4. ORDENS PRODUÇÃO (Atualização: 30 segundos)
    @{Name="Ordens Produção Omie"; Path="/v1/admin/omie/production-orders?page=1&pageSize=5"; ExpectedStatus=200; Category="Producao"; Priority=1},
    @{Name="Sync Ordens Produção"; Path="/v1/admin/omie/production-orders/sync"; ExpectedStatus=200; Category="Producao"; Priority=1; Method="POST"},
    
    # 5. CATÁLOGO PÚBLICO (Frontend)
    @{Name="Catálogo Público"; Path="/v1/products?page=1&pageSize=5"; ExpectedStatus=200; Category="Catalogo"; Priority=2}
)

# Função para testar endpoint
function Test-Endpoint {
    param($Endpoint)
    
    $endpointName = $Endpoint.Name
    $category = $Endpoint.Category
    $url = "$baseUrl$($Endpoint.Path)"
    $method = if ($Endpoint.Method) { $Endpoint.Method } else { "GET" }
    
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri $url -Method $method -TimeoutSec $timeout
        $endTime = Get-Date
        $responseTime = [math]::Round(($endTime - $startTime).TotalMilliseconds, 2)
        
        $isSuccess = $response.StatusCode -eq $Endpoint.ExpectedStatus
        
        if ($isSuccess) {
            return @{
                Name = $endpointName
                Category = $category
                Status = "OK"
                ResponseTime = $responseTime
                Details = "$($response.StatusCode) - $responseTime ms"
            }
        } else {
            return @{
                Name = $endpointName
                Category = $category
                Status = "WARN"
                ResponseTime = $responseTime
                Details = "Status: $($response.StatusCode) (esperado: $($Endpoint.ExpectedStatus))"
            }
        }
        
    } catch {
        return @{
            Name = $endpointName
            Category = $category
            Status = "ERROR"
            ResponseTime = 0
            Details = "Erro: $($_.Exception.Message)"
        }
    }
}

# Verificar se API está rodando
Write-Host "[1] Verificando conexão com API..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        $healthData = $response.Content | ConvertFrom-Json
        if ($healthData.ok -eq $true) {
            Write-Host "   ✅ API conectada e saudável" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  API responde mas ok=false" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ API retornou status: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Não foi possível conectar à API" -ForegroundColor Red
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Execute primeiro: cd apps\api && pnpm dev" -ForegroundColor Gray
    exit 1
}

# Testar endpoints críticos
Write-Host ""
Write-Host "[2] Testando endpoints CRÍTICOS da Etapa 2..." -ForegroundColor Magenta

$results = @()
$criticalFailures = @()

foreach ($endpoint in $criticalEndpoints) {
    Write-Host "   Testando: $($endpoint.Name) ($($endpoint.Category))..." -NoNewline
    
    $result = Test-Endpoint -Endpoint $endpoint
    
    switch ($result.Status) {
        "OK" {
            Write-Host " ✅ OK ($($result.ResponseTime) ms)" -ForegroundColor Green
        }
        "WARN" {
            Write-Host " ⚠️  $($result.Details)" -ForegroundColor Yellow
            $criticalFailures += $endpoint.Name
        }
        "ERROR" {
            Write-Host " ❌ $($result.Details)" -ForegroundColor Red
            $criticalFailures += $endpoint.Name
        }
    }
    
    $results += $result
    Start-Sleep -Seconds 0.5  # Pequena pausa para não sobrecarregar
}

# Resumo dos resultados
Write-Host ""
Write-Host "📊 RESUMO DO TESTE - ETAPA 2:" -ForegroundColor Cyan

# Agrupar por categoria
$groupedResults = $results | Group-Object Category

foreach ($group in $groupedResults) {
    Write-Host ""
    Write-Host "  📁 $($group.Name):" -ForegroundColor White
    
    $catOk = ($group.Group | Where-Object { $_.Status -eq "OK" }).Count
    $catTotal = $group.Group.Count
    $catRate = [math]::Round(($catOk / $catTotal) * 100, 1)
    
    foreach ($result in $group.Group) {
        $icon = switch ($result.Status) {
            "OK" { "✅" }
            "WARN" { "⚠️" }
            "ERROR" { "❌" }
            default { "❓" }
        }
        
        Write-Host "    $icon $($result.Name)" -ForegroundColor Gray
        if ($result.Status -ne "OK") {
            Write-Host "      $($result.Details)" -ForegroundColor DarkGray
        }
    }
    
    Write-Host "    📈 $catOk/$catTotal OK ($catRate%)" -ForegroundColor $(if ($catOk -eq $catTotal) { "Green" } elseif ($catOk -ge ($catTotal * 0.7)) { "Yellow" } else { "Red" })
}

# Estatísticas gerais
$okCount = ($results | Where-Object { $_.Status -eq "OK" }).Count
$totalCount = $results.Count
$successRate = [math]::Round(($okCount / $totalCount) * 100, 1)

Write-Host ""
Write-Host "🎯 ESTATÍSTICAS GERAIS:" -ForegroundColor Magenta
Write-Host "  ✅ $okCount/$totalCount endpoints funcionando" -ForegroundColor $(if ($okCount -eq $totalCount) { "Green" } elseif ($okCount -ge ($totalCount * 0.7)) { "Yellow" } else { "Red" })
Write-Host "  📊 Taxa de sucesso: $successRate%" -ForegroundColor Gray
Write-Host "  📁 Categorias testadas: $($groupedResults.Count)" -ForegroundColor Gray

# Tempo médio de resposta
$avgResponseTime = [math]::Round(($results | Where-Object { $_.ResponseTime -gt 0 } | Measure-Object -Property ResponseTime -Average).Average, 2)
Write-Host "  ⏱️  Tempo médio de resposta: $avgResponseTime ms" -ForegroundColor Gray

# Recomendação final
Write-Host ""
Write-Host "🚀 RECOMENDAÇÃO FINAL PARA ETAPA 2:" -ForegroundColor Cyan

if ($criticalFailures.Count -eq 0) {
    Write-Host "  🎉 TODOS endpoints críticos OK!" -ForegroundColor Green
    Write-Host "  🏭 API PRONTA para implementação da Etapa 2" -ForegroundColor Green
    Write-Host "  🚀 Pode iniciar desenvolvimento com segurança" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Próximos passos recomendados:"
    Write-Host "  1. Iniciar monitoramento contínuo" -ForegroundColor Gray
    Write-Host "  2. Implementar Fase 1: Polling Inteligente" -ForegroundColor Gray
    Write-Host "  3. Configurar Redis para cache multi-nível" -ForegroundColor Gray
} elseif ($criticalFailures.Count -le 2) {
    Write-Host "  ⚠️  ALERTA: Alguns endpoints críticos falharam:" -ForegroundColor Yellow
    Write-Host "     $($criticalFailures -join ', ')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  🔧 AÇÃO RECOMENDADA:"
    Write-Host "  1. Corrigir endpoints com falhas ANTES de iniciar Etapa 2" -ForegroundColor Gray
    Write-Host "  2. Verificar logs da API: apps\api\logs\" -ForegroundColor Gray
    Write-Host "  3. Testar endpoints manualmente após correções" -ForegroundColor Gray
    Write-Host "  4. Re-executar este teste para validação" -ForegroundColor Gray
} else {
    Write-Host "  ❌ CRÍTICO: MÚLTIPLOS endpoints falharam:" -ForegroundColor Red
    Write-Host "     $($criticalFailures -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "  🛑 AÇÃO IMEDIATA REQUERIDA:"
    Write-Host "  1. PARAR qualquer implementação da Etapa 2" -ForegroundColor Red
    Write-Host "  2. Investigar causa raiz das falhas" -ForegroundColor Gray
    Write-Host "  3. Corrigir problemas na API primeiro" -ForegroundColor Gray
    Write-Host "  4. Validar correções com teste completo" -ForegroundColor Gray
    Write-Host "  5. SÓ iniciar Etapa 2 após API estável" -ForegroundColor Gray
}

# Sugestão de monitoramento
Write-Host ""
Write-Host "📈 SUGESTÃO DE MONITORAMENTO:" -ForegroundColor Gray
Write-Host "  Para monitoramento contínuo durante implementação:" -ForegroundColor Gray
Write-Host "  .\scripts\iniciar-monitoramento-etapa2.ps1" -ForegroundColor Gray
Write-Host "  (Escolha opção 1 para foco absoluto em produção)" -ForegroundColor DarkGray

exit $(if ($criticalFailures.Count -eq 0) { 0 } else { 1 })