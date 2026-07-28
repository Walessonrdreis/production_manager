---
title: "Resumo de Atualizações — API (Fastify/Prisma) e correção do refresh de estoque Omie"
date: "2026-04-14"
project: "production_manager"
scope: "apps/api (+ ajustes pontuais no frontend/tests conforme necessário)"
---

# Resumo de Atualizações — 2026-04-14

## Contexto

Esta rodada de trabalho teve dois objetivos principais:

- Melhorar a DX da API com endpoints informativos, envelopes padronizados e erros padronizados.
- Implementar/persistir estoque Omie no banco e corrigir um bug real em runtime onde `POST /v1/omie/products/stock/refresh` retornava `500 INTERNAL_ERROR`.

## Principais mudanças entregues

### Endpoints informativos

- `GET /` retorna JSON com informações da API e dicas de uso.
- `GET /health` retorna JSON simples de saúde.
- `GET /v1` retorna um índice de rotas do v1, com exemplos/tags.

### Envelope de resposta padronizado (compatível com legado)

- Respostas padrão:
  - Item: `{ data: {...} }`
  - Lista/paginação: `{ data: [...], meta: { page, pageSize, total, ... } }`
- Compatibilidade para clientes antigos em listas via header:
  - `X-Response-Format: legacy`

### Erros padronizados globalmente

- Formato único: `{ error: { code, message, details?, requestId? } }`
- `ZodError` mapeado para `VALIDATION_ERROR` com `400`.

### Rotas Omie e Produtos (estoque, catálogo, detalhe)

Foram implementadas/ajustadas rotas para catálogo e estoque, com testes via `Fastify.inject()`:

- Categorias/famílias:
  - `GET /v1/omie/categories`
- Search/autocomplete:
  - `GET /v1/omie/products/search`
- Detalhe do produto Omie:
  - `GET /v1/omie/products/:id`
  - `GET /v1/omie/products/by-code/:omieCode`
- Produto gerenciado (item e update):
  - `GET /v1/products/:id`
  - `PATCH /v1/products/:id`
- Estoque persistido:
  - `POST /v1/omie/products/stock/refresh` persiste snapshots no banco
  - `GET /v1/omie/stock` retorna resumo do estoque no banco
  - `GET /v1/products/:id/stock` retorna último snapshot por produto
  - `GET /v1/products/:id/stock/history` retorna histórico paginado
  - `GET /v1/omie/products/:id/stock` e `GET /v1/omie/products/by-code/:omieCode/stock` retornam último snapshot por omieCode

## Mudanças de persistência (Prisma/PostgreSQL)

- `OmieProduct` ganhou persistência de:
  - `omieCode`
  - `familyDescription`
  - Com backfill/script para preencher dados existentes.
- Nova tabela de histórico de estoque (append-only):
  - `product_stock`
  - Model Prisma: `ProductStock` com colunas:
    - `omieCode` (VARCHAR(32))
    - `stockQuantity` (Decimal 18,4)
    - `minimumStock` (Decimal 18,4)
    - `capturedAt` (DateTime)

## Bug crítico corrigido: `POST /v1/omie/products/stock/refresh` retornando 500

### Sintoma

- Curl em ambiente local retornava:
  - `500 INTERNAL_ERROR` no endpoint de refresh.

### Causa raiz (confirmada por log em runtime)

- `PrismaClientKnownRequestError P2000` durante `productStock.createMany()`:
  - “The provided value for the column is too long for the column's type”
- Pelo menos um item do snapshot vinha com `omieCode` maior que `VARCHAR(32)`.
- Como era `createMany`, uma linha inválida derrubava o batch inteiro e virava `INTERNAL_ERROR`.

### Correções aplicadas

- Normalização defensiva do snapshot (Map, object, `{ items: ... }`) antes de iterar.
- Validação/limpeza antes de persistir:
  - Skipa `omieCode` vazio.
  - Skipa `omieCode` com comprimento > 32.
  - Skipa valores decimais fora do range esperado de `Decimal(18,4)` (limite conservador por dígitos inteiros).
- Resposta do refresh inclui contadores em `meta`:
  - `skippedTooLongOmieCode`
  - `skippedOutOfRangeDecimal`
- Ajuste das rotas de leitura de estoque para o schema correto:
  - Leitura passou a usar `stockQuantity/minimumStock` (em vez de colunas inexistentes `rawStockQuantity/rawMinimumStock/reported`).
  - Campo `reported` passou a ser derivado em runtime (`qty != null || min != null`) sem depender de coluna.

### Resultado

- Endpoint deixa de cair em 500 por causa de 1 item inválido.
- Curl local passou a retornar `200` com `{ data: { insertedCount, capturedAt }, meta: {...} }`.

Exemplo real observado:

```json
{
  "data": { "insertedCount": 1575, "capturedAt": "2026-04-14T21:08:56.642Z" },
  "meta": { "skippedTooLongOmieCode": 1, "skippedOutOfRangeDecimal": 0 }
}
```

## Testes e verificação

- Suite de testes (Vitest) cobrindo:
  - Endpoints informativos retornando JSON
  - Envelope e erros padronizados
  - Rotas Omie (categories/search/detail)
  - Rotas de estoque (produto/omie/by-code) e consumo “tipo frontend”
  - Refresh persistindo snapshot no banco (com mocks do cache e do Prisma)
- Verificação local via curl confirmando `200` no refresh após as correções.

## Observações importantes

- `PORT=3333` pode estar em uso por outro processo; em validações foi usado `PORT=3334`.
- Há aviso de engine: o projeto declara `node 20.x`, mas em alguns ambientes foi executado com Node 24.
