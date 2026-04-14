# Plano de Melhoria — Production Manager API (apps/api)

Este documento descreve um plano de evolução para deixar a API mais clara, previsível e “autoexplicativa”, principalmente em torno de **produtos**, **estoque**, **categorias (famílias)** e **descrições**. O foco é melhorar DX e padronização REST, sem quebrar clientes existentes.

---

## Estado Atual (resumo)

### Modelos (Prisma)

Baseado em [schema.prisma](prisma/schema.prisma):

- `OmieProduct`: catálogo espelhado do Omie (inclui `description`, `sku?`, `active`, `rawPayload`, `lastSyncAt`).
- `Product`: produto “gerenciado” internamente (1:1 com `OmieProduct` via `omieProductId`), com `nickname?`, `active`.
- `Sector`: setores com `order` e `active` (soft delete).
- `ProductSector`: setor padrão do produto + `notes?`.
- `ProductionPlan` e `ProductionPlanItem`: planejamento.
- `SyncLock`: lock para sync.

### Rotas principais

Baseado em [routes/index.ts](src/routes/index.ts) e rotas associadas:

- Informativas: `GET /`, `GET /health`, `GET /v1`
- Omie: `POST /v1/omie/sync/products`, `POST /v1/omie/products/stock/refresh`, `GET /v1/omie/products`
- Produtos gerenciados: `POST /v1/products`, `POST /v1/products/bulk`, `GET /v1/products`, `DELETE /v1/products/:id`
- Setores: `POST /v1/sectors`, `GET /v1/sectors`, `PATCH /v1/sectors/:id`, `DELETE /v1/sectors/:id`
- Produto-Setor: `PUT /v1/products/:productId/sector`, `GET /v1/products/:productId/sector`
- Planos: `POST /v1/plans`, `GET /v1/plans`, `GET /v1/plans/:id`, `POST /v1/plans/:id/items`, `GET /v1/plans/:id/by-sector`, `GET /v1/plans/:id/export.csv`

### Padrões de resposta

- Envelope novo: `{ data, meta? }` (listagens com `{ data: [...], meta: { page, pageSize, total } }`).
- Compatibilidade para listagens: `X-Response-Format: legacy` retorna `{ items: [...] }` (e outros campos legacy quando aplicável).
- Erros padronizados: `{ error: { code, message, details?, requestId? } }`.

### Estoque hoje

- Existe cache em memória via [OmieStockCache.ts](src/integrations/omie/OmieStockCache.ts).
- O endpoint `GET /v1/omie/products` já “enriquece” cada item com `stockQuantity` e `minimumStock`.
- Há ação `POST /v1/omie/products/stock/refresh`.

---

## Objetivos de melhoria

1. Tornar “product stock”, “categories” e “descriptions/search” **recursos explícitos** por rotas dedicadas (não apenas embutidos em `GET /v1/omie/products`).
2. Reduzir acoplamento do frontend à estrutura do Omie (`rawPayload`) e expor campos canônicos.
3. Melhorar navegabilidade via browser e clareza de domínio (rotas previsíveis, nomes consistentes, exemplos no índice `/v1`).
4. Manter compatibilidade com clientes antigos nas listagens críticas.

---

## Convenções sugeridas (para evitar ambiguidade)

- Usar **paths em inglês** + **kebab-case** (padrão REST comum): `product-stock`, `categories`, `search`.
- GET para leitura; POST para ações (sync/refresh/publish).
- Resposta padrão:
  - Lista: `{ data: [...], meta: { page, pageSize, total, ... } }`
  - Item único: `{ data: {...} }`
- Para listagens: manter `X-Response-Format: legacy` quando houver risco de quebra.

---

## Rotas propostas (prioridade alta)

### 1) Estoque por produto (recurso explícito)

Problema: hoje o estoque está “misturado” no catálogo Omie e vem do cache. Um endpoint dedicado melhora clareza e evita o frontend depender do shape completo do produto.

- `GET /v1/products/:id/stock`
  - Fonte: `Product` → resolve `omieProductId` → extrai código do Omie (`OmieAdapter.extractProductCode`) → consulta snapshot do cache (`OmieStockCache.getSnapshot()`).
  - Resposta:
    - `{ data: { productId, omieCode, stockQuantity, minimumStock, stockCacheUpdatedAt } }`

- `GET /v1/omie/products/:omieId/stock`
  - Útil para debug/uso direto do catálogo Omie sem “selecionar” o produto.
  - Resposta:
    - `{ data: { omieId, omieCode, stockQuantity, minimumStock, stockCacheUpdatedAt } }`

Notas:
- Mantém `POST /v1/omie/products/stock/refresh` como ação.
- Opcional (mais REST): adicionar `POST /v1/omie/stock/refresh` e manter o atual como alias.

### 2) Categorias/Famílias como endpoint dedicado

Problema: hoje “famílias” aparecem como campo auxiliar dentro de `GET /v1/omie/products`. Um endpoint dedicado facilita UI de filtros e reduz payload quando só precisa da lista.

- `GET /v1/omie/categories`
  - Retorna lista única e ordenada das famílias.
  - Pode suportar `search` (filtro parcial).
  - Resposta:
    - `{ data: ["Corte", "Costura", ...], meta: { total } }`

Evolução possível:
- Persistir famílias numa tabela `Category` (se houver necessidade de metadados extras/ordem/alias). Caso contrário, derivar do catálogo.

### 3) Descrições e busca (endpoint específico)

Problema: “descrição” hoje é acessível via `GET /v1/omie/products` (e via join em `GET /v1/products`). Melhorar clareza e performance para autocomplete.

- `GET /v1/omie/products/search`
  - Query: `q`, `page`, `pageSize`
  - Retorna lista leve (campos mínimos): `omieId`, `code`, `description`, `sku?`, `familyDescription?`, `active?`
  - Resposta paginada.

- `GET /v1/omie/products/:id`
  - Retorna um item único do catálogo Omie por `id` (UUID) ou por `omieId` (decidir um padrão).
  - Recomendação: padronizar:
    - `GET /v1/omie/products/by-omie-id/:omieId` (sem ambiguidade)
    - `GET /v1/omie/products/:id` (id interno UUID)

---

## Rotas propostas (prioridade média)

### 4) Produto gerenciado (CRUD mais completo)

Hoje `Product` é criado e deletado, mas falta rotas para leitura item único e atualização.

- `GET /v1/products/:id`
  - `{ data: { ...product, omieProduct, productSector } }`
- `PATCH /v1/products/:id`
  - Permitir atualizar `nickname` e `active`.
  - `{ data: product }`

### 5) Setores (ordenação e status)

- `PATCH /v1/sectors/reorder`
  - Body: `{ data: [{ id, order }] }`
  - Ação idempotente e simples para UI.
- `PATCH /v1/sectors/:id/activate` e `PATCH /v1/sectors/:id/deactivate`
  - Alternativa mais clara ao DELETE (manter DELETE como soft delete legacy).

### 6) Planos (workflow explícito)

Hoje há status (DRAFT/PUBLISHED/CLOSED) no schema, mas não há endpoints de transição.

- `POST /v1/plans/:id/publish`
- `POST /v1/plans/:id/close`

---

## Rotas propostas (prioridade baixa / qualidade)

### 7) OpenAPI / Docs

Hoje `GET /` expõe `endpoints.docs = /docs`, mas não existe rota `/docs`.

Opções:
- Implementar `/docs` (swagger/openapi UI) e `/openapi.json`.
- Ou remover `docs` do root até implementar (se preferir consistência).

### 8) Índice v1 mais rico

Manter `/v1` como lista manual, mas incluir:
- `tags` (Omie / Products / Sectors / Plans)
- `responseFormat` (new/legacy)
- `examples` (curl)

---

## Mudanças de Modelo (se necessário)

Somente se precisar persistir dados além do cache:

### A) Tabela de snapshot de estoque

Criar `ProductStockSnapshot` (ou `OmieStockSnapshot`) para:
- histórico de estoque
- auditoria (quando e qual valor)
- reduzir dependência do cache em memória

Campos sugeridos:
- `id`, `omieCode`, `stockQuantity`, `minimumStock`, `capturedAt`

### B) Tabela de categorias

Se precisar de:
- renomear categorias (“apelidos”), ordem customizada, agrupamentos

---

## Plano de Execução (passo a passo)

1) Consolidar nomenclatura final dos endpoints: inglês + kebab-case.
2) Implementar rotas de leitura “leves” (search, categories, stock) sem alterar comportamento das rotas existentes.
3) Adicionar ao índice `GET /v1` as novas rotas.
4) Padronizar respostas com `{ data, meta }` e decidir se cada nova listagem precisa de `legacy`.
5) Adicionar testes:
   - unitários para `GET /v1/omie/categories`, `GET /v1/products/:id/stock`
   - testes de contrato (shape mínimo) para não quebrar frontend
6) (Opcional) Implementar `/docs` e OpenAPI.

---

## Exemplos de respostas (propostos)

### Estoque por produto (item único)

```json
{
  "data": {
    "productId": "uuid",
    "omieCode": "12345",
    "stockQuantity": "10",
    "minimumStock": "2",
    "stockCacheUpdatedAt": "2026-04-14T12:34:56.000Z"
  }
}
```

### Categorias (lista)

```json
{
  "data": ["Category A", "Category B"],
  "meta": { "page": 1, "pageSize": 2, "total": 2 }
}
```

---

## Observações importantes

- `GET /v1/omie/products` hoje retorna itens enriquecidos + `families` e `stockCacheUpdatedAt`. Esse endpoint tende a crescer e ficar pesado. As rotas propostas (stock/categories/search) ajudam a “fatiar” responsabilidades.
- Há duas classes chamadas `AppError` (core e utils). Unificar isso no futuro simplifica o handler e a tipagem.

