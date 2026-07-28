# Comandos Importantes do Projeto

Referência rápida dos comandos mais usados no dia a dia, organizados por terminal.

---

## Sumário

1. [Preparação do Ambiente](#1-preparação-do-ambiente)
2. [Servidor](#2-servidor)
3. [Prisma / Banco de Dados](#3-prisma--banco-de-dados)
4. [Testes](#4-testes)
5. [Build / Start](#5-build--start)
6. [Scripts Utilitários](#6-scripts-utilitários)
7. [Métricas e Documentação](#7-métricas-e-documentação)
8. [Requisições HTTP (Endpoints)](#8-requisições-http-endpoints)
9. [Gerenciamento de Processos](#9-gerenciamento-de-processos)
10. [Docker](#10-docker)

---

## 1) Preparação do Ambiente

### PowerShell (Windows Terminal)
```powershell
cd C:\Users\Dell\Documents\trae_projects\production_manager\apps\api
pnpm -v
node -v
pnpm install
```

### Git Bash
```bash
cd /c/Users/Dell/Documents/trae_projects/production_manager/apps/api
pnpm -v
node -v
pnpm install
```

### Git Terminal (IDE)
```bash
cd apps/api
pnpm -v
node -v
pnpm install
```

---

## 2) Servidor

### PowerShell
```powershell
# Iniciar servidor de desenvolvimento
cd C:\Users\Dell\Documents\trae_projects\production_manager\apps\api
pnpm dev

# A partir da raiz do monorepo
cd C:\Users\Dell\Documents\trae_projects\production_manager
pnpm --filter @production-manager/api dev
```

### Git Bash
```bash
# Iniciar servidor de desenvolvimento
cd /c/Users/Dell/Documents/trae_projects/production_manager/apps/api
pnpm dev

# A partir da raiz do monorepo
cd /c/Users/Dell/Documents/trae_projects/production_manager
pnpm --filter @production-manager/api dev
```

### Git Terminal (IDE)
```bash
# Iniciar servidor de desenvolvimento
cd apps/api && pnpm dev
```

---

## 3) Prisma / Banco de Dados

### PowerShell
```powershell
cd C:\Users\Dell\Documents\trae_projects\production_manager\apps\api

# Gerar Prisma Client (após alterar schema.prisma)
pnpm prisma:generate

# Rodar migrations (dev)
pnpm db:migrate

# Deploy de migrations (produção)
pnpm db:migrate:prod

# Abrir Prisma Studio (navegador)
pnpm db:studio
```

### Git Bash
```bash
cd /c/Users/Dell/Documents/trae_projects/production_manager/apps/api

pnpm prisma:generate
pnpm db:migrate
pnpm db:migrate:prod
pnpm db:studio
```

### Git Terminal (IDE)
```bash
cd apps/api

pnpm prisma:generate
pnpm db:migrate
pnpm db:migrate:prod
pnpm db:studio
```

---

## 4) Testes

### PowerShell / Git Bash / Git Terminal
```bash
cd apps/api
pnpm test
```

---

## 5) Build / Start

### PowerShell / Git Bash / Git Terminal
```bash
cd apps/api
pnpm build
pnpm start
```

---

## 6) Scripts Utilitários

### PowerShell
```powershell
cd C:\Users\Dell\Documents\trae_projects\production_manager\apps\api

# Gerar novo módulo (scaffold)
pnpm gen:module -- nome-do-modulo

# Criar arquivo interativo
pnpm run create:file

# Backfill omieCode
pnpm backfill:omie-code

# Executar scripts .ts avulsos
pnpm exec tsx scripts/backfill-omie-code.ts
pnpm exec tsx scripts/generate-module.ts

# Executar scripts .mjs avulsos
node scripts/check-env.mjs
node scripts/repo-metrics.mjs
```

### Git Bash
```bash
cd /c/Users/Dell/Documents/trae_projects/production_manager/apps/api

pnpm gen:module -- nome-do-modulo
pnpm run create:file
pnpm backfill:omie-code
pnpm exec tsx scripts/backfill-omie-code.ts
node scripts/repo-metrics.mjs
```

### Git Terminal (IDE)
```bash
cd apps/api

pnpm gen:module -- nome-do-modulo
pnpm run create:file
pnpm backfill:omie-code
pnpm exec tsx scripts/backfill-omie-code.ts
```

---

## 7) Métricas e Documentação

### PowerShell / Git Bash / Git Terminal
```bash
cd apps/api

# Todas as métricas de uma vez
pnpm metrics:all

# Métricas individuais
pnpm metrics:tree        # Árvore de diretórios
pnpm metrics:loc         # Linhas de código
pnpm metrics:sizes       # Tamanho dos arquivos
pnpm metrics:endpoints   # Listar endpoints
pnpm metrics:drift       # Drift entre contrato e implementação
pnpm metrics:prisma      # Análise do schema Prisma
pnpm metrics:migrations  # Status das migrations
pnpm metrics:env         # Variáveis de ambiente
pnpm metrics:exports     # Exportações dos módulos

# Documentação
pnpm docs:contract       # Gerar contrato de API
pnpm docs:status         # Status do repositório
pnpm docs:reference      # Referência técnica
pnpm docs:typedoc        # Gerar TypeDoc
pnpm metrics:update-docs # Atualizar docs com métricas
```

---

## 8) Requisições HTTP (Endpoints)

### PowerShell (Windows Terminal)
> **Atenção**: No PowerShell, `curl` é um alias para `Invoke-WebRequest`. Use **`curl.exe`** para o curl real.
> Use **`` ` ``** (backtick) para quebrar linhas.

```powershell
# Base URL
$BASE = "http://localhost:3333"

# Meta
curl.exe -s "$BASE/" | more
curl.exe -s "$BASE/health" | more
curl.exe -s "$BASE/v1" | more

# Produtos públicos
curl.exe -s "$BASE/v1/products?page=1&pageSize=50&pretty=true" | more

# Produtos - admin
curl.exe -s "$BASE/v1/admin/product-structures" | more
curl.exe -s "$BASE/v1/admin/product-structures?hasStructure=false" | more
curl.exe -s "$BASE/v1/admin/product-structures?page=1&pageSize=20" | more

# Pedidos (omie-orders) - admin
curl.exe -s "$BASE/v1/admin/orders/stage20?page=1&pageSize=50" | more
curl.exe -s "$BASE/v1/admin/orders/stage20/totals" | more
curl.exe -s "$BASE/v1/admin/omie/orders/stage20/ping" | more

# Sincronizar etapa 20
curl.exe -s -X POST "$BASE/v1/admin/omie/orders/stage20/sync" | more

# Sincronizar produtos Omie
curl.exe -s -X POST "$BASE/v1/admin/omie/sync/products" | more

# Atualizar estoque
curl.exe -s -X POST "$BASE/v1/admin/omie/products/stock/refresh" | more

# Categorias
curl.exe -s "$BASE/v1/admin/omie/categories" | more

# Buscar produto no Omie
curl.exe -s "$BASE/v1/admin/omie/products/search?q=parafuso" | more

# Setores
curl.exe -s "$BASE/v1/admin/sectors" | more
curl.exe -s -X POST "$BASE/v1/admin/sectors" `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Corte\",\"active\":true}' | more

# Planos
curl.exe -s "$BASE/v1/admin/plans" | more

# Alertas de estoque
curl.exe -s "$BASE/api/alerts/stock/critical" | more

# Product-structures (product-structure)
curl.exe -s "$BASE/v1/admin/product-structures?page=1&pageSize=2" | more

# Sincronizar estruturas de produtos
curl.exe -s -X POST "$BASE/v1/admin/omie/product-structures/sync" | more

# Product-structures - job tick
curl.exe -s -X POST "$BASE/v1/admin/omie/product-structures/sync-job-tick" | more
```

### Git Bash
> Use **`\`** (barra invertida) para quebrar linhas.

```bash
# Base URL
BASE="http://localhost:3333"

# Meta
curl -s "$BASE/" | more
curl -s "$BASE/health" | more
curl -s "$BASE/v1" | more

# Produtos públicos
curl -s "$BASE/v1/products?page=1&pageSize=50&pretty=true" | more

# Produtos - admin
curl -s "$BASE/v1/admin/product-structures" | more
curl -s "$BASE/v1/admin/product-structures?hasStructure=false" | more
curl -s "$BASE/v1/admin/product-structures?page=1&pageSize=20" | more

# Pedidos (omie-orders) - admin
curl -s "$BASE/v1/admin/orders/stage20?page=1&pageSize=50" | more
curl -s "$BASE/v1/admin/orders/stage20/totals" | more
curl -s "$BASE/v1/admin/omie/orders/stage20/ping" | more

# Sincronizar etapa 20
curl -s -X POST "$BASE/v1/admin/omie/orders/stage20/sync" | more

# Sincronizar produtos Omie
curl -s -X POST "$BASE/v1/admin/omie/sync/products" | more

# Atualizar estoque
curl -s -X POST "$BASE/v1/admin/omie/products/stock/refresh" | more

# Categorias
curl -s "$BASE/v1/admin/omie/categories" | more

# Buscar produto no Omie
curl -s "$BASE/v1/admin/omie/products/search?q=parafuso" | more

# Setores
curl -s "$BASE/v1/admin/sectors" | more
curl -s -X POST "$BASE/v1/admin/sectors" \
  -H "Content-Type: application/json" \
  -d '{"name":"Corte","active":true}' | more

# Planos
curl -s "$BASE/v1/admin/plans" | more

# Alertas de estoque
curl -s "$BASE/api/alerts/stock/critical" | more

# Product-structures (product-structure)
curl -s "$BASE/v1/admin/product-structures?page=1&pageSize=2" | more

# Sincronizar estruturas de produtos
curl -s -X POST "$BASE/v1/admin/omie/product-structures/sync" | more

# Product-structures - job tick
curl -s -X POST "$BASE/v1/admin/omie/product-structures/sync-job-tick" | more
```

### Git Terminal (IDE)
> Depende da configuração: se for **Git Bash** siga os comandos acima; se for **PowerShell** use `curl.exe`.
> Abaixo, versão simplificada assumindo bash:

```bash
BASE="http://localhost:3333"

curl -s "$BASE/health"
curl -s "$BASE/v1/admin/product-structures?page=1&pageSize=2"
curl -s -X POST "$BASE/v1/admin/omie/sync/products"
```

---

## 9) Gerenciamento de Processos

### PowerShell
```powershell
# Descobrir PID ouvindo na porta 3333
Get-NetTCPConnection -LocalPort 3333 -ErrorAction SilentlyContinue

# Matar processo pelo PID (ex: 30488)
taskkill /PID 30488 /F

# Matar todos os processos Node
taskkill /F /IM node.exe

# Matar processo na porta 3333 (forma direta)
$pid = (Get-NetTCPConnection -LocalPort 3333).OwningProcess
taskkill /PID $pid /F
```

### Git Bash
```bash
# Descobrir PID ouvindo na porta 3333
netstat -ano | grep ":3333"

# Matar processo pelo PID (ex: 30488)
kill -9 30488

# Matar todos os processos Node
killall node

# Forma direta com lsof (se instalado)
lsof -ti:3333 | xargs kill -9
```

### Git Terminal (IDE)
```bash
# Git Bash
netstat -ano | grep ":3333" | head -1 | awk '{print $5}' | cut -d: -f2 | xargs kill -9

# Ou PowerShell
Get-NetTCPConnection -LocalPort 3333 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { taskkill /PID $_ /F }
```

---

## 10) Docker

### PowerShell / Git Bash / Git Terminal
```bash
# Subir containers (PostgreSQL, Redis)
docker compose up -d

# Parar containers
docker compose down

# Ver logs
docker compose logs -f

# Ver status
docker compose ps
```

---

## Dicas Rápidas por Terminal

| Ação | PowerShell | Git Bash |
|------|-----------|----------|
| curl | `curl.exe` (nunca `curl`) | `curl` |
| Quebra de linha | `` ` `` (backtick) | `\` (barra) |
| Variável | `$VAR = "valor"` | `VAR="valor"` |
| Acessar variável | `$VAR` | `$VAR` |
| Matar processo | `taskkill /PID X /F` | `kill -9 X` |
| Pipe para paginar | `\| more` | `\| more` |
| Path do projeto | `C:\Users\Dell\...` | `/c/Users/Dell/...` |

---

> **Arquivo gerado em:** 2026-05-12
> **Baseado nos comandos do pacote:** `@production-manager/api`
