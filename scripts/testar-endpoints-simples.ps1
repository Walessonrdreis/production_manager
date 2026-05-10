# Script de Teste Simplificado - Endpoints da API
# Execute: .\scripts\testar-endpoints-simples.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "TESTE SIMPLIFICADO DE ENDPOINTS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3333"
$tests = @()

# Funcao simples para testar
function Test-Simple {
    param($Name, $Path)
    
    Write-Host "[Testando] $Name" -ForegroundColor Yellow
    Write-Host "  URL: $baseUrl$Path" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$Path" -Method GET -TimeoutSec 5
        Write-Host "  ✅ OK - Status: $($response.StatusCode)" -ForegroundColor Green
        $tests += @{Name=$Name; Status="PASS"; Code=$response.StatusCode}
        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  ❌ ERRO - Status: $statusCode" -ForegroundColor Red
        $tests += @{Name=$Name; Status="FAIL"; Code=$statusCode}
        return $false
    }
}

# Verificar se API esta rodando
Write-Host "[1] Verificando se API esta rodando..." -ForegroundColor Magenta
try {
    $health = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -TimeoutSec 3
    if ($health.StatusCode -eq 200) {
        $healthJson = $health.Content | ConvertFrom-Json
        if ($healthJson.ok -eq $true) {
            Write-Host "  ✅ API esta rodando!" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  API responde mas ok=false" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "  ❌ API NAO esta rodando em $baseUrl" -ForegroundColor Red
    Write-Host "  Execute primeiro: cd apps\api && pnpm dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2] Testando endpoints principais..." -ForegroundColor Magenta

# Testes basicos
Test-Simple -Name "Pagina Inicial" -Path "/"
Test-Simple -Name "Lista de Rotas V1" -Path "/v1"
Test-Simple -Name "Catalogo Publico" -Path "/v1/products?page=1&pageSize=5"
Test-Simple -Name "Pedidos Etapa 20" -Path "/v1/orders?page=1&pageSize=5"
Test-Simple -Name "Clientes Sincronizados" -Path "/v1/clients?page=1&pageSize=5"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "RESUMO" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$passed = ($tests | Where-Object { $_.Status -eq "PASS" }).Count
$total = $tests.Count

Write-Host "Testes executados: $total" -ForegroundColor Gray
Write-Host "Testes aprovados: $passed" -ForegroundColor Green
Write-Host "Testes reprovados: $($total - $passed)" -ForegroundColor Red

if ($passed -eq $total) {
    Write-Host ""
    Write-Host "🎉 TODOS os endpoints estao funcionando!" -ForegroundColor Green
    Write-Host "   Voce pode iniciar a Etapa 2 com confianca." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Alguns endpoints estao com problemas." -ForegroundColor Yellow
    Write-Host "   Verifique se a API esta rodando corretamente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Comandos para diagnostico:" -ForegroundColor Gray
Write-Host "  1. Iniciar API: cd apps\api && pnpm dev" -ForegroundColor Gray
Write-Host "  2. Verificar logs: Observe o console da API" -ForegroundColor Gray
Write-Host "  3. Testar manual: curl http://localhost:3333/v1/products" -ForegroundColor Gray