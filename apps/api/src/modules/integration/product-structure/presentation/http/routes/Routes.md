
# Product Structure — Routes

## 🚀 Comandos (POST)

### Sync estrutura
```
POST /v1/integration/product-structure/:productCode/sync
```
**Payload:**
```json
{ "externalRequestId": "obrigatório" }
```
**Descrição:** Sincroniza estrutura (BOM) do produto via Omie.

---

### Sync all (bulk)
```
POST /v1/integration/product-structure/sync-global
```
**Payload:**
```json
{
  "externalRequestId": "opcional - gerado automaticamente se omitido",
  "pageSize": 100,
  "maxPages": 1000
}
```
**Descrição:** Percorre todas as páginas de `ListarEstruturas` e atualiza o espelho local. Idempotente por `externalRequestId`.

---

### Aplicar estrutura
```
POST /v1/integration/product-structure/:productCode/apply
```
**Payload:**
```json
{
  "externalRequestId": "obrigatório",
  "structure": {
    "items": [{ "componentCode": "string", "quantity": 0 }]
  }
}
```
**Descrição:** Cria ou altera estrutura no Omie (IncluirEstrutura / AlterarEstrutura).

---

### Excluir estrutura
```
POST /v1/integration/product-structure/:productCode/delete
```
**Payload:**
```json
{ "externalRequestId": "obrigatório" }
```
**Descrição:** Exclui estrutura do produto no Omie.

---

### Submeter (reservado)
```
POST /v1/integration/product-structure/:productCode/submit
```
**⚠️ 501 Not Implemented** — Use `/apply` no MVP.

---

## 📘 Read-models (GET)

### Production readiness
```
GET /v1/admin/read/products/production-readiness
```
Indica se o produto pode gerar Ordem de Produção (baseado na existência de BOM).

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `view` | string | `summary` ou `data` |
| `q` | string | Busca por descrição ou código |
| `activeOnly` | boolean | `true` = apenas ativos |
| `structureStatus` | string | `with` ou `without` |
| `onlyWithoutStructure` | boolean | `true` = só sem estrutura |
| `limit` | number | Máx. itens (default: 50) |
| `offset` | number | Deslocamento |
| `sort` | string | `description`, `productCode`, `hasStructure` |
| `order` | string | `asc`, `desc` |
| `includeItems` | boolean | Incluir itens da estrutura no payload |

**Resposta (summary):**
```json
{
  "success": true,
  "summary": { "total": 1697, "withStructure": 374, "withoutStructure": 1323 }
}
```

* Apenas GET
* Apenas leitura
* Sem side effects
* Sem Fake/Real

#### `commands/`

* Apenas POST
* Sempre com efeito colateral
* Sempre com `externalRequestId`
* Sempre com Fake/Real


## 🔗 index.ts (agregador)

O arquivo `index.ts`:

* Importa todas as rotas do módulo
* Registra as rotas no `FastifyInstance`
* Não contém lógica de negócio

## 🔌 routes.ts (ponto único de registro)

O arquivo `presentation/http/routes.ts`:

* Importa `routes/index.ts`
* É o único ponto usado pelo `*-integration-register.ts`
* Evita registro duplicado de rotas


## ⚠️ Regras que não podem ser quebradas

* Não criar rotas fora deste diretório
* Não misturar READ e COMMAND no mesmo arquivo
* Não registrar rotas diretamente no app fora do módulo
* Não criar rotas genéricas ou ambíguas


## 🔄 Relação com API 2

* A API 2 consome apenas rotas documentadas em `apps/api/ROUTES.md`
* Este README explica **como o módulo está organizado internamente**
* A API 2 não conhece Omie nem acessa banco diretamente


## ✅ Este padrão deve ser replicado em

* Produtos
* Estoque
* Ordens de Produção
* Ordens de Venda
* Demais módulos de integração


# ✅ 3) ROUTES.md — ENTRADAS DO MÓDULO

📍 **Caminho**

apps/api/ROUTES.md

### ✅ Adicionar

## Product Structure (BOM)

### Read‑Models
- `GET /v1/admin/read/products/production-readiness`

### Comandos de Integração
- `POST /v1/integration/product-structure/:productCode/sync`
- `POST /v1/integration/product-structure/sync-global`
- `POST /v1/integration/product-structure/:productCode/apply`
- `POST /v1/integration/product-structure/:productCode/delete`

### Jobs
- Product Structure Sync (cron)
  - Controlado por `ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB`
  - Agenda via `OMIE_PRODUCT_STRUCTURE_SYNC_CRON`