# Production Manager API — Status do Repositório

_Gerado automaticamente em **16/04/2026, 17:11:34**_

---

## 📌 Visão rápida

- Este arquivo é **atualizado automaticamente** (sobrescrito a cada execução).
- O contrato público da API é centrado em **GET /v1/products**.
- Para histórico técnico, veja `docs/history/*.metrics.json` (opcional).

---

## 📁 Estrutura (apps/api/src)

```
📄 src\app.ts
📁 src\contracts
📄 src\contracts\publicProducts.contract.ts
📁 src\controllers
📁 src\core
📁 src\core\errors
📄 src\core\errors\AppError.ts
📄 src\core\SyncOmieProductsService.ts
📄 src\db.ts
📄 src\env.ts
📁 src\integrations
📁 src\integrations\omie
📄 src\integrations\omie\OmieAdapter.ts
📄 src\integrations\omie\OmieClient.ts
📄 src\integrations\omie\OmieStockCache.ts
📁 src\jobs
📄 src\jobs\omieProductSync.job.ts
📄 src\jobs\stockRefresh.job.ts
📁 src\lib
📄 src\lib\errors.ts
📄 src\lib\http.ts
📄 src\lib\logger.ts
📁 src\middlewares
📁 src\plugins
📁 src\repositories
📄 src\repositories\PlanRepository.ts
📄 src\repositories\ProductRepository.ts
📄 src\repositories\SectorRepository.ts
📁 src\routes
📄 src\routes\index.ts
📄 src\routes\omie.ts
📄 src\routes\plans.ts
📄 src\routes\product-sector.ts
📄 src\routes\products.ts
📄 src\routes\sectors.ts
📄 src\server.ts
📁 src\services
📄 src\services\CreatePlanItemService.ts
📄 src\services\CreatePlanService.ts
📄 src\services\CreateSectorService.ts
📄 src\services\jobLock.service.ts
📄 src\services\omieProductRead.service.ts
📄 src\services\omieProductSync.service.ts
📄 src\services\omieStock.service.ts
📄 src\services\publicProductsRead.service.ts
📄 src\services\SetProductDefaultSectorService.ts
📄 src\services\stockRefresh.service.ts
📁 src\utils
📄 src\utils\backoff.ts
📄 src\utils\domainErrors.ts
📄 src\utils\errors.ts
```

---

## 📏 Linhas de código (LOC)

- **Arquivos analisados**: 37
- **Linhas (aprox.)**: 4.229

### Top arquivos (por linhas)
- `src\routes\omie.ts` — **567** linhas
- `src\routes\products.ts` — **543** linhas
- `src\services\omieProductSync.service.ts` — **356** linhas
- `src\core\SyncOmieProductsService.ts` — **299** linhas
- `src\routes\plans.ts` — **240** linhas
- `src\services\stockRefresh.service.ts` — **224** linhas
- `src\routes\index.ts` — **184** linhas
- `src\services\publicProductsRead.service.ts` — **176** linhas
- `src\routes\sectors.ts` — **156** linhas
- `src\lib\http.ts` — **141** linhas
- `src\app.ts` — **140** linhas
- `src\integrations\omie\OmieStockCache.ts` — **117** linhas
- `src\integrations\omie\OmieAdapter.ts` — **114** linhas
- `src\jobs\omieProductSync.job.ts` — **90** linhas
- `src\routes\product-sector.ts` — **86** linhas

---

## 💾 Tamanho por pasta/arquivo

- **Tamanho total (escopo)**: 180.64 KB

### Top pastas (por tamanho)
- `src\routes` — **59.87 KB** (6 arquivos)
- `scripts\metrics` — **39.45 KB** (14 arquivos)
- `src\services` — **29.94 KB** (10 arquivos)
- `src\core` — **9.71 KB** (2 arquivos)
- `prisma\migrations` — **9.54 KB** (11 arquivos)
- `src\integrations` — **7.43 KB** (3 arquivos)
- `src\jobs` — **5.01 KB** (2 arquivos)
- `src\app.ts` — **3.78 KB** (1 arquivos)
- `src\lib` — **3.24 KB** (3 arquivos)
- `src\repositories` — **3.14 KB** (3 arquivos)

### Top arquivos (por tamanho)
- `src\routes\products.ts` — **17.42 KB**
- `src\routes\omie.ts` — **17.24 KB**
- `scripts\metrics\render-reference.mjs` — **11.74 KB**
- `src\services\omieProductSync.service.ts` — **10.53 KB**
- `scripts\metrics\render-md.mjs` — **9.79 KB**
- `src\routes\index.ts` — **9.44 KB**
- `src\core\SyncOmieProductsService.ts` — **9.29 KB**
- `src\routes\plans.ts` — **7.66 KB**
- `src\services\stockRefresh.service.ts` — **6.72 KB**
- `src\services\publicProductsRead.service.ts` — **5.21 KB**

---

## 🌐 Endpoints (detecção heurística)

- **Total detectado (heurística)**: 78
- **GET**: 47
- **POST**: 18
- **PUT**: 3
- **PATCH**: 5
- **DELETE**: 5

### Preview de endpoints
```
DELETE /v1/admin/managed-products/:id  (src\routes\products.ts)
DELETE /v1/admin/products/:id  (src\routes\products.ts)
DELETE /v1/admin/sectors/:id  (src\routes\sectors.ts)
DELETE /v1/products/:id  (src\routes\products.ts)
DELETE /v1/sectors/:id  (src\routes\sectors.ts)
GET /  (src\routes\index.ts)
GET /health  (src\routes\index.ts)
GET /v1  (src\routes\index.ts)
GET /v1/admin/managed-products  (src\routes\products.ts)
GET /v1/admin/managed-products/:id  (src\routes\products.ts)
GET /v1/admin/managed-products/:id/stock  (src\routes\products.ts)
GET /v1/admin/managed-products/:id/stock/history  (src\routes\products.ts)
GET /v1/admin/managed-products/:productId/sector  (src\routes\product-sector.ts)
GET /v1/admin/omie/categories  (src\routes\omie.ts)
GET /v1/admin/omie/products  (src\routes\omie.ts)
GET /v1/admin/omie/products/:id  (src\routes\omie.ts)
GET /v1/admin/omie/products/:id/stock  (src\routes\omie.ts)
GET /v1/admin/omie/products/by-code/:omieCode  (src\routes\omie.ts)
GET /v1/admin/omie/products/by-code/:omieCode/stock  (src\routes\omie.ts)
GET /v1/admin/omie/products/search  (src\routes\omie.ts)
GET /v1/admin/omie/stock  (src\routes\omie.ts)
GET /v1/admin/plans  (src\routes\plans.ts)
GET /v1/admin/plans/:id  (src\routes\plans.ts)
GET /v1/admin/plans/:id/by-sector  (src\routes\plans.ts)
GET /v1/admin/plans/:id/export.csv  (src\routes\plans.ts)
GET /v1/admin/products  (src\routes\products.ts)
GET /v1/admin/products/:id  (src\routes\products.ts)
GET /v1/admin/products/:id/stock  (src\routes\products.ts)
GET /v1/admin/products/:id/stock/history  (src\routes\products.ts)
GET /v1/admin/products/:productId/sector  (src\routes\product-sector.ts)
GET /v1/admin/sectors  (src\routes\sectors.ts)
GET /v1/omie/categories  (src\routes\omie.ts)
GET /v1/omie/products  (src\routes\omie.ts)
GET /v1/omie/products/:id  (src\routes\omie.ts)
GET /v1/omie/products/:id/stock  (src\routes\omie.ts)
GET /v1/omie/products/by-code/:omieCode  (src\routes\omie.ts)
GET /v1/omie/products/by-code/:omieCode/stock  (src\routes\omie.ts)
GET /v1/omie/products/search  (src\routes\omie.ts)
GET /v1/omie/stock  (src\routes\omie.ts)
GET /v1/plans  (src\routes\plans.ts)
```
_(mostrando 40 de 78)_

---

## 🔎 Drift (docs vs código)

- **Documentados**: 46
- **Detectados no código**: 78

### Só nos docs (documentado, não detectado)
- `/v1/admin/products*`
- `/v1/omie/*`
- `/v1/plans*`
- `/v1/products/:omieCode`
- `/v1/sectors*`

### Só no código (detectado, não documentado)
- `/`
- `/health`
- `/v1/admin/omie/stock`
- `/v1/admin/products`
- `/v1/admin/products/:id`
- `/v1/admin/products/:id/stock`
- `/v1/admin/products/:id/stock/history`
- `/v1/admin/products/:productId/sector`
- `/v1/admin/products/bulk`
- `/v1/omie/categories`
- `/v1/omie/products`
- `/v1/omie/products/:id`
- `/v1/omie/products/:id/stock`
- `/v1/omie/products/by-code/:omieCode`
- `/v1/omie/products/by-code/:omieCode/stock`
- `/v1/omie/products/search`
- `/v1/omie/products/stock/refresh`
- `/v1/omie/products/sync`
- `/v1/omie/stock`
- `/v1/omie/sync/products`
- `/v1/plans`
- `/v1/plans/:id`
- `/v1/plans/:id/by-sector`
- `/v1/plans/:id/export.csv`
- `/v1/plans/:id/items`
- `/v1/products/:omieCode([A-Za-z0-9]{1,64})`
- `/v1/products/:productId/sector`
- `/v1/sectors`
- `/v1/sectors/:id`

---

## 🧬 Prisma (schema)

- **Models**: 9

### Models (preview)
- **SyncLock** (2 campos)
- **JobLock** (2 campos)
- **OmieProduct** (9 campos)
- **Product** (5 campos)
- **Sector** (5 campos)
- **ProductSector** (4 campos)
- **ProductionPlan** (5 campos)
- **ProductionPlanItem** (5 campos)
- **ProductStock** (6 campos)

---

## 🧾 Migrations

- **Total**: 10

### Últimas migrations (preview)
- `20260415190836_`  (81 B)
- `20260415190742_unique_product_stock_by_code`  (1.04 KB)
- `20260415183012_omie_code_identity`  (3.39 KB)
- `20260415170012_widen_omie_product_fields`  (337 B)
- `20260415124006_add_job_lock_table`  (208 B)
- `20260415100605_expand_product_stock_omie_code_64`  (93 B)
- `20260414131000_add_product_stock`  (513 B)
- `20260414125500_add_omie_code_and_family_description`  (225 B)
- `20260410005913_add_sync_lock`  (162 B)
- `20260410002353_first_migrate`  (3.42 KB)

### Pastas com SQL ausente (atenção)
_(nenhuma)_

---

## 🔐 Env (chaves esperadas)

- **Fonte**: .env (comparado com N/A)
- **Missing keys**: 0

### Missing (chaves esperadas e ausentes)
_(nenhuma)_

---

## 📦 Exports (complexidade aproximada)

- **Total exports (heurística)**: 32

### Top arquivos (exports)
- `src\lib\http.ts` — **7 exports**
- `src\services\jobLock.service.ts` — **2 exports**
- `src\services\publicProductsRead.service.ts` — **2 exports**
- `src\utils\backoff.ts` — **2 exports**
- `src\utils\errors.ts` — **2 exports**
- `src\app.ts` — **1 exports**
- `src\db.ts` — **1 exports**
- `src\env.ts` — **1 exports**
- `src\integrations\omie\OmieClient.ts` — **1 exports**
- `src\integrations\omie\OmieStockCache.ts` — **1 exports**
