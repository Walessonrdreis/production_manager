# Comandos de terminal (API) — testar rotas e tarefas comuns

## 1) Preparação (Windows / PowerShell)

```powershell
cd c:\Users\Dell\Documents\trae_projects\production_manager\apps\api
pnpm -v
node -v
pnpm install
```

## 2) Rodar a API localmente

```powershell
cd c:\Users\Dell\Documents\trae_projects\production_manager\apps\api
pnpm dev
```

Base URL (padrão):

```powershell
$BASE = "http://localhost:3333"
```

## 3) Testar rotas “meta” (definidas em src/bootstrap/routes.ts)

```powershell
curl.exe -s "$BASE/" | more
curl.exe -s "$BASE/health" | more
curl.exe -s "$BASE/v1" | more
```

## 4) Rotas públicas (expostas no índice /v1)

Listar catálogo público:

```powershell
curl.exe -s "$BASE/v1/products?page=1&pageSize=50&pretty=true" | more
curl.exe -s "$BASE/v1/products?q=cor&page=1&pageSize=50&pretty=true" | more
```

Detalhe por omieCode:

```powershell
$OMIE_CODE = "12345"
curl.exe -s "$BASE/v1/products/$OMIE_CODE?pretty=true" | more
```

Descobrir contrato (se suportado pelo endpoint):

```powershell
curl.exe -s -H "X-Describe: true" "$BASE/v1/products?pretty=true" | more
```

## 5) Rotas admin — pedidos (omie-orders)

Listar ordens (agora filtradas para etapa 20 ativas):

```powershell
curl.exe -s "$BASE/v1/admin/orders?page=1&pageSize=50" | more
```

Listar etapa 20 (com busca opcional `q`):

```powershell
curl.exe -s "$BASE/v1/admin/orders/stage20?page=1&pageSize=50" | more
curl.exe -s "$BASE/v1/admin/orders/stage20?page=1&pageSize=50&q=parafuso" | more
```

Totais consolidados (etapa 20):

```powershell
curl.exe -s "$BASE/v1/admin/orders/stage20/totals" | more
```

Ping do módulo:

```powershell
curl.exe -s "$BASE/v1/admin/omie/orders/stage20/ping" | more
```

Sincronizar etapa 20 (POST):

```powershell
curl.exe -s -X POST "$BASE/v1/admin/omie/orders/stage20/sync" | more
```

## 6) Rotas admin — produtos gerenciados / setores / planos (placeholders)

Criar setor:

```powershell
curl.exe -s -X POST "$BASE/v1/admin/sectors" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Corte\",\"active\":true}" | more
```

Listar setores:

```powershell
curl.exe -s "$BASE/v1/admin/sectors" | more
curl.exe -s "$BASE/v1/admin/sectors?includeInactive=true" | more
```

Criar plano:

```powershell
curl.exe -s -X POST "$BASE/v1/admin/plans" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Plano 01\"}" | more
```

Listar planos:

```powershell
curl.exe -s "$BASE/v1/admin/plans" | more
```

Detalhar plano:

```powershell
$PLAN_ID = "UUID_DO_PLANO"
curl.exe -s "$BASE/v1/admin/plans/$PLAN_ID" | more
```

Exportar CSV do plano:

```powershell
curl.exe -s "$BASE/v1/admin/plans/$PLAN_ID/export.csv" -o "plano.csv"
```

Selecionar produto para gerenciar (payload depende do módulo):

```powershell
curl.exe -s -X POST "$BASE/v1/admin/managed-products" ^
  -H "Content-Type: application/json" ^
  -d "{\"omieCode\":\"12345\"}" | more
```

Listar produtos gerenciados:

```powershell
curl.exe -s "$BASE/v1/admin/managed-products" | more
```

## 7) Rotas admin — Omie (produtos/estoque) (placeholders)

Sincronizar produtos do Omie:

```powershell
curl.exe -s -X POST "$BASE/v1/admin/omie/sync/products" | more
```

Atualizar e persistir estoque:

```powershell
curl.exe -s -X POST "$BASE/v1/admin/omie/products/stock/refresh" | more
```

Listar categorias/famílias:

```powershell
curl.exe -s "$BASE/v1/admin/omie/categories" | more
```

Buscar no catálogo Omie:

```powershell
curl.exe -s "$BASE/v1/admin/omie/products/search?q=parafuso" | more
```

## 8) Banco de dados / Prisma

Gerar Prisma Client:

```powershell
cd c:\Users\Dell\Documents\trae_projects\production_manager\apps\api
pnpm prisma:generate
```

Rodar migrations (dev):

```powershell
pnpm db:migrate
```

Rodar migrations (deploy/prod):

```powershell
pnpm db:migrate:prod
```

Abrir Prisma Studio:

```powershell
pnpm db:studio
```

## 9) Qualidade / build / testes

Testes:

```powershell
cd c:\Users\Dell\Documents\trae_projects\production_manager\apps\api
pnpm test
```

Build:

```powershell
pnpm build
```

## 10) Métricas e docs geradas por scripts do projeto

```powershell
cd c:\Users\Dell\Documents\trae_projects\production_manager\apps\api
pnpm metrics:all
pnpm metrics:update-docs
pnpm docs:contract
pnpm docs:status
pnpm docs:reference
pnpm docs:typedoc
```

