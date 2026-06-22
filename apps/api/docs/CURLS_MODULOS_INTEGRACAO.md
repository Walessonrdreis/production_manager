# 🌀 Curl Commands — Módulos de Integração

> **Base:** `http://localhost:3333`
> **Última atualização:** 22/06/2026
>
> Comandos organizados por módulo. Todos os endpoints de comando retornam **202 Accepted**.
> Endpoints marcados com 🔴 **Fake Only** só funcionam com gateway `fake`.

---

## 📋 Índice

- [1️⃣ customer-sync](#1️⃣-customer-sync)
- [2️⃣ product-catalog](#2️⃣-product-catalog)
- [3️⃣ product-stock-fetch](#3️⃣-product-stock-fetch)
- [4️⃣ product-structure](#4️⃣-product-structure)
- [5️⃣ production-orders](#5️⃣-production-orders)
- [6️⃣ sales-order-sync](#6️⃣-sales-order-sync)
- [📊 Meta / Health Check](#-meta--health-check)

---

## 1️⃣ customer-sync 🔄

### Commands

```bash
# Sync global (com parâmetros opcionais)
curl -s -X POST http://localhost:3333/v1/integration/customer-sync/sync-global

# Sync global com parâmetros
curl -s -X POST http://localhost:3333/v1/integration/customer-sync/sync-global \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"sync-$(date +%s)","pageSize":100,"maxPages":10}'

# Sync de 1 cliente específico
curl -s -X POST "http://localhost:3333/v1/integration/customer-sync/CLIENTE123/sync" \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"sync-cliente-$(date +%s)"}'
```

### Read-Models

```bash
# Listar todos os clientes
curl -s http://localhost:3333/v1/admin/read/customers

# Cliente específico
curl -s "http://localhost:3333/v1/admin/read/customers/CLIENTE123"

# Estatísticas
curl -s http://localhost:3333/v1/admin/read/customers/stats

# Status de sync
curl -s "http://localhost:3333/v1/integration/customer-sync/sync-status/SEU_EXTERNAL_REQUEST_ID"

# Histórico de sync
curl -s "http://localhost:3333/v1/integration/customer-sync/sync-history?limit=10"

# Falhas de sync
curl -s "http://localhost:3333/v1/integration/customer-sync/sync-failures?limit=10"

# Último sync
curl -s http://localhost:3333/v1/integration/customer-sync/last-sync

# Sumário (API 2)
curl -s http://localhost:3333/v1/customers/summary
```

---

## 2️⃣ product-catalog 🔄

### Commands

```bash
# Sync global
curl -s -X POST http://localhost:3333/v1/integration/product-catalog/sync-global

# Sync global com parâmetros
curl -s -X POST http://localhost:3333/v1/integration/product-catalog/sync-global \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"sync-$(date +%s)","pageSize":100,"maxPages":10}'

# Sync de 1 produto específico
curl -s -X POST "http://localhost:3333/v1/integration/product-catalog/PROD001/sync" \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"sync-prod-$(date +%s)"}'
```

### Read-Models

```bash
# Listar catálogo de produtos
curl -s "http://localhost:3333/v1/admin/read/products/catalog"

# Produto específico
curl -s "http://localhost:3333/v1/admin/read/products/catalog/PROD001"

# Estatísticas do catálogo
curl -s http://localhost:3333/v1/admin/read/products/catalog/stats

# Status de sync
curl -s "http://localhost:3333/v1/integration/product-catalog/sync-status/SEU_EXTERNAL_REQUEST_ID"

# Histórico de sync
curl -s "http://localhost:3333/v1/integration/product-catalog/sync-history?limit=10"

# Falhas de sync
curl -s "http://localhost:3333/v1/integration/product-catalog/sync-failures?limit=10"

# Último sync
curl -s http://localhost:3333/v1/integration/product-catalog/last-sync

# Sumário (API 2)
curl -s http://localhost:3333/v1/products/catalog/summary

# Produtos aptos para produção
curl -s "http://localhost:3333/v1/products/catalog/production-ready?onlyActive=true&onlyInStock=true&limit=20"
```

---

## 3️⃣ product-stock-fetch 🔄

### Commands

```bash
# Sync global (incremental)
curl -s -X POST http://localhost:3333/v1/integration/product-stock-fetch/sync-global

# Sync global com parâmetros
curl -s -X POST http://localhost:3333/v1/integration/product-stock-fetch/sync-global \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"stock-sync-$(date +%s)","pageSize":100}'

# Refresh de 1 produto
curl -s -X POST http://localhost:3333/v1/integration/product-stock-fetch/refresh \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"refresh-$(date +%s)","productId":"PROD001"}'
```

### Read-Models

```bash
# Posição de estoque (consulta Omie em tempo real)
curl -s "http://localhost:3333/v1/integration/product-stock-fetch/position?productId=PROD001"
```

---

## 4️⃣ product-structure ⚙️

### Commands

```bash
# Sync global
curl -s -X POST http://localhost:3333/v1/integration/product-structure/sync-global

# Sync global com parâmetros
curl -s -X POST http://localhost:3333/v1/integration/product-structure/sync-global \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"struct-sync-$(date +%s)","pageSize":50}'

# Sync de 1 produto específico (busca estrutura da Omie)
curl -s -X POST "http://localhost:3333/v1/integration/product-structure/PROD001/sync" \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"sync-struct-$(date +%s)"}'

# Aplicar estrutura (BOM) no Omie
curl -s -X POST "http://localhost:3333/v1/integration/product-structure/PROD001/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "externalRequestId":"apply-$(date +%s)",
    "structure": {
      "items": [
        {"componentCode":"COMP001","quantity":2},
        {"componentCode":"COMP002","quantity":5}
      ]
    }
  }'

# Excluir estrutura (BOM) no Omie
curl -s -X POST "http://localhost:3333/v1/integration/product-structure/PROD001/delete" \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"delete-$(date +%s)"}'

# ⚠️ submit — 501 Not Implemented (use /apply)
```

### Read-Models

```bash
# Sumário de estruturas espelhadas
curl -s "http://localhost:3333/v1/integration/product-structure/summary?onlyWithStructure=true"

# Status de comando (sync/apply/delete)
curl -s "http://localhost:3333/v1/integration/product-structure/sync-status/SEU_EXTERNAL_REQUEST_ID"

# Production readiness
curl -s "http://localhost:3333/v1/admin/read/products/production-readiness?onlyWithoutStructure=false&limit=20"
```

---

## 5️⃣ production-orders ⚙️

### Commands

```bash
# Criar ordem de produção
curl -s -X POST http://localhost:3333/v1/integration/production-order \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PROD001",
    "quantity": 100,
    "externalRequestId": "op-$(date +%s)",
    "scheduledDate": "2026-07-01T00:00:00.000Z",
    "notes": "Ordem de produção urgente"
  }'

# 🔴 Falhar OP (Fake Only)
curl -s -X POST "http://localhost:3333/v1/integration/production-order/SEU_EXTERNAL_REQUEST_ID/fail" \
  -H "Content-Type: application/json" \
  -d '{"code":"ESTOQUE_INSUFICIENTE","message":"Sem estoque disponível"}'

# Sync global (espelhar OPs do Omie)
curl -s -X POST http://localhost:3333/v1/integration/production-order/sync-global

# Sync global com parâmetros
curl -s -X POST http://localhost:3333/v1/integration/production-order/sync-global \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"op-sync-$(date +%s)","pageSize":50,"maxPages":10}'
```

### Read-Models

```bash
# Status de integração da OP
curl -s "http://localhost:3333/v1/integration/production-order/SEU_EXTERNAL_REQUEST_ID"

# 🔴 Confirmar OP (Fake Only)
curl -s -X POST "http://localhost:3333/v1/integration/production-order/SEU_EXTERNAL_REQUEST_ID/confirm" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 6️⃣ sales-order-sync 🔄

### Commands

```bash
# Sync global
curl -s -X POST http://localhost:3333/v1/integration/sales-order-sync/sync-global

# Sync global com parâmetros
curl -s -X POST http://localhost:3333/v1/integration/sales-order-sync/sync-global \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId":"sales-sync-$(date +%s)","pageSize":100,"maxPages":5}'
```

### Read-Models

```bash
# Listar pedidos resumidos
curl -s "http://localhost:3333/v1/admin/read/sales-orders?limit=20"

# Estatísticas agregadas
curl -s http://localhost:3333/v1/admin/read/sales-orders/stats

# Histórico de transições
curl -s "http://localhost:3333/v1/admin/read/sales-orders/transitions?limit=20"

# Transições de 1 pedido específico
curl -s "http://localhost:3333/v1/admin/read/sales-orders/12345/transitions"

# Itens em aberto (separação/expedição)
curl -s "http://localhost:3333/v1/admin/read/sales-orders/open-items?limit=20"

# Status de sync
curl -s "http://localhost:3333/v1/integration/sales-order-sync/sync-status/SEU_EXTERNAL_REQUEST_ID"
```

---

## 📊 Meta / Health Check

```bash
# Health check
curl -s http://localhost:3333/health

# Raiz da API
curl -s http://localhost:3333/
```

---

## 🧪 Script de Teste Rápido (Todos os Módulos)

```bash
#!/bin/bash
# test-all-modules.sh — Testa todos os módulos de integração

BASE="http://localhost:3333"
echo "🧪 Testando todos os módulos de integração..."
echo ""

echo "=== 1️⃣ customer-sync ==="
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/v1/integration/customer-sync/sync-global" -H "Content-Type: application/json" -d '{}'
echo " → POST sync-global"
curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/admin/read/customers"
echo " → GET customers"

echo ""
echo "=== 2️⃣ product-catalog ==="
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/v1/integration/product-catalog/sync-global" -H "Content-Type: application/json" -d '{}'
echo " → POST sync-global"
curl -s -o /dev/null -w "%{http_code}" "$BASE/v1/admin/read/products/catalog"
echo " → GET products/catalog"

echo ""
echo "=== 3️⃣ product-stock-fetch ==="
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/v1/integration/product-stock-fetch/sync-global" -H "Content-Type: application/json" -d '{}'
echo " → POST sync-global"

echo ""
echo "=== 4️⃣ product-structure ==="
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/v1/integration/product-structure/sync-global" -H "Content-Type: application/json" -d '{}'
echo " → POST sync-global"

echo ""
echo "=== 5️⃣ production-orders ==="
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/v1/integration/production-order" -H "Content-Type: application/json" -d "{\"productId\":\"TEST\",\"quantity\":1,\"externalRequestId\":\"test-$(date +%s)\"}"
echo " → POST production-order"

echo ""
echo "=== 6️⃣ sales-order-sync ==="
curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/v1/integration/sales-order-sync/sync-global" -H "Content-Type: application/json" -d '{}'
echo " → POST sync-global"

echo ""
echo "=== 📊 Health ==="
curl -s -o /dev/null -w "%{http_code}" "$BASE/health"
echo " → GET health"
echo ""
echo "✅ Teste concluído!"
```

---

> 💡 **Porta:** Altere `3333` se a API rodar em outra porta.
