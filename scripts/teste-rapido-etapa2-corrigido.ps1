# Teste Rápido - Endpoints Críticos Etapa 2 (Produção) - Versão Corrigida
# Validação rápida antes de iniciar implementação

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   TESTE RAPIDO - ETAPA 2 (PRODUCAO)    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configuração
$baseUrl = "http://localhost:3333"
$timeout = 5  # segundos para endpoints normais
$syncTimeout = 30  # segundos para endpoints de sincronização

# Endpoints CRÍTICOS para Etapa 2 - Prioridade MÁXIMA
$criticalEndpoints = @(
    # 1. SISTEMA (Fundamental)
    @{Name="Health Check"; Path="/health"; ExpectedStatus=200; Category="System"; Priority=1},
    
    # 2. ESTOQUE (Atualização: 2 minutos) - ENDPOINTS CORRETOS
    @{Name="Lista Produtos Omie"; Path="/v1/admin/omie/products?page=1&pageSize=5"; ExpectedStatus=200; Category="Estoque"; Priority=1},
    @{Name="Refresh Estoque Omie (timeout curto)"; Path="/v1/admin/omie/products/stock/refresh"; ExpectedStatus=200; Category="Estoque"; Priority=1; Method="POST"},
    
    # 3. PEDIDOS VENDIDOS (Atualizado: 1 minuto)
    @{Name="Pedidos Stage 20"; Path="/v1/admin/orders/stage20?page=1&pageSize=5"; ExpectedStatus=200; Category="Pedidos"; Priority=1},
    @{Name="Totais Stage 20"; Path="/v1/admin/orders/stage20/totals"; ExpectedStatus=200; Category="Pedidos"; Priority=1},
    
    # 4. ORDENS PRODUCAO (Atualizado: 30 segundos)
    @{Name="Ordens Producao Omie"; Path="/v1/admin/omie/production-orders?page=1&pageSize=5"; ExpectedStatus=200; Category="Producao"; Priority=1},
    @{Name="Sync Ordens Producao (timeout curto)"; Path="/v1/admin/omie/production-orders/sync"; ExpectedStatus=200; Category="Producao"; Priority=1; Method="POST"},
    
    # 5. CATALOGO PUBLICO (Frontend)
    @{Name="Catalogo Publico"; Path="/v1/products?page=1&pageSize=5"; ExpectedStatus=200; Category="Catalogo"; Priority=2}
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
        
        # Preparar headers e body
        $headers = @{}
        $body = $null
        
        # Determinar timeout apropriado
        $currentTimeout = $timeout
        if ($endpointName -like "*sync*" -or $endpointName -like "*refresh*") {
            $currentTimeout = $syncTimeout
        }
        
        # Adicionar Content-Type para requisições POST
        if ($method -eq "POST") {
            $headers["Content-Type"] = "application/json"
            # Enviar corpo vazio para endpoints POST que podem esperar JSON
            $body = "{}"
        }
        
        # Fazer a requisição
        if ($body) {
            $response = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -Body $body -TimeoutSec $currentTimeout -UseBasicParsing
        } else {
            $response = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -TimeoutSec $currentTimeout -UseBasicParsing
        }
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
Write-Host "[1] Verificando conexao com API..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   OK - API conectada (status 200)" -ForegroundColor Green
        
        # Tentar parsear JSON para verificar se ok=true
        try {
            $healthData = $response.Content | ConvertFrom-Json
            if ($healthData.ok -eq $true) {
                Write-Host "   API completamente saudavel (ok=true)" -ForegroundColor Green
            } else {
                Write-Host "   ATENCAO - API responde mas ok=false" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   ATENCAO - Health check nao retorna JSON valido" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ERRO - API retornou status: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERRO - Nao foi possivel conectar a API" -ForegroundColor Red
    Write-Host "   Detalhes: $($_.Exception.Message)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Execute primeiro: cd apps\api && pnpm dev" -ForegroundColor Gray
    exit 1
}

# Testar endpoints críticos
Write-Host ""
Write-Host "[2] Testando endpoints CRITICOS da Etapa 2..." -ForegroundColor Magenta

$results = @()
$criticalFailures = @()

foreach ($endpoint in $criticalEndpoints) {
    Write-Host "   Testando: $($endpoint.Name) ($($endpoint.Category))..." -NoNewline
    
    $result = Test-Endpoint -Endpoint $endpoint
    
    switch ($result.Status) {
        "OK" {
            Write-Host " OK ($($result.ResponseTime) ms)" -ForegroundColor Green
        }
        "WARN" {
            Write-Host " ATENCAO: $($result.Details)" -ForegroundColor Yellow
            $criticalFailures += $endpoint.Name
        }
        "ERROR" {
            Write-Host " ERRO: $($result.Details)" -ForegroundColor Red
            $criticalFailures += $endpoint.Name
        }
    }
    
    $results += $result
    Start-Sleep -Seconds 0.5  # Pequena pausa para não sobrecarregar
}

# Resumo dos resultados
Write-Host ""
Write-Host "RESUMO DO TESTE - ETAPA 2:" -ForegroundColor Cyan

# Agrupar por categoria
$groupedResults = $results | Group-Object Category

foreach ($group in $groupedResults) {
    Write-Host ""
    Write-Host "  CATEGORIA: $($group.Name)" -ForegroundColor White
    
    $catOk = ($group.Group | Where-Object { $_.Status -eq "OK" }).Count
    $catTotal = $group.Group.Count
    $catRate = [math]::Round(($catOk / $catTotal) * 100, 1)
    
    foreach ($result in $group.Group) {
        $statusIcon = switch ($result.Status) {
            "OK" { "[OK]" }
            "WARN" { "[ATENCAO]" }
            "ERROR" { "[ERRO]" }
            default { "[?]" }
        }
        
        Write-Host "    $statusIcon $($result.Name)" -ForegroundColor Gray
        if ($result.Status -ne "OK") {
            Write-Host "      $($result.Details)" -ForegroundColor DarkGray
        }
    }
    
    $color = if ($catOk -eq $catTotal) { "Green" } elseif ($catOk -ge ($catTotal * 0.7)) { "Yellow" } else { "Red" }
    Write-Host "    ESTATISTICA: $catOk/$catTotal OK ($catRate%)" -ForegroundColor $color
}

# Estatísticas gerais
$okCount = ($results | Where-Object { $_.Status -eq "OK" }).Count
$totalCount = $results.Count
$successRate = [math]::Round(($okCount / $totalCount) * 100, 1)

Write-Host ""
Write-Host "ESTATISTICAS GERAIS:" -ForegroundColor Magenta

$colorGeneral = if ($okCount -eq $totalCount) { "Green" } elseif ($okCount -ge ($totalCount * 0.7)) { "Yellow" } else { "Red" }
Write-Host "  OK: $okCount/$totalCount endpoints funcionando" -ForegroundColor $colorGeneral
Write-Host "  TAXA DE SUCESSO: $successRate%" -ForegroundColor Gray
Write-Host "  CATEGORIAS TESTADAS: $($groupedResults.Count) categorias" -ForegroundColor Gray

# Tempo médio de resposta
$responseTimes = @()
foreach ($result in $results) {
    if ($result.ResponseTime -gt 0) {
        $responseTimes += $result.ResponseTime
    }
}

if ($responseTimes.Count -gt 0) {
    $sum = 0
    foreach ($time in $responseTimes) {
        $sum += $time
    }
    $avgResponseTime = [math]::Round($sum / $responseTimes.Count, 2)
    Write-Host "  TEMPO MEDIO DE RESPOSTA: $avgResponseTime ms" -ForegroundColor Gray
} else {
    Write-Host "  TEMPO MEDIO DE RESPOSTA: N/A (nenhum endpoint respondeu)" -ForegroundColor Yellow
}

# Recomendação final
Write-Host ""
Write-Host "RECOMENDACAO FINAL PARA ETAPA 2:" -ForegroundColor Cyan

if ($criticalFailures.Count -eq 0) {
    Write-Host "  SUCESSO - TODOS endpoints criticos OK!" -ForegroundColor Green
    Write-Host "  API PRONTA para implementacao da Etapa 2" -ForegroundColor Green
    Write-Host "  Pode iniciar desenvolvimento com seguranca" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Proximos passos recomendados:"
    Write-Host "  1. Iniciar monitoramento continuo" -ForegroundColor Gray
    Write-Host "  2. Implementar Fase 1: Polling Inteligente" -ForegroundColor Gray
    Write-Host "  3. Configurar Redis para cache multi-nivel" -ForegroundColor Gray
} elseif ($criticalFailures.Count -le 2) {
    Write-Host "  ALERTA - Alguns endpoints criticos falharam:" -ForegroundColor Yellow
    Write-Host "     $($criticalFailures -join ', ')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  ACAO RECOMENDADA:"
    Write-Host "  1. Corrigir endpoints com falhas ANTES de iniciar Etapa 2" -ForegroundColor Gray
    Write-Host "  2. Verificar logs da API: apps\api\logs\" -ForegroundColor Gray
    Write-Host "  3. Testar endpoints manualmente apos correcoes" -ForegroundColor Gray
    Write-Host "  4. Re-executar este teste para validacao" -ForegroundColor Gray
} else {
    Write-Host "  CRITICO - MULTIPLOS endpoints falharam:" -ForegroundColor Red
    Write-Host "     $($criticalFailures -join ', ')" -ForegroundColor Red
    Write-Host ""
    Write-Host "  ACAO IMEDIATA REQUERIDA:"
    Write-Host "  1. PARAR qualquer implementacao da Etapa 2" -ForegroundColor Red
    Write-Host "  2. Investigar causa raiz das falhas" -ForegroundColor Gray
    Write-Host "  3. Corrigir problemas na API primeiro" -ForegroundColor Gray
    Write-Host "  4. Validar correcoes com teste completo" -ForegroundColor Gray
    Write-Host "  5. SO iniciar Etapa 2 apos API estavel" -ForegroundColor Gray
}

# Sugestão de monitoramento
Write-Host ""
Write-Host "SUGESTAO DE MONITORAMENTO:" -ForegroundColor Gray
Write-Host "  Para monitoramento continuo durante implementacao:" -ForegroundColor Gray
Write-Host "  .\scripts\iniciar-monitoramento-etapa2.ps1" -ForegroundColor Gray
Write-Host "  (Escolha opcao 1 para foco absoluto em producao)" -ForegroundColor DarkGray

exit $(if ($criticalFailures.Count -eq 0) { 0 } else { 1 })