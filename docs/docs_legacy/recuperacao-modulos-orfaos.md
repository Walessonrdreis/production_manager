# Recuperação de módulos/tabelas órfãs pós-refatoração (API)

## 1) Introdução

Após a refatoração da API (mantendo endpoints e tabelas existentes), parte das rotinas de escrita/sincronização não foi reimplementada na nova arquitetura modular (`src/modules/*`). O resultado é um sistema que:

- mantém contratos HTTP (endpoints e payloads) e continua lendo do banco
- mantém o schema/tabelas no PostgreSQL
- porém deixou de atualizar algumas tabelas (sync/jobs ausentes, locks ausentes, rotinas de refresh ausentes)
- passa a retornar dados congelados, apesar de “funcionar”

Este documento organiza:

- como diagnosticar quais módulos/tabelas ficaram órfãos
- como classificar tabelas por necessidade de atualização
- como reativar jobs/syncs preservando compatibilidade com o legado

Premissas obrigatórias:

- a arquitetura modular já existe e não deve ser redesenhada
- endpoints e payloads legados devem ser preservados
- correções devem ser implementadas dentro dos módulos existentes, seguindo os padrões já aplicados na API atual

---

## 2) Conceito de “módulo órfão”

### Definição

Um **módulo órfão** é um módulo cujo **pipeline de escrita** (criação/atualização de dados) foi perdido/omitido durante a refatoração, enquanto o pipeline de leitura permaneceu operante.

Na prática, um módulo órfão costuma apresentar:

- rotas HTTP “ok” (200/204) e queries Prisma/SQL funcionando
- respostas retornadas a partir de tabelas existentes
- porém **sem nenhum mecanismo ativo** que atualize aquelas tabelas
- e/ou com endpoints de sync/admin existindo, mas não conectados a um job (ou sem uso/execução)

### Leitura funcionando vs escrita inexistente

- **Leitura funcionando**: handlers/use cases fazem `SELECT` (via Prisma) e retornam dados coerentes com o que está no banco.
- **Escrita inexistente**: não há job/sync/rotina de refresh rodando (ou rodando com erro), então `INSERT/UPDATE/UPSERT` não acontece e o banco “para no tempo”.

Sinais típicos:

- campos como `lastRefreshAt`/`updatedAt` ficam parados por dias/semanas
- contadores (`totalItems`) não mudam apesar de a fonte externa ter mudado
- endpoints admin retornam `"source": "database"` sem que exista processo que coloque dados novos no banco

---

## 3) Checklist de diagnóstico

### 3.1 Checklist rápido (por módulo)

1. **Rotas**
   - existe rota pública (leitura)?
   - existe rota admin/manual de sync/refresh?
   - existe rota legada (alias/deprecated) que ainda precisa do mesmo comportamento?

2. **Jobs**
   - existe job periódico no módulo (`infrastructure/jobs/*`)?
   - ele é iniciado no bootstrap (apenas uma vez) por flag de env?
   - logs indicam: scheduled → started → finished?

3. **Write path**
   - existe use case de sync/refresh que executa `upsert/updateMany/createMany`?
   - existe repo de lock (evitar concorrência) e tratamento de `SYNC_IN_PROGRESS`?
   - existe persistência de “estado do refresh” (ex.: `lastRefreshAt`)?

4. **Banco**
   - tabelas do módulo recebem `UPDATE/INSERT` recentemente?
   - existe evidência de congelamento (timestamps, contadores, `n_tup_upd` do PG)?

### 3.2 SQL: detectar “dados congelados” (tabelas candidatas a órfãs)

#### A) Tabelas sem escrita recente (por estatísticas do PostgreSQL)

```sql
SELECT
  relname AS table_name,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) ASC, relname ASC;
```

Uso:

- candidatos a órfãs: tabelas relevantes com `n_tup_ins/n_tup_upd` muito baixos e sem mudanças esperadas
- atenção: estatísticas podem resetar após restart; combine com timestamps/linhas

#### B) Colunas de timestamp disponíveis (inventário)

```sql
SELECT
  table_schema,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('updated_at', 'updatedAt', 'created_at', 'createdAt', 'last_refresh_at', 'lastRefreshAt')
ORDER BY table_name, column_name;
```

#### C) “Última atualização” (quando há coluna `updated_at`/`updatedAt`)

```sql
-- Ajuste o nome da tabela/coluna conforme o schema real
SELECT
  MAX(updated_at) AS max_updated_at,
  COUNT(*)        AS total_rows
FROM public.sua_tabela;
```

Heurística:

- se `max_updated_at` estiver muito antigo em uma tabela que deveria mudar diariamente, há forte indício de job/sync ausente

#### D) Tabelas grandes com crescimento paralisado

```sql
SELECT
  relname AS table_name,
  n_live_tup AS approx_rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### 3.3 Verificação de jobs/schedulers na API

Checklist:

- existe `start<Algo>Job(app)` no bootstrap do app
- a inicialização está condicionada por flags de env (ex.: `ENABLE_*`)
- o job não roda em `NODE_ENV=test`
- logs mostram o agendamento e as execuções

Referência do padrão atual:

- bootstrap inicia jobs após registrar rotas e por flags de env: `apps/api/src/bootstrap/app.ts`
- jobs atuais (exemplos): produtos, pedidos stage 20, clientes, refresh de estoque

### 3.4 Análise de endpoints (compatibilidade e “efeito placebo”)

Checklist:

- endpoint existe, mas apenas consulta tabelas (sem mecanismo de alimentá-las)
- endpoint admin existe, mas não há job rodando e ninguém dispara manualmente
- endpoint retorna `lastRefreshAt` antigo e não há evidência de `UPDATE` no banco

Exemplo de sintoma (shape típico):

```json
{
  "lastRefreshAt": "2026-04-23T21:45:18.577Z",
  "totalItems": 1598,
  "source": "database"
}
```

---

## 4) Classificação das tabelas

Para cada tabela (ou conjunto de tabelas de um módulo), classificar em uma das categorias:

### ✅ Requer sync ativo (periódico)

Critérios:

- origem externa (ex.: Omie) e mudanças frequentes
- dados são críticos para operação e precisam estar atualizados automaticamente
- há impacto direto em telas/processos se estiver defasado (estoque, pedidos, preços, clientes)
- há volume suficiente para justificar job com batch/backoff e lock

Exemplo típico:

- tabelas de produtos/pedidos/clientes e snapshots de estoque

### ⚠️ Refresh eventual (manual ou sob demanda controlada)

Critérios:

- muda com baixa frequência
- pode ser atualizado por job menos frequente, endpoint manual admin, ou sync no startup apenas em cenários específicos
- “staleness” aceitável por horas/dias, desde que exista procedimento de atualização

Exemplos:

- caches auxiliares
- tabelas derivadas usadas para relatórios internos

### ❌ Leitura histórica (congelada por definição)

Critérios:

- dados são históricos (imutáveis) ou arquivados
- não dependem de integrações externas
- o sistema deve apenas ler e não deve existir job de atualização

Exemplos:

- snapshots versionados, logs/auditoria, tabelas de consolidação já fechadas

---

## 5) Estratégia de recuperação (sem redesenhar arquitetura)

### 5.1 Para módulos órfãos: o que reimplementar

Para cada módulo identificado como órfão:

- **Use case de sync/refresh** (camada `application`)
  - regras de negócio e orquestração
  - paginação/batch e backoff quando necessário
  - persistência idempotente (upsert)
- **Repos de persistência** (camada `infrastructure/db`)
  - Prisma repositories e queries eficientes
  - helpers de lock (via tabela de lock) quando aplicável
- **Job periódico** (camada `infrastructure/jobs`)
  - agenda via `node-cron`
  - controle local `inFlight` + lock global no DB
- **Endpoint admin/manual** (camada `presentation/http`)
  - gatilho controlado para execução (sem depender de rotas públicas)
  - resposta compatível com contratos existentes (status/payload)

### 5.2 Onde reimplementar (padrão por módulo)

Sem alterar a arquitetura existente, use o padrão:

```text
src/modules/<modulo>/
  application/
    use-cases/
      <acao>.usecase.ts
  infrastructure/
    db/
      *.repo.prisma.ts
    jobs/
      *.job.ts
  presentation/
    http/
      *.routes.ts
      *.controller.ts
```

Regra prática:

- o job chama um use case do módulo (não implementa regra de negócio no scheduler)
- o controller chama o mesmo use case (não duplica código do job)

### 5.3 O que não fazer

- não redesenhar a arquitetura (`modules/*` permanece)
- não “consertar” quebrando contratos HTTP (rotas/payloads)
- não executar sync pesado em endpoints de leitura pública
- não acoplar leitura e escrita no mesmo handler “porque é fácil”
- não criar jobs globais genéricos fora dos módulos para “resolver rápido”

### 5.4 Como manter compatibilidade com o legado

Checklist:

- manter rotas legadas/deprecated existentes (aliases) e garantir o mesmo shape de resposta
- quando houver múltiplos formatos de resposta, manter o mecanismo atual de seleção (ex.: header de formato)
- preservar códigos de erro relevantes (ex.: `SYNC_IN_PROGRESS` quando lock impedir execução concorrente)
- preferir reutilizar a lógica do legado como referência funcional (contratos e edge cases), não como local de execução

---

## 6) Padrão de reativação (o “jeito certo”)

### 6.1 Job periódico (cron)

Requisitos mínimos:

- agendamento configurável via env (`*_CRON`) com fallback seguro
- flag de enable (`ENABLE_*`) para ligar/desligar sem alterar código
- não rodar em ambiente de teste
- logs padronizados: scheduled / started / finished / skipped / failed

Padrão desejado (estrutura):

```ts
export function start<Nome>Job(appOrLogger: FastifyInstance | LoggerLike) {
  if (process.env.NODE_ENV === "test") return;
  if (!envFlagEnabled) return;

  const cronExpr = validatedExprOrFallback;
  log.info({ cronExpr }, "<nome> job scheduled");

  let inFlight = false;
  const tick = async () => {
    if (inFlight) return log.warn({}, "<nome> skipped (inFlight)");
    inFlight = true;
    const startedAtIso = new Date().toISOString();
    log.info({ startedAt: startedAtIso }, "<nome> started");
    try {
      const { useCases } = await register<Modulo>Module(app);
      await useCases.<acao>.execute({ requestId: `job-${Date.now()}` });
      log.info({ startedAt: startedAtIso, finishedAt: new Date().toISOString() }, "<nome> finished");
    } catch (err) {
      if (err?.code === "SYNC_IN_PROGRESS") return log.warn({ code: err.code }, "<nome> skipped: already running");
      log.error({ err }, "<nome> failed");
    } finally {
      inFlight = false;
    }
  };

  cron.schedule(cronExpr, () => void tick());
}
```

### 6.2 Endpoint manual (admin)

Requisitos:

- rota protegida/administrativa (no mínimo sob prefixo `/v1/admin/...`)
- chama o mesmo use case do job
- retorna payload compatível com o contrato já existente

### 6.3 Sync no startup (quando aplicável)

Use apenas quando:

- o processo precisa “aquecer” alguma tabela mínima para operar
- há lock e idempotência
- existe observabilidade (log claro no startup)

Evitar quando:

- a sincronização é pesada/longa e atrapalha o boot
- a tabela pode ser atualizada de forma segura por job + endpoint manual

### 6.4 Uso de lock (concorrência)

Objetivo:

- evitar duas execuções simultâneas (inclusive em múltiplas instâncias) sobre o mesmo conjunto de tabelas

Padrão:

- lock global no banco por chave (ex.: linha em tabela `sync_lock`)
- TTL para evitar deadlock permanente
- erro específico (`SYNC_IN_PROGRESS`) para permitir “skip” limpo em jobs e feedback correto em endpoints admin

### 6.5 Idempotência

Regras:

- use `upsert` por chave natural (IDs do externo) ao invés de `create` cego
- operações devem ser repetíveis sem corromper estado
- batch/paginação deve ser resiliente (reprocessamento parcial não deve duplicar)

---

## 7) Ordem de prioridade

### 7.1 Como priorizar (matriz simples)

Priorize módulos/tabelas por:

1. **Impacto operacional**: afeta produção/decisão diária? (estoque, pedidos, clientes)
2. **Risco de inconsistência**: dados defasados geram erro financeiro/operacional?
3. **Frequência de mudança**: muda muito? então precisa sync ativo
4. **Custo de recuperação**: existem referências no legado que podem ser portadas com baixo risco?
5. **Dependências**: módulos derivados (views/enriched) dependem de tabelas base estarem atualizadas

### 7.2 Ordem recomendada

1. **Módulos críticos (base externa)**
   - produtos / estoque
   - pedidos (stage relevante) / status
   - clientes
2. **Módulos secundários (derivados/compostos)**
   - visões agregadas e enriquecimentos que dependem do “base”
3. **Módulos estáticos (podem ficar congelados)**
   - históricos/auditoria/snapshots imutáveis

---

## 8) Checkpoints de validação (por módulo recuperado)

Para cada módulo reativado, validar em três camadas: logs, SQL e HTTP.

### 8.1 Logs esperados

No boot (quando job habilitado):

- `"<nome> job scheduled"` com `{ cronExpr }`

Na execução:

- `"<nome> started"` com `{ startedAt }`
- `"<nome> finished"` com `{ finishedAt, durationMs, ...resultado }`

Na concorrência:

- `"<nome> skipped: already running"` com `{ code: "SYNC_IN_PROGRESS" }`

No erro:

- `"<nome> failed"` com `{ err }` e stack

### 8.2 Queries SQL (validação pós-sync)

Modelo mínimo (ajuste por tabela):

```sql
-- 1) contagem
SELECT COUNT(*) AS total_rows FROM public.sua_tabela;

-- 2) “frescura” (se existir coluna de atualização)
SELECT MAX(updated_at) AS max_updated_at FROM public.sua_tabela;

-- 3) amostra (sanidade)
SELECT * FROM public.sua_tabela ORDER BY 1 DESC LIMIT 5;
```

Validação de lock (quando aplicável):

```sql
SELECT * FROM public.sync_lock ORDER BY key;
```

### 8.3 Chamadas curl (validação de endpoint admin/manual)

Modelos (ajuste conforme rotas reais):

```bash
# Produtos: sync manual
curl -sS -X POST "http://localhost:3000/v1/admin/omie/sync/products" \
  -H "Content-Type: application/json"

# Pedidos stage 20: sync manual
curl -sS -X POST "http://localhost:3000/v1/admin/omie/orders/stage20/sync"

# Clientes: sync manual
curl -sS -X POST "http://localhost:3000/v1/admin/omie/clients/sync"

# Estoque: refresh manual
curl -sS -X POST "http://localhost:3000/v1/admin/omie/products/stock/refresh" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'

# Estoque: info (diagnóstico de congelamento)
curl -sS "http://localhost:3000/v1/admin/omie/stock"
```

---

## 9) Regras importantes (invariantes do projeto)

- NÃO remover endpoints existentes
- NÃO alterar payloads (shape, nomes de campos, semântica)
- NÃO fazer sync pesado em rotas de leitura pública (evitar “sync por request”)
- NÃO misturar leitura e escrita no mesmo handler/fluxo (separe use cases)
- NÃO mover lógica de módulos para camadas globais ou “atalhos” fora da arquitetura
- NÃO introduzir concorrência sem lock/idempotência (principalmente em produção com múltiplas instâncias)

---

## Apêndice A) Roteiro operacional para PRs

1. Identificar módulo órfão e listar tabelas envolvidas
2. Classificar tabelas (sync ativo / refresh eventual / histórica)
3. Mapear referência funcional no legado (contratos, edge cases, paginação, erros)
4. Implementar use case de sync/refresh (idempotente)
5. Implementar lock global (tabela + TTL) quando houver risco de concorrência
6. Implementar endpoint admin/manual que chama o use case
7. Implementar job (cron) que chama o mesmo use case
8. Adicionar logs padronizados e validação
9. Validar com checkpoints (logs + SQL + curl)

