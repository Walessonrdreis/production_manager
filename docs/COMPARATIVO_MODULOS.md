# 📊 Comparativo entre Módulos de Integração

> **Data:** 2026-06-24
> **Propósito:** Comparação lado a lado dos 3 principais módulos de integração usando o [Quality Gate](MODULE_QUALITY_GATE.md) de 119 itens.

---

## 🏆 Ranking Geral

| # | Módulo | Pontuação | Maturidade | Estágio |
|---|--------|-----------|------------|---------|
| 🥇 | `sales-order-sync` | **~100%** (104/104) | ✅ Produção | Produção |
| 🥇 | `product-structure` | **~99%** (118/119) | Canônico | Produção |
| 🥉 | `production-orders` | **~95%** (114/120) | ✅ Produção | Produção |

---

## 📈 Visão Geral dos Módulos

### 1. `product-structure` — 🥇 Referência Canônica

```
Arquivos: 53
Gateways: 6 pares (fetch, fetch-page, delete, consult, apply, lifecycle)
Use-cases: 9
Rotas: commands(5) + read(4) + callbacks(2) = 11 endpoints
Jobs: 3 (register, handler, reconcile)
```

**Diferenciais:** Único com lifecycle gateway completo (confirm/fail via porta dedicada). Tem reconcile job. Mapeamento Omie via adapter compartilhado.

**Gaps:** `118/119` — `saveMany()` ausente na sync store (faz `save()` item por item).

---

### 2. `production-orders` — 🥈 Mais Gateways (8 pares)

```
Arquivos: 68
Gateways: 8 pares (update, sync-page, query, change-stage, consult, cancel, creation, lifecycle)
Use-cases: 9
Rotas: commands(6) + read(6) + callbacks(2) = 14 endpoints
Jobs: 3 + 1 .disabled
```

**Diferenciais:** Maior número de gateways (8 portas). CRUD bidirecional completo com lifecycle. Tem schemas, openapi e callbacks.

**Gaps:** `114/120 ≈ 95%`:
- `saveMany()` ausente na sync store
- Códigos de erro Omie podem não estar 100% mapeados
- Sem `application/mappers/` e `application/utils/`

---

### 3. `sales-order-sync` — � Sync-only com Read-Models Ricos

```
Arquivos: 30
Gateways: 1 par (fetch-page)
Use-cases: 3
Rotas: commands(1) + read(6) + callbacks(2) = 9 endpoints
Jobs: 3 (register, handler, job)
```

**Diferenciais:** Mais enxuto (sync-only). Read-models ricos (summary, transitions, open-items). Schemas Zod + OpenAPI completos com exemplos de erro. Callbacks fake-only com retorno 405 em real.

**Gaps:** `104/104 ≈ 100%` (nos itens aplicáveis):
- Nenhum — todos os 4 gaps identificados foram corrigidos

---

## 📊 Comparativo Detalhado por Categoria

### 1. Estrutura de Diretórios

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 1.1 Árvore completa | ✅ | ✅ | ✅ |
| 1.2 index.ts | ✅ | ✅ | ✅ |
| 1.3 Register | ✅ | ✅ | ✅ |
| 1.4 README.md | ✅ | ✅ | ✅ |
| **Total** | **4/4 (100%)** | **4/4 (100%)** | **4/4 (100%)** |

---

### 2. Ports

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 2.1 Toda opção tem porta | ✅ | ✅ | ✅ |
| 2.2 Mutação com interface | ✅ | ✅ | ❌ N/A |
| 2.3 Leitura só type | ✅ | ❌ | ✅ |
| 2.4 Tipos na porta | ✅ | ✅ | ✅ |
| 2.5 updatedSince + updatedAt | ✅ | ✅ | ✅ |
| 2.6 Lifecycle interface | ✅ | ✅ | ❌ N/A |
| **Total** | **6/6 (100%)** | **5/6 (83%)** | **4/4 (100%)** |

> **Observação:** sales-order-sync não tem lifecycle port (sync-only). production-orders usa `interface` para sync-page (não `type`).

---

### 3. Use Cases

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 3.1 Nomenclatura | ✅ | ✅ | ✅ |
| 3.2 enqueue-* | ✅ | ✅ | ❌ N/A |
| 3.3 process-* | ✅ | ✅ | ❌ N/A |
| 3.4 enqueueJob singletonKey | ✅ | ✅ | ❌ N/A |
| 3.5 localConcurrency 1 | ✅ | ✅ | ❌ N/A |
| 3.6 Sem Prisma direto | ✅ | ✅ | ✅ |
| 3.7 5 args construtor | ✅ | ✅ | ✅* |
| 3.8 noWrite mode | ✅ | ✅ | ✅ |
| 3.9 fetchPageWithRetry | ✅ | ✅ | ✅ |
| 3.10 lastSyncAt incremental | ✅ | ✅ | ✅ |
| 3.11 SyncHooksRunner | ✅ | ✅ | ✅ |
| 3.12 updateLastSync | ✅ | ✅ | ✅ |
| 3.13 markConfirmed | ✅ | ✅ | ✅ |
| 3.14 markFailed | ✅ | ✅ | ✅ |
| 3.15 Logs estruturados | ✅ | ✅ | ✅ |
| 3.16 Função auxiliar | ✅ | ✅ | ✅ |
| **Total** | **16/16 (100%)** | **16/16 (100%)** | **12/12 (100%)** |

> \* sales-order-sync tem 7 args no construtor (2 extras para refresh pós-sync), mas segue o padrão base de 5.

---

### 4. Gateways

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 4.1 Real + Fake | ✅ | ✅ | ✅ |
| 4.2 Real chama Omie | ✅ | ✅ | ✅ |
| 4.3 Fake simulado | ✅ | ✅ | ✅ |
| 4.4 Seleção por env | ✅ | ✅ | ✅ |
| 4.5 OMIE_ENDPOINTS | ✅ | ✅ | ✅ |
| 4.6 Fake páginas mock | ✅ | ✅ | ✅ |
| 4.7 Filtro híbrido | ✅ | ✅ | ✅ |
| 4.8 Circuit breaker | ✅ | ✅ | ❌ N/A |
| 4.9 Lifecycle | ✅ | ✅ | ❌ N/A |
| 4.10 Portas em app/ | ✅ | ✅ | ✅ |
| **Total** | **10/10 (100%)** | **10/10 (100%)** | **8/8 (100%)** |

---

### 5. Stores

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 5.1 getOrCreateAccepted | ✅ | ✅ | ✅ |
| 5.2 markConfirmed/Failed | ✅ | ✅ | ✅ |
| 5.3-5.5 Command queue | ✅ | ✅ | ❌ N/A |
| 5.6 countByStatus/list | ✅ | ✅ | ✅ |
| 5.7 save() | ✅ | ✅ | ✅ |
| 5.8 saveMany() | ⬜ | ⬜ | ✅ |
| 5.9 Adapter mapping | ✅ | ✅ | ✅ |
| 5.10 list() paginado | ✅ | ✅ | ✅ |
| 5.11 getByCode() | ✅ | ✅ | ✅ |
| 5.12 getStats() | ✅ | ✅ | ✅ |
| 5.13 Store em infra/db/ | ✅ | ✅ | ✅ |
| 5.14 PrismaSyncStateStore | ✅ | ✅ | ✅ |
| 5.15 Store específica | ❌ N/A | ❌ N/A | ❌ N/A |
| **Total** | **10/11 (91%)** | **10/11 (91%)** | **11/11 (100%)** |

---

### 6. Jobs

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 6.1 Handler factory | ✅ | ✅ | ✅ |
| 6.2 Register orquestra | ✅ | ✅ | ✅ |
| 6.3 localConcurrency 1 | ✅ | ✅ | ✅ |
| 6.4 retryLimit/Backoff | ✅ | ✅ | ✅ |
| 6.5 Reconcile job | ✅ | ✅ | ❌ N/A |
| 6.6 Cron config env | ✅ | ✅ | ✅ |
| 6.7 Disable flag | ✅ | ✅ | ✅ |
| 6.8 try/catch logging | ✅ | ✅ | ✅ |
| **Total** | **8/8 (100%)** | **8/8 (100%)** | **7/7 (100%)** |

---

### 7. Routes

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 7.1 Prefixo commands | ✅ | ✅ | ✅ |
| 7.2 202 Accepted | ✅ | ✅ | ✅ |
| 7.3 Zod validation | ✅ | ✅ | ✅ |
| 7.4 externalRequestId | ✅ | ✅ | ✅ |
| 7.5 lastSyncAt | ✅ | ✅ | ✅ |
| 7.6 Prefixo callbacks | ✅ | ✅ | ✅ |
| 7.7 Fake-only 405 | ✅ | ✅ | ✅ |
| 7.8 Confirm | ✅ | ✅ | ✅ |
| 7.9 Fail | ✅ | ✅ | ✅ |
| 7.10 Tracking GET | ✅ | ✅ | ✅ |
| 7.11 Status + timestamps | ✅ | ✅ | ✅ |
| 7.12 404 tracking | ✅ | ✅ | ✅ |
| 7.13 Prefixo read | ✅ | ✅ | ✅ |
| 7.14 List paginado | ✅ | ✅ | ✅ |
| 7.15 Detalhe /:id | ✅ | ✅ | ✅ |
| 7.16 Stats | ✅ | ✅ | ✅ |
| 7.17 Queue | ✅ | ✅ | ✅ |
| 7.18 Failures | ✅ | ✅ | ✅ |
| 7.19 Refresh (opcional) | ❌ N/A | ❌ N/A | ❌ N/A |
| 7.20 Read sem Omie | ✅ | ✅ | ✅ |
| 7.21 Sem side effects | ✅ | ✅ | ✅ |
| 7.22 routes.ts | ✅ | ✅ | ✅ |
| 7.23 Organização | ✅ | ✅ | ✅ |
| **Total** | **22/22 (100%)** | **22/22 (100%)** | **22/22 (100%)** |

---

### 8. Schemas/OpenAPI

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 8.1 schemas.ts Zod | ✅ | ✅ | ✅ |
| 8.2 Erros padronizados | ✅ | ✅ | ✅ |
| 8.3 openapi.ts docs | ✅ | ✅ | ✅ |
| 8.4 Exemplos de erro | ✅ | ✅ | ✅ |
| 8.5 DTOs | ❌ N/A | ❌ N/A | ❌ N/A |
| **Total** | **4/4 (100%)** | **4/4 (100%)** | **4/4 (100%)** |

---

### 9. Cross-Cutting

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 9.1 externalRequestId | ✅ | ✅ | ✅ |
| 9.2 Idempotência | ✅ | ✅ | ✅ |
| 9.3 singletonKey | ✅ | ✅ | ✅ |
| 9.4 getLogger | ✅ | ✅ | ✅ |
| 9.5 Logs c/ requestId | ✅ | ✅ | ✅ |
| 9.6 Logs de página | ✅ | ✅ | ✅ |
| 9.7 Erros c/ stack | ✅ | ✅ | ✅ |
| 9.8 sleep 700ms | ✅ | ✅ | ✅ |
| 9.9 localConcurrency 1 | ✅ | ✅ | ✅ |
| 9.10 Circuit breaker | ✅ | ✅ | ✅ |
| 9.11 try/catch | ✅ | ✅ | ✅ |
| 9.12 markFailed | ✅ | ✅ | ✅ |
| 9.13 retryLimit 2 | ✅ | ✅ | ✅ |
| 9.14 Erros padronizados | ✅ | ✅ | ✅ |
| 9.15 Omie adapter | ✅ | ⬜ | ✅ |
| 9.16 Campos BR | ✅ | ✅ | ✅ |
| 9.17 Erros Omie mapeados | ✅ | ⬜ | ✅ |
| 9.18 Prisma omie_* | ✅ | ✅ | ✅ |
| 9.19 Comandos c/ campos | ✅ | ✅ | ✅ |
| 9.20 lastSyncAt | ✅ | ✅ | ✅ |
| **Total** | **20/20 (100%)** | **18/20 (90%)** | **20/20 (100%)** |

---

### 10. Config (Env Vars)

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 10.1 Gateway env | ✅ | ✅ | ✅ |
| 10.2 Cron env | ✅ | ✅ | ✅ |
| 10.3 Disable flag | ✅ | ✅ | ✅ |
| 10.4 Documentadas | ✅ | ✅ | ✅ |
| **Total** | **4/4 (100%)** | **4/4 (100%)** | **4/4 (100%)** |

---

### 11. Testes/Fake

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 11.1 noWrite mode | ✅ | ✅ | ✅ |
| 11.2 Dados realistas | ✅ | ✅ | ✅ |
| 11.3 Páginas mock | ✅ | ✅ | ✅ |
| 11.4 Callbacks fake | ✅ | ✅ | ✅ |
| 11.5 405 em real | ✅ | ✅ | ✅ |
| **Total** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** |

---

### 12. Documentação

| Item | product-structure | production-orders | sales-order-sync |
|------|:-:|:-:|:-:|
| 12.1 README completo | ✅ | ✅ | ✅ |
| 12.2 Routes.md | ✅ | ✅ | ✅ |
| 12.3 openapi.ts | ✅ | ✅ | ✅ |
| **Total** | **3/3 (100%)** | **3/3 (100%)** | **3/3 (100%)** |

---

## 🔍 Gaps por Módulo

### `product-structure` — 1 gap (118/119 ≈ 99%)

| Item | Gap | Impacto |
|------|-----|---------|
| 5.8 | `saveMany()` ausente — faz `save()` item por item | Baixo — performance em sync de muitos itens |

### `production-orders` — 6 gaps (114/120 ≈ 95%)

| Item | Gap | Impacto |
|------|-----|---------|
| 2.3 | Sync-page usa `interface` em vez de `type` | Mínimo — convenção |
| 5.8 | `saveMany()` ausente | Baixo — performance |
| 7.x | 2 read-routes opcionais não implementadas | Baixo — funcionalidade extra |
| 9.15 | Sem adapter Omie compartilhado | Médio — duplicação de parsing |
| 9.17 | Erros Omie não 100% mapeados | Médio — diagnóstico |
| — | Sem `application/mappers/` e `application/utils/` | Baixo — organização |

### `sales-order-sync` — 0 gaps (104/104 ≈ 100% nos itens aplicáveis)

✅ **Todos os 4 gaps originais foram corrigidos:**
- Porta sync-page convertida de `interface` para `type`
- `saveMany()` agora usa `$transaction` com batch verdadeiro
- Rota GET `/read/:omieId` adicionada com store + OpenAPI
- `OmieSalesOrderAdapter` compartilhado em `@/shared/integrations/omie/`

---

## ⭐ Diferenciais de Cada Módulo

### `product-structure`
- ✅ **Único** com lifecycle gateway completo (porta dedicada + real/fake)
- ✅ **Único** com reconcile job programado
- ✅ **Único** com adapter Omie compartilhado
- ✅ **Único** com mapeamento completo de erros Omie
- ✅ 11 endpoints (commands 5 + read 4 + callbacks 2)

### `production-orders`
- ✅ **Maior número de gateways**: 8 pares real/fake
- ✅ **Maior número de endpoints**: 14 (commands 6 + read 6 + callbacks 2)
- ✅ CRUD bidirecional completo com lifecycle
- ✅ 68 arquivos — o módulo mais extenso

### `sales-order-sync`
- ✅ **Mais enxuto** (30 arquivos) — sync-only, sem complexidade CRUD
- ✅ **Read-models mais ricos**: summary, transitions, open-items
- ✅ OpenAPI com exemplos completos de erro (400, 404, 405, 500)
- ✅ Callbacks com retorno 405 em modo real (padrão correto)
- ✅ Pós-sync: refresh automático de product-catalog + summary

---

## 📊 Resumo Visual

```
                     product-structure    production-orders    sales-order-sync
                         (~99%)               (~95%)               (~100%)

Estrutura               ██████████          ██████████            ██████████
Ports                   ██████████          ██████████            ██████████
Use Cases               ██████████          ██████████            ██████████
Gateways                ██████████          ██████████            ██████████
Stores                  █████████░          █████████░            ██████████
Jobs                    ██████████          ██████████            ██████████
Routes                  ██████████          ██████████            ██████████
Schemas/OpenAPI         ██████████          ██████████            ██████████
Cross-Cutting           ██████████          █████████░            ██████████
Config                  ██████████          ██████████            ██████████
Testes/Fake             ██████████          ██████████            ██████████
Documentação            ██████████          ██████████            ██████████
```

---

## 🎯 Recomendações

### `sales-order-sync` — ✅ 100% atingido
Nenhuma recomendação pendente. Todos os 4 gaps foram fechados.

### Para `production-orders` atingir 100%
1. Converter porta de sync-page de `interface` para `type` (convenção canônica)
2. Mapeamento completo de erros Omie
3. Adicionar `application/mappers/` e `application/utils/`

### Para todo o ecossistema
1. Implementar `saveMany()` batch verdadeiro nos módulos que ainda usam loop individual
2. Replicar `OmieSalesOrderAdapter` como referência para novos adaptadores

---

> **Nota:** Todos os 3 módulos estão em estágio de **produção** (≥90%). O `sales-order-sync` agora está alinhado 100% com o template canônico (considerando que é sync-only).
