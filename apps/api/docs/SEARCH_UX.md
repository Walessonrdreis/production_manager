# 🔍 Search UX Infrastructure

Sistema de busca universal para ordens de produção, implementado como
**read model enriquecido** (API 1 — Integration Layer).

## Arquitetura — Quatro Pilares

```
┌─────────────────────────────────────────────────────────┐
│                  Search UX Infrastructure               │
├─────────────────────────────────────────────────────────┤
│  1. Canonical Model    Read model com campos            │
│                        normalizados + stage UX          │
│                                                        │
│  2. Universal Search   Endpoint list-unified com        │
│   (q)                  detecção automática de tipo      │
│                                                        │
│  3. Autocomplete       Endpoint search-suggestions      │
│                        com prefix matching              │
│                                                        │
│  4. Intelligent        Score por campo com pesos        │
│     Ranking            (ALL vs PARTIAL matching)        │
└─────────────────────────────────────────────────────────┘
```

## 1. Normalização

### `normalize(str: string): string`
- Lower case + remoção de acentos (NFD)
- Substitui `%` e `/` por espaço
- `NORMALIZE_VERSION = 1` (incrementar se algoritmo mudar)

O mesmo algoritmo é aplicado tanto no **write path** (ao construir o
read model) quanto no **read path** (ao processar a query `q`),
garantindo matching consistente.

### Campos Normalizados no Read Model

| Coluna | Tipo | Origem |
|---|---|---|
| `product_name_normalized` | `TEXT` | `normalize(product?.description ?? null)` |
| `product_code_normalized` | `VARCHAR(64)` | `normalize(bridge.internalToOmie.get(...))` |
| `order_number_normalized` | `VARCHAR(32)` | `normalize(op.orderNumber)` |
| `normalize_version` | `INTEGER` | `NORMALIZE_VERSION` (default 0 → será atualizado no refresh) |

## 2. Tokenização

### `tokenize(q: string): string[]`
- Split por espaços
- Remove tokens < 2 caracteres
- Usado para busca multi-token (AND de ORs) e scoring

## 3. Detecção de Tipo de Query

### `detectQueryType(q: string): QueryType`
- `"omieId"` — string com `@` ou formato numérico exato
- `"orderNumber"` — contém `/` (ex: `2025/01535`)
- `"code"` — string curta, prefixo numérico
- `"text"` — fallback para busca textual genérica

Cada tipo constrói um filtro WHERE diferente no Prisma:

| Tipo | Filtro |
|---|---|
| `omieId` | `omieId: { equals: q }` |
| `orderNumber` | `orderNumber ILIKE q OR orderNumberNormalized ILIKE normalize(q)` |
| `code` | `productCode ILIKE q OR productCodeNormalized ILIKE normalize(q)` |
| `text` | OR de campos normalizados + tokenização multi-token |

## 4. Stage UX

### `resolveStage(stage: string | null): { stageName, stageOrder, stageGroup }`
Mapeia o código numérico bruto do Omie para valores de UX:

| Código | Nome UX | Ordem | Grupo |
|---|---|---|---|
| `10` | Planejada | 10 | planning |
| `20` | Liberada | 20 | planning |
| `30` | Separação Inicial | 30 | separation |
| `40` | Separação | 40 | separation |
| `60` | Fabricação | 60 | production |
| `80` | Concluída | 80 | completed |
| `*` | (fallback) | 999 | unknown |

### `shouldSearchStage(q: string): boolean`
Guard para ativar busca textual por nome de estágio.
Requer que pelo menos um token tenha >= 3 caracteres.

## 5. Scoring

### `score(tokens: string[], fields: ScorableFields): { score, matchedFields }`

| Campo | ALL tokens | PARTIAL token |
|---|---|---|
| `productName` | 100 | 60 |
| `productCode` | 95 | 55 |
| `orderNumber` | 100 | 70 |
| `stageName` | 80 | 40 |

O score final é a **soma** dos scores individuais de cada campo,
permitindo que registros que batem em múltiplos campos fiquem no topo.

## 6. Endpoints

### `GET /v1/integration/production-orders/read/list-unified`

Lista unificada com suporte a `q` (universal search).

**Parâmetros:**
- `q` — string de busca (detecção automática de tipo)
- `limit` — max results (default 50, max 500)
- `offset` — paginação
- `isOpen`, `isLate`, `isReady`, `isBlocked` — filtros booleanos
- `priority` — `low`, `medium`, `high`, `critical`
- `operationalStatus` — `NO_STRUCTURE`, `READY_TO_START`, etc.
- `stage` — código numérico do estágio
- `productCode`, `orderNumber` — filtros exatos
- `startDateFrom`, `startDateTo`, `completionDateFrom`, `completionDateTo`

**Comportamento da busca `q`:**
1. Detecta tipo da query
2. Constrói filtro apropriado (omieId exato, prefix orderNumber, etc.)
3. Para busca textual: busca nos campos normalizados
4. Pós-consulta: re-ranking por score de relevância

### `GET /v1/integration/production-orders/read/search-suggestions`

Autocomplete para barra de busca.

**Parâmetros:**
- `q` — string parcial (mínimo 2 caracteres)

**Retorno:**
```json
{
  "suggestions": [
    { "text": "Cacau 42%", "type": "product", "score": 90 },
    { "text": "CAC-001", "type": "code", "score": 85 },
    { "text": "2025/01535", "type": "order", "score": 100 },
    { "text": "Fabricação", "type": "stage", "score": 80 }
  ]
}
```

**Tipos de sugestão:**
- `product` — nome do produto
- `code` — código do produto
- `order` — número da ordem de produção
- `stage` — nome do estágio

## 7. Fluxo Completo (Read Path)

```
Usuário digita "cacau 42"
        │
        ▼
  normalize("cacau 42") → "cacau 42"
  tokenize("cacau 42") → ["cacau", "42"]
  detectQueryType("cacau 42") → "text"
        │
        ▼
  Autocomplete (prefix):
    WHERE productNameNormalized STARTS WITH "cacau"
       OR productCodeNormalized STARTS WITH "cacau"
    AND  productNameNormalized CONTAINS "42"
    AND  productCodeNormalized CONTAINS "42"
        │
        ▼
  List-Unified (full search):
    WHERE productNameNormalized CONTAINS "cacau 42"
       OR productCodeNormalized CONTAINS "cacau 42"
    → fetch results
    → score(tokens=["cacau","42"], record fields)
    → sort by score DESC
        │
        ▼
  Resultado: OPs com "Cacau 42%" no topo
             (score=100 productName ALL + 95 productCode ALL = 195)
```

## 8. Fluxo Completo (Write Path)

```
Omie Sync
    │
    ▼
  buildProductionOrderReadModel(op, product, ...)
    │
    ├─ resolveStage(op.stage) → stageName, stageOrder, stageGroup
    ├─ normalize(op.orderNumber) → orderNumberNormalized
    ├─ normalize(product.description) → productNameNormalized
    └─ normalize(bridge productCode) → productCodeNormalized
    │
    ▼
  Persist → read_model.production_order_read_model
