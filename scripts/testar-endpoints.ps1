# Script de Teste Automático - Endpoints da API
# Execute: .\scripts\testar-endpoints.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "TESTE AUTOMATICO DE ENDPOINTS - API" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Data: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Configuracoes
$baseUrl = "http://localhost:3333"
$testResults = @()
$totalTests = 0
$passedTests = 0
$failedTests = 0

# Funcao para testar endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [string]$ExpectedStatus = "200",
        [string]$Description = "",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    $totalTests++
    $testId = "TEST-$totalTests"
    
    Write-Host "[$testId] Testando: $Name" -ForegroundColor Yellow
    if ($Description) {
        Write-Host "   Descricao: $Description" -ForegroundColor Gray
    }
    
    try {
        $url = "$baseUrl$Path"
        $headersTable = @{}
        
        # Adicionar headers padrao
        $headersTable["Content-Type"] = "application/json"
        
        # Adicionar headers personalizados
        foreach ($key in $Headers.Keys) {
            $headersTable[$key] = $Headers[$key]
        }
        
        # Preparar parametros do Invoke-RestMethod
        $params = @{
            Method = $Method
            Uri = $url
            Headers = $headersTable
            TimeoutSec = 10
        }
        
        # Adicionar body se fornecido
        if ($Body) {
            $params["Body"] = $Body
        }
        
        # Executar a requisicao
        $response = Invoke-RestMethod @params -ErrorAction Stop
        $statusCode = 200  # Invoke-RestMethod nao retorna status code diretamente
        
        # Verificar se a resposta tem estrutura esperada
        $hasData = $response -and ($response.data -ne $null -or $response -is [array])
        
        if ($hasData) {
            Write-Host "   ✅ OK - Status: $ExpectedStatus" -ForegroundColor Green
            $passedTests++
            
            $testResults += @{
                Id = $testId
                Name = $Name
                Status = "PASS"
                Expected = $ExpectedStatus
                Actual = "200"
                URL = $url
                Message = "Endpoint funcionando corretamente"
            }
            
            return $true
        } else {
            Write-Host "   ⚠️  ATENCAO - Resposta inesperada" -ForegroundColor Yellow
            $failedTests++
            
            $testResults += @{
                Id = $testId
                Name = $Name
                Status = "WARN"
                Expected = "Estrutura de dados"
                Actual = "Estrutura diferente"
                URL = $url
                Message = "Endpoint responde mas estrutura pode estar diferente"
            }
            
            return $false
        }
        
    } catch {
        $errorMessage = $_.Exception.Message
        
        # Tentar extrair status code do erro
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "   ✅ OK - Status esperado: $ExpectedStatus" -ForegroundColor Green
            $passedTests++
            
            $testResults += @{
                Id = $testId
                Name = $Name
                Status = "PASS"
                Expected = $ExpectedStatus
                Actual = $statusCode.ToString()
                URL = "$baseUrl$Path"
                Message = "Endpoint retornou status esperado"
            }
            
            return $true
        } else {
            Write-Host "   ❌ FALHA - Erro: $errorMessage" -ForegroundColor Red
            $failedTests++
            
            $testResults += @{
                Id = $testId
                Name = $Name
                Status = "FAIL"
                Expected = $ExpectedStatus
                Actual = if ($statusCode -gt 0) { $statusCode.ToString() } else { "Erro" }
                URL = "$baseUrl$Path"
                Message = $errorMessage
            }
            
            return $false
        }
    }
}

# Funcao para verificar se API esta rodando
function Test-API-Running {
    Write-Host "[PRE-TEST] Verificando se API esta rodando..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 5
        if ($response.ok -eq $true) {
            Write-Host "   ✅ API esta rodando em $baseUrl" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "   ❌ API NAO esta rodando em $baseUrl" -ForegroundColor Red
        Write-Host "   Execute: cd apps\api && pnpm dev" -ForegroundColor Yellow
        return $false
    }
    
    return $false
}

# =========================================
# EXECUCAO DOS TESTES
# =========================================

# Verificar se API esta rodando
if (-not (Test-API-Running)) {
    Write-Host ""
    Write-Host "❌ Nao foi possivel executar os testes." -ForegroundColor Red
    Write-Host "   Inicie a API primeiro: cd apps\api && pnpm dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "EXECUTANDO TESTES DE ENDPOINTS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Endpoints Meta (Sempre disponiveis)
Write-Host "=== ENDPOINTS META ===" -ForegroundColor Magenta

Test-Endpoint -Name "Health Check" -Method "GET" -Path "/health" -Description "Verifica se API esta saudavel"
Test-Endpoint -Name "API Index" -Method "GET" -Path "/" -Description "Pagina inicial da API"
Test-Endpoint -Name "V1 Routes" -Method "GET" -Path "/v1" -Description "Lista todas as rotas da versao 1"

# 2. Endpoints Publicos (BizChat)
Write-Host ""
Write-Host "=== ENDPOINTS PUBLICOS (BIZCHAT) ===" -ForegroundColor Magenta

Test-Endpoint -Name "Catalogo Publico" -Method "GET" -Path "/v1/products?page=1&pageSize=5" -Description "Lista produtos com estoque (publico)"
Test-Endpoint -Name "Busca Produtos" -Method "GET" -Path "/v1/products?q=cor&page=1&pageSize=5" -Description "Busca produtos por termo"
Test-Endpoint -Name "Pedidos Etapa 20" -Method "GET" -Path "/v1/orders?page=1&pageSize=5" -Description "Lista pedidos etapa 20 (publico)"
Test-Endpoint -Name "Clientes Sincronizados" -Method "GET" -Path "/v1/clients?page=1&pageSize=5" -Description "Lista clientes do Omie"

# 3. Endpoints Admin (Gerenciamento)
Write-Host ""
Write-Host "=== ENDPOINTS ADMIN (GERENCIAMENTO) ===" -ForegroundColor Magenta

Test-Endpoint -Name "Produtos Gerenciados" -Method "GET" -Path "/v1/admin/managed-products?page=1&pageSize=5" -Description "Lista produtos gerenciados"
Test-Endpoint -Name "Setores" -Method "GET" -Path "/v1/admin/sectors?page=1&pageSize=5" -Description "Lista setores de producao"
Test-Endpoint -Name "Planos Producao" -Method "GET" -Path "/v1/admin/plans?page=1&pageSize=5" -Description "Lista planos de producao"
Test-Endpoint -Name "Pedidos Admin" -Method "GET" -Path "/v1/admin/orders?page=1&pageSize=5" -Description "Lista pedidos (admin)"
Test-Endpoint -Name "Pedidos Stage20 Admin" -Method "GET" -Path "/v1/admin/orders/stage20?page=1&pageSize=5" -Description "Pedidos etapa 20 (admin)"
Test-Endpoint -Name "Pedidos Enriquecidos" -Method "GET" -Path "/v1/admin/orders/stage20/enriched?page=1&pageSize=5" -Description "Pedidos com dados cliente"

# 4. Endpoints Omie (Sincronizacao)
Write-Host ""
Write-Host "=== ENDPOINTS OMIE (SINCRONIZACAO) ===" -ForegroundColor Magenta

Test-Endpoint -Name "Produtos Omie" -Method "GET" -Path "/v1/admin/omie/products?page=1&pageSize=5" -Description "Lista produtos do Omie"
Test-Endpoint -Name "Categorias Omie" -Method "GET" -Path "/v1/admin/omie/categories" -Description "Lista categorias do Omie"
Test-Endpoint -Name "Estoque Omie" -Method "GET" -Path "/v1/admin/omie/stock" -Description "Informacoes de estoque"

# 5. Testes de Erro (Endpoints que devem falhar)
Write-Host ""
Write-Host "=== TESTES DE ERRO ESPERADOS ===" -ForegroundColor Magenta

Test-Endpoint -Name "Produto Inexistente" -Method "GET" -Path "/v1/products/999999999" -ExpectedStatus "404" -Description "Deve retornar 404 para produto nao existente"
Test-Endpoint -Name "Endpoint Inexistente" -Method "GET" -Path "/v1/nao-existe" -ExpectedStatus "404" -Description "Deve retornar 404 para endpoint nao existente"

# =========================================
# RELATORIO FINAL
# =========================================

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "RELATORIO DE TESTES" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 ESTATISTICAS:" -ForegroundColor Gray
Write-Host "   Total de testes: $totalTests" -ForegroundColor Gray
Write-Host "   Testes aprovados: $passedTests" -ForegroundColor Green
Write-Host "   Testes reprovados: $failedTests" -ForegroundColor Red

$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100) } else { 0 }

Write-Host ""
Write-Host "📈 TAXA DE SUCESSO: $successRate%" -ForegroundColor $(if ($successRate -ge 90) { "Green" } elseif ($successRate -ge 70) { "Yellow" } else { "Red" })

# Resumo por categoria
Write-Host ""
Write-Host "📋 RESUMO POR CATEGORIA:" -ForegroundColor Gray

$categories = @{
    "Meta" = $testResults | Where-Object { $_.Name -match "Health|API Index|V1 Routes" }
    "Publicos" = $testResults | Where-Object { $_.Name -match "Catalogo|Busca|Pedidos Etapa|Clientes" }
    "Admin" = $testResults | Where-Object { $_.Name -match "Produtos Gerenciados|Setores|Planos|Pedidos Admin" }
    "Omie" = $testResults | Where-Object { $_.Name -match "Produtos Omie|Categorias|Estoque" }
    "Erros" = $testResults | Where-Object { $_.Name -match "Inexistente" }
}

foreach ($category in $categories.Keys) {
    $tests = $categories[$category]
    if ($tests) {
        $passed = ($tests | Where-Object { $_.Status -eq "PASS" }).Count
        $total = $tests.Count
        $rate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100) } else { 0 }
        
        Write-Host "   $category : $passed/$total ($rate%)" -ForegroundColor $(if ($rate -ge 90) { "Green" } elseif ($rate -ge 70) { "Yellow" } else { "Red" })
    }
}

# Detalhes dos testes que falharam
$failed = $testResults | Where-Object { $_.Status -eq "FAIL" }
if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ TESTES QUE FALHARAM:" -ForegroundColor Red
    
    foreach ($test in $failed) {
        Write-Host "   [$($test.Id)] $($test.Name)" -ForegroundColor Red
        Write-Host "      URL: $($test.URL)" -ForegroundColor Gray
        Write-Host "      Esperado: $($test.Expected)" -ForegroundColor Gray
        Write-Host "      Obtido: $($test.Actual)" -ForegroundColor Gray
        Write-Host "      Mensagem: $($test.Message)" -ForegroundColor Gray
        Write-Host ""
    }
}

# Avisos
$warnings = $testResults | Where-Object { $_.Status -eq "WARN" }
if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  AVISOS:" -ForegroundColor Yellow
    
    foreach ($test in $warnings) {
        Write-Host "   [$($test.Id)] $($test.Name)" -ForegroundColor Yellow
        Write-Host "      Mensagem: $($test.Message)" -ForegroundColor Gray
    }
}

# =========================================
# RECOMENDACOES
# =========================================

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "RECOMENDACOES" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

if ($successRate -ge 90) {
    Write-Host "🎉 EXCELENTE! API esta funcionando corretamente." -ForegroundColor Green
    Write-Host "   Voce pode iniciar a Etapa 2 com confianca!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Proximos passos:" -ForegroundColor Gray
    Write-Host "   1. Inicie a Fase 1 (Polling Inteligente)" -ForegroundColor Gray
    Write-Host "   2. Teste os novos endpoints conforme forem implementados" -ForegroundColor Gray
    Write-Host "   3. Monitore os logs durante a implementacao" -ForegroundColor Gray
    
} elseif ($successRate -ge 70) {
    Write-Host "⚠️  ATENCAO: Alguns endpoints estao com problemas." -ForegroundColor Yellow
    Write-Host "   Recomendamos corrigir antes de iniciar a Etapa 2." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Acoes recomendadas:" -ForegroundColor Gray
    Write-Host "   1. Verifique os logs da API para erros" -ForegroundColor Gray
    Write-Host "   2. Confirme se o banco de dados esta acessivel" -ForegroundColor Gray
    Write-Host "   3. Teste manualmente os endpoints que falharam" -ForegroundColor Gray
    
} else {
    Write-Host "❌ CRITICO: A API esta com muitos problemas." -ForegroundColor Red
    Write-Host "   Nao inicie a Etapa 2 ate resolver os problemas." -ForegroundColor Red
    Write-Host ""
    Write-Host "   Urgencias:" -ForegroundColor Gray
    Write-Host "   1. Verifique se a API esta rodando corretamente" -ForegroundColor Gray
    Write-Host "   2. Confirme conexao com banco de dados" -ForegroundColor Gray
    Write-Host "   3. Verifique variaveis de ambiente no .env" -ForegroundColor Gray
    Write-Host "   4. Execute pnpm test para verificar testes unitarios" -ForegroundColor Gray
}

# =========================================
# COMANDOS PARA DIAGNOSTICO
# =========================================

Write-Host ""
Write-Host "🔧 COMANDOS PARA DIAGNOSTICO:" -ForegroundColor Gray

Write-Host "   1. Verificar logs da API:" -ForegroundColor Gray
Write-Host "      cd apps\api && pnpm dev" -ForegroundColor Gray

Write-Host "   2. Testes unitarios:" -ForegroundColor Gray
Write-Host "      cd apps\api && pnpm test" -ForegroundColor Gray

Write-Host "   3. Verificar banco de dados:" -ForegroundColor Gray
Write-Host "      cd apps\api && npx prisma studio" -ForegroundColor Gray

Write-Host "   4. Verificar jobs agendados:" -ForegroundColor Gray
Write-Host "      Verifique o console onde a API esta rodando" -ForegroundColor Gray

Write-Host "   5. Testar endpoints manualmente:" -ForegroundColor Gray
Write-Host "      curl http://localhost:3333/v1/products" -ForegroundColor Gray
Write-Host "      curl http://localhost:3333/v1/orders" -ForegroundColor Gray

# =========================================
# EXPORTAR RESULTADOS (OPCIONAL)
# =========================================

$exportFile = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$testResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $exportFile -Encoding UTF8

Write-Host ""
Write-Host "💾 Resultados exportados para: $exportFile" -ForegroundColor Gray
Write-Host "   Use este arquivo para analise detalhada ou compartilhamento." -ForegroundColor Gray

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "FIM DOS TESTES" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

exit $(if ($successRate -ge 90) { 0 } else { 1 })