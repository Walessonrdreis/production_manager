# Product Catalog — Routes

## 🚀 Comandos (POST)

### Sync de 1 produto
```
POST /v1/integration/product-catalog/commands/sync
```
**Payload:**
```json
{ "externalRequestId": "opcional", "productCode": "obrigatorio" }
```

---

### Sync global
```
POST /v1/integration/product-catalog/commands/sync-global
```
**Payload:**
```json
{ "externalRequestId": "opcional" }
```

---

### Refresh production-ready
```
POST /v1/admin/product-catalog/refresh-production-ready
```
**Payload:**
```json
{ "externalRequestId": "opcional" }
```

---

## 📘 Read-models (GET)

### Catálogo completo
```
GET /v1/admin/read/products/catalog
```
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `q` | string | Busca por descrição, código ou SKU |
| `activeOnly` | boolean | `true` = apenas ativos |
| `view` | string | `summary` ou `data` |
| `limit` | number | Máx. itens (default: 100) |
| `offset` | number | Deslocamento |
| `sort` | string | `description`, `productCode`, `lastSyncAt` |
| `order` | string | `asc`, `desc` |

---

### Produto específico
```
GET /v1/admin/read/products/catalog/:productCode
```

---

### Estatísticas
```
GET /v1/admin/read/products/catalog/stats
```
**Resposta:**
```json
{ "success": true, "data": { "total": 1697, "active": 1500, "inactive": 197 } }
```

---

### Catálogo resumido (API2)
```
GET /v1/integration/product-catalog/read/summary
```
Campos: `productCode`, `description`, `sku`, `active`, `family`, `unit`, `lastSyncAt`

---

### Production-ready (API2)
```
GET /v1/integration/product-catalog/read/production-ready
```
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `q` | string | Busca por descrição, código ou SKU |
| `onlyActive` | boolean | (default: true) |
| `onlyInStock` | boolean | (default: false) |
| `minStock` | number | (default: 0) |
| `limit` | number | Máx. itens (default: 100) |
| `offset` | number | Deslocamento |
| `sort` | string | `description`, `productCode`, `stock`, `lastSyncAt` |
| `order` | string | `asc`, `desc` |
| `withAvailability` | boolean | (default: true) |

---

### Status do sync
```
GET /v1/integration/product-catalog/commands/:externalRequestId
```
| Status | Significado |
|--------|-------------|
| `ACCEPTED` | Processando |
| `CONFIRMED` | Concluído |
| `FAILED` | Falhou |

---

### Histórico
```
GET /v1/integration/product-catalog/read/sync-history?limit=20
```

---

### Falhas
```
GET /v1/integration/product-catalog/read/sync-failures?limit=20
```

---

### Último sync
```
GET /v1/integration/product-catalog/read/last-sync
```
- Fake gateway não escreve dados reais
- Estrutura completa deve ser consumida pelo módulo product-structure

---

## ✅ Papel do módulo

Este módulo é responsável por:

- Integrar com Omie (API1)
- Manter espelho local do catálogo
- Consolidar dados de produto + estoque + estrutura
- Expor dados prontos para API2

---

## 🧠 TL;DR

Este módulo não é apenas sync.

Ele é:

✔ Anti-Corruption Layer do Omie  
✔ Fonte única de catálogo interno  
✔ Endpoint de produção para API2  
✔ Base para decisões de negócio