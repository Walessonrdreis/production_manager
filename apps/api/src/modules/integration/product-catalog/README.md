# Product Catalog — Integration Module (API 1)

## 🎯 Responsabilidades

- Manter o espelho local do catálogo de produtos do Omie (`omie_product`)
- Manter o espelho de estoque (`product_stock`)
- Integrar com estrutura de produtos (`product_structure`)
- Consolidar dados operacionais em um read-model materializado de produção
- Expor read-models otimizados para API 2
- Permitir sincronização on-demand e global
- Garantir idempotência via `externalRequestId`
- Garantir desacoplamento do Omie
- Nunca chamar Omie em endpoints de leitura
- Nunca executar efeitos colaterais em read-models

---

## 📘 1. Read-models (GET)

### 🔹 Catálogo completo (técnico)

GET /v1/admin/read/products/catalog

- Filtros, paginação, ordenação
- Uso interno / técnico

---

### 🔹 Produto específico

GET /v1/admin/read/products/catalog/:productCode

- Consulta por código

---

### 🔹 Estatísticas do catálogo

GET /v1/admin/read/products/catalog/stats

---

### 🔹 Catálogo resumido (leve)

GET /v1/integration/product-catalog/read/summary

- Payload enxuto
- Uso simples pela API2

---

### 🔹 Catálogo pronto para produção

GET /v1/integration/product-catalog/read/production-ready

### Descrição

Endpoint principal para consumo pela API2.

Retorna catálogo consolidado com:
- dados básicos
- estoque
- disponibilidade
- indicação de estrutura (BOM)
- OP em aberto
- demanda vinda de pedido de venda em etapa 20
- status operacional pronto para consumo

### Campos

- productCode
- description
- sku
- active
- family
- unit
- lastSyncAt

- stock
- minimumStock
- belowMinimumStock
- available

- salePrice
- cost
- margin

- hasStructure
- structureItemsCount

- hasOpenProductionOrder
- openProductionOrderCount

- hasOpenSalesOrderStage20
- openSalesOrderStage20Count

- status

### Status possíveis

- READY
- READY_WITH_DEMAND
- NO_STOCK
- NO_STOCK_WITH_DEMAND
- NO_STRUCTURE
- INACTIVE

### Regras de status

- INACTIVE → produto inativo
- NO_STRUCTURE → produto ativo, mas sem estrutura
- NO_STOCK → produto com estrutura, mas não disponível
- NO_STOCK_WITH_DEMAND → produto sem disponibilidade e já presente em pedido de venda aprovado (etapa 20)
- READY_WITH_DEMAND → produto disponível e já presente em pedido de venda aprovado (etapa 20)
- READY → produto disponível, com estrutura e sem demanda aberta relevante

### Defaults do endpoint

Para evitar retornar payload vazio por padrão e facilitar debug:

- onlyActive = false
- withAvailability = false

Ou seja:
- o endpoint SEMPRE tenta mostrar dados
- filtros operacionais são opt-in via query params

### Regras

- NÃO retorna estrutura completa
- NÃO depende de múltiplos endpoints
- Lê somente da tabela materializada `product_catalog_production_ready_read_model`
- Otimizado para produção

### Observação operacional

Enquanto estoque, estrutura, OP e pedidos aprovados ainda não estiverem sincronizados/materializados, o endpoint continuará retornando os produtos, mas os campos operacionais poderão aparecer como:

- stock = 0
- available = false
- hasStructure = false
- hasOpenProductionOrder = false
- hasOpenSalesOrderStage20 = false

Isso é esperado e ajuda a diagnosticar quais sincronizações ainda faltam preencher.

---

### 🔹 Status de sync

GET /v1/integration/product-catalog/read/sync-status/:externalRequestId

---

### 🔹 Histórico de sync

GET /v1/integration/product-catalog/read/sync-history

---

### 🔹 Sync com falha

GET /v1/integration/product-catalog/read/sync-failures

---

### 🔹 Último sync global

GET /v1/integration/product-catalog/read/last-sync

---

## 🚀 2. Comandos de integração (POST)

---

### 🔹 Sync de produto

POST /v1/integration/product-catalog/commands/sync/:productCode

---

### 🔹 Sync global

POST /v1/integration/product-catalog/commands/sync-global

### Comportamento

- Processa todas páginas do Omie
- Idempotente por `externalRequestId`
- Trabalha com paginação real do Omie
- Usa retry por página
- Trata erro de paginação do Omie
- Pode disparar refresh do read-model `production-ready` após sync, se configurado

---

### 🔹 Refresh manual do read-model de produção

POST /v1/admin/product-catalog/refresh-production-ready

### Comportamento

- Recalcula a tabela `product_catalog_production_ready_read_model`
- Consolida:
  - catálogo
  - estoque
  - estrutura
  - OP aberta
  - pedidos de venda em etapa 20
- Não chama Omie diretamente
- Útil para debug, homologação e correção de dados materializados

---

## ⚙️ 3. Jobs / Admin

---

## 🔧 Ambiente

- PRODUCT_CATALOG_GATEWAY=fake | real
- ENABLE_OMIE_PRODUCT_CATALOG_SYNC_JOB=true | false
- OMIE_PRODUCT_CATALOG_SYNC_CRON=...
- ENABLE_OMIE_PRODUCT_CATALOG_PRODUCTION_READY_REFRESH_JOB=true | false
- OMIE_PRODUCT_CATALOG_PRODUCTION_READY_REFRESH_CRON=...
- FORCE_PRODUCTION_READY_REFRESH_ON_SYNC=true | false

---

## 🧠 Regras Arquiteturais

- API2 nunca chama Omie diretamente
- API1 centraliza integração
- Banco único com ownership por tipo de dado
- Dados do Omie ficam sempre em espelhos
- Read-model materializado é ownership exclusivo da API1
- Fake gateway não deve poluir mundo externo
- Endpoints `/products` são contrato de produção
- Endpoints `/admin/read` são técnicos

---

## 📦 Modelos principais

- omie_product → catálogo (espelho)
- product_stock → estoque consolidado
- product_structure → estrutura (BOM)
- product_catalog_command → controle de execução e idempotência
- product_catalog_production_ready_read_model → read-model materializado para consumo operacional

---

## ✅ Contrato do módulo

Este módulo é responsável por:

- Sincronizar catálogo de produtos do Omie
- Consolidar dados para uso interno
- Expor endpoints otimizados para API2
- Garantir estabilidade e consistência dos dados

---

## ⚠️ Importante

- API2 deve consumir preferencialmente `/v1/integration/product-catalog/read/production-ready`
- Estrutura completa NÃO está embutida no catálogo
- O endpoint production-ready só fica “rico” quando os espelhos auxiliares estiverem atualizados
- Mesmo com dados incompletos, o endpoint continua retornando produtos para facilitar debug e observabilidade

---

## 🚀 Exemplos práticos (curl)

### Sync de 1 produto

```bash
curl -X POST "http://localhost:3333/v1/integration/product-catalog/commands/sync/55P" \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId": "manual-55p-001"}'
```

### Sync global do catálogo

```bash
curl -X POST "http://localhost:3333/v1/integration/product-catalog/commands/sync-global" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Refresh do read-model production-ready

```bash
curl -X POST "http://localhost:3333/v1/admin/product-catalog/refresh-production-ready" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Catálogo completo com filtros

```bash
curl "http://localhost:3333/v1/admin/read/products/catalog?q=chocolate&activeOnly=true&limit=10&sort=description&order=asc"
```

### Production-ready com disponibilidade

```bash
curl "http://localhost:3333/v1/integration/product-catalog/read/production-ready?onlyActive=true&onlyInStock=true&limit=20"
```

### Status de um comando

```bash
curl "http://localhost:3333/v1/integration/product-catalog/read/sync-status/meu-request-id-123"
```

### Último sync global

```bash
curl "http://localhost:3333/v1/integration/product-catalog/read/last-sync"
```

### Histórico de comandos

```bash
curl "http://localhost:3333/v1/integration/product-catalog/read/sync-history?limit=5"
```

### Falhas de sincronização

```bash
curl "http://localhost:3333/v1/integration/product-catalog/read/sync-failures?limit=5"
```

---

## 🚀 Resultado

Este módulo funciona como:

✔ Anti-Corruption Layer do Omie  
✔ Fonte única de catálogo interno  
✔ Base de dados pronta para consumo da API2  
✔ Camada de integração resiliente e escalável  
✔ Read-model operacional com status de decisão