# Product Catalog — Routes (Integration Module)

## 📘 Read-models (GET)

### 🔹 Catálogo completo (técnico)
GET /v1/admin/read/products/catalog

Descrição:
Retorna o espelho local completo do catálogo com filtros, paginação e ordenação.

Uso:
- Operacional
- Admin
- Debug

---

### 🔹 Produto por código
GET /v1/admin/read/products/catalog/:productCode

Descrição:
Retorna dados detalhados de um produto específico.

---

### 🔹 Estatísticas do catálogo
GET /v1/admin/read/products/catalog/stats

Descrição:
Retorna agregações do catálogo:
- total
- ativos
- inativos
- último sync

---

### 🔹 Catálogo resumido (leve)
GET /v1/products/catalog/summary

Descrição:
Versão simplificada do catálogo para consumo leve pela API2.

Campos:
- productCode
- description
- sku
- active
- family
- unit
- lastSyncAt

---

### 🔹 Catálogo pronto para produção (API2)
GET /v1/products/catalog/production-ready

Descrição:
Endpoint principal para consumo em produção.

Retorna:
- produto
- estoque
- disponibilidade
- estrutura (metadados)

---

### 🔹 Query Params

q                 string
onlyActive        boolean (default: true)
onlyInStock       boolean (default: false)
minStock          number  (default: 0)
limit             number  (default: 100)
offset            number  (default: 0)
sort              description | productCode | stock | lastSyncAt
order             asc | desc
withAvailability  boolean (default: true)

---

### 🔹 Payload

{
  "productCode": "55P",
  "description": "Produto",
  "sku": null,
  "active": true,
  "family": null,
  "unit": "UND",
  "lastSyncAt": "...",

  "stock": 120,
  "minimumStock": 10,
  "available": true,

  "hasStructure": true,
  "structureItemsCount": 8
}

---

### 🔹 Regras

- Não retorna dados do Omie diretamente
- Não retorna estrutura completa (somente metadados)
- Otimizado para API2
- Baixa latência

---

### 🔹 Status de sync
GET /v1/integration/product-catalog/sync-status/:externalRequestId

Descrição:
Retorna status de execução:
- ACCEPTED
- CONFIRMED
- FAILED

---

### 🔹 Histórico de sync
GET /v1/integration/product-catalog/sync-history

Descrição:
Lista execuções recentes do sync.

---

### 🔹 Sync com falhas
GET /v1/integration/product-catalog/sync-failures

Descrição:
Lista comandos com erro.

---

### 🔹 Último sync global
GET /v1/integration/product-catalog/last-sync

Descrição:
Retorna último sync global executado.

---

## 🚀 Comandos (POST)

### 🔹 Sync de produto
POST /v1/integration/product-catalog/:productCode/sync

Descrição:
Sincroniza um produto específico.

---

### 🔹 Sync global
POST /v1/integration/product-catalog/sync-global

Descrição:
Sincroniza todo o catálogo.

Comportamento:
- Paginado (Omie)
- Idempotente
- Retry automático
- Controle de concorrência (lock)
- Tratamento de erro de paginação

Payload:
{
  "externalRequestId": "opcional"
}

---

## ⚙️ Admin / Controle

### 🔹 Status do lock
GET /v1/admin/product-catalog/lock-status

Descrição:
Indica se há sync global em execução.

---

### 🔹 Liberar lock
POST /v1/admin/product-catalog/release-lock

Descrição:
Remove lock manualmente em caso de falha.

---

## ✅ Observações

- /admin/read → endpoints técnicos
- /products → endpoints de contrato (API2)
- API2 nunca deve acessar Omie
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