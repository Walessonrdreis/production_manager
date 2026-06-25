
# 🗺️ API 1 — Contrato Técnico de Rotas

> **📌 DOCUMENTAÇÃO RELACIONADA**:
> - [PROJECT_MANUAL.md](../../docs/PROJECT_MANUAL.md) - Visão geral e padrões
> - [DOMAIN_NAMING_GUIDE.md](../../docs/DOMAIN_NAMING_GUIDE.md) - Nomenclatura canônica
> - [ARCHITECTURE_GUIDE.md](../../docs/ARCHITECTURE_GUIDE.md) - Arquitetura técnica
> - [MODULE_TEMPLATE.md](../../docs/MODULE_TEMPLATE.md) - Template de implementação

Este arquivo é a **fonte de verdade canônica para todas as rotas da API 1**.  
Ele serve como **contrato técnico obrigatório** para:

1. **API 2** - Consumidor principal
2. **Desenvolvedores** - Referência de implementação
3. **Agentes AI** - Documentação precisa para automação

---

## 📋 Estrutura Canônica de Documentação

Cada módulo DEVE seguir esta estrutura exata:

```
## [NOME DO MÓDULO] — [DESCRIÇÃO DO DOMÍNIO]

### ✅ Responsabilidades do módulo
- ✅ [Responsabilidade 1]
- ✅ [Responsabilidade 2]
- ❌ [O que NÃO faz]

### ✅ Rota — [Nome da funcionalidade]
[MÉTODO] [PATH]

#### Query params suportados
- [param]=[valores]

#### Payload (se aplicável)
```json
{
  "externalRequestId": "<string>"
}
```

#### Descrição
* [Comportamento específico]
* [Regras de negócio]
* [Observações importantes]

### ✅ Exemplo de resposta
```json
{
  "campo": "valor"
}
```

*** [Separador entre módulos]
```

---

## ✅ Read‑Models (somente leitura)

---

## Product Structure — Production Readiness

Este módulo fornece o **read‑model canônico de readiness de produção** dos produtos,
baseado na **existência de estrutura (BOM)**.

Ele responde à pergunta de negócio:

> **"Este produto pode gerar Ordem de Produção agora?"**

---

### ✅ Responsabilidades do módulo

- ✅ Consolidar dados de produto + estrutura
- ✅ Expor decisão pronta (`canCreateProductionOrder`)
- ✅ Servir dashboards, validações e bloqueios
- ❌ Não cria Ordem de Produção
- ❌ Não chama Omie em read‑model
- ❌ Não executa efeitos colaterais

---

### ✅ Rota — Readiness de produtos para produção

```
GET /v1/admin/read/products/production-readiness
```

#### Query params suportados

- `view=summary | data`
- `q=<string>`
- `activeOnly=true|false`
- `structureStatus=with|without`
- `onlyWithoutStructure=true|false`
- `limit=<number>`
- `offset=<number>`
- `sort=description|productCode|hasStructure`
- `order=asc|desc`
- `since=<ISO date>`
- `includeItems=true|false`

#### Comportamento

- Sem `view`: retorna `summary + data`
- `view=summary`: retorna apenas agregados
- `view=data`: retorna apenas lista

---

### ✅ Exemplo de resposta — Summary

```json
{
  "summary": {
    "total": 1697,
    "withStructure": 374,
    "withoutStructure": 1323,
    "canCreateProductionOrder": 374,
    "blockedFromProduction": 1323
  }
}
```

**Descrição:**

* Read‑model agregado
* **Não chama Omie**
* **Não escreve no banco**
* Usado por dashboards e validação antes de comandos

***

### ✅ Rota — Status de comando de integração

```
GET /v1/integration/product-structure/sync-status/:externalRequestId
```

**Descrição:**

* Retorna o status de um comando de integração (SYNC/APPLY/DELETE)
* Parâmetro `externalRequestId` vem na URL (path param)
* Retorna 404 se o comando não existir

### ✅ Exemplo de resposta

```json
{
  "success": true,
  "data": {
    "externalRequestId": "meu-sync-001",
    "productCode": "100kg",
    "commandType": "SYNC",
    "status": "CONFIRMED",
    "source": "API2",
    "executedAt": "2026-06-22T13:23:33.505Z",
    "completedAt": "2026-06-22T13:23:35.120Z",
    "lastError": null
  }
}
```

***

### ✅ Rota — Sumário de estruturas

```
GET /v1/integration/product-structure/summary
```

#### Query params suportados

- `onlyWithStructure=true|false`
- `q=<string>`
- `limit=<number>`
- `offset=<number>`

**Descrição:**

* Lista resumida de produtos com estrutura espelhada
* Inclui estatísticas de comandos (accepted/confirmed/failed)
* Apenas leitura — sem side effects

### ✅ Exemplo de resposta

```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 356,
      "withStructure": 356,
      "withoutStructure": 0,
      "commands": { "accepted": 0, "confirmed": 1, "failed": 0 }
    },
    "meta": { "limit": 50, "offset": 0, "returned": 10 },
    "items": [
      {
        "productCode": "100kg",
        "description": "100% cacau 1 Kg",
        "hasStructure": true,
        "componentCount": 5,
        "lastSyncAt": "2026-06-22T13:23:33.505Z"
      }
    ]
  }
}
```

***

## ✅ Comandos de Integração (efeito colateral)

**📌 REGRAS CANÔNICAS PARA TODOS OS COMANDOS:**

1. **Idempotência**: Todos os comandos são idempotentes por `externalRequestId`
2. **External Request ID**: Campo `externalRequestId` obrigatório em todos os payloads
3. **Status Code**: Retorna **202 Accepted** para comandos aceitos
4. **Gateway Control**: Fake/Real controlado por env (`{MODULO}_GATEWAY=fake|real`)
5. **Anti-Corruption**: Executa lógica exclusivamente via API 1

---

## Product Structure (BOM)

### 🔹 Sincronizar estrutura do produto (on‑demand)

```
POST /v1/integration/product-structure/:productCode/sync
```

**Payload:**

```json
{
  "externalRequestId": "<string>"
}
```

**Descrição:**

* Dispara sincronização da estrutura no Omie
* Atualiza espelho local
* Usado quando produto está sem estrutura ou para reconciliação manual

***

### 🔹 Aplicar estrutura no produto (Incluir / Alterar)

```
POST /v1/integration/product-structure/:productCode/apply
```

**Payload:**

```json
{
  "externalRequestId": "<string>",
  "structure": {
    "items": [
      {
        "componentCode": "<string>",
        "quantity": <number>
      }
    ]
  }
}
```

**Descrição:**

* Cria ou altera estrutura no Omie
* Decide internamente entre **IncluirEstrutura** ou **AlterarEstrutura**
* Atualiza espelho local após execução

***

### 🔹 Excluir estrutura do produto

```
POST /v1/integration/product-structure/:productCode/delete
```

**Payload:**

```json
{
  "externalRequestId": "<string>"
}
```

**Descrição:**

* Exclui a estrutura do produto no Omie
* Atualiza espelho local
* Bloqueia produto para produção

*** 

### 🔹 Sync global (todas as estruturas)

```
POST /v1/integration/product-structure/sync-global
```

**Payload (todos opcionais):**

```json
{
  "externalRequestId": "<string> (opcional — gerado automático se omitido)",
  "pageSize": "<number> (opcional)",
  "maxPages": "<number> (opcional)"
}
```

**Descrição:**

* Comando de integração: percorre todas as páginas de `ListarEstruturas` do Omie
* Sincronização incremental com retry adaptativo
* Idempotente por `externalRequestId`
* Se omitido, `externalRequestId` é gerado automaticamente (product-structure-global-{timestamp})
* ⚠️ **Requer Content-Type: application/json** mesmo com body vazio

***

### 🔹 Submeter estrutura (reservado)

```
POST /v1/integration/product-structure/:productCode/submit
```

**⚠️ 501 Not Implemented** — Rota reservada para fluxo de draft/aprovação futuro. Usar `/apply` no MVP.

---

## 📋 TEMPLATE PARA NOVOS MÓDULOS

> **⚠️ IMPORTANTE**: Ao criar um novo módulo, COPIE esta seção e substitua `[nome-do-modulo]` pelo nome canônico seguindo [DOMAIN_NAMING_GUIDE.md](../../docs/DOMAIN_NAMING_GUIDE.md).

***

## [nome-do-modulo] — [Descrição do domínio]

> **📌 EXEMPLO CANÔNICO**: `sales-order-sync` - Sincronização bidirecional de pedidos de venda

### ✅ Responsabilidades do módulo

- ✅ [Responsabilidade específica 1]
- ✅ [Responsabilidade específica 2]
- ❌ [O que NÃO faz - ex: "Não processa pedidos de produção"]

### ✅ Rota — [Nome da funcionalidade]

```
[MÉTODO] /v1/integration/[nome-do-modulo]/:identificador/[ação]
```

**Exemplo canônico:**
```
POST /v1/integration/sales-order/:orderCode/sync
```

#### Query params suportados (se aplicável)

- `param=valor`

#### Payload

```json
{
  "externalRequestId": "<string>",
  "dados": {
    // Campos específicos do módulo
  }
}
```

#### Descrição

* [Comportamento específico da rota]
* [Regras de negócio aplicáveis]
* [Observações importantes para consumidores]

### ✅ Exemplo de resposta

```json
{
  "status": "ACEITO",
  "externalRequestId": "<string>",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## ✅ Jobs / Admin

### [Nome do Job] (cron)

**Controle por variáveis de ambiente:**

```env
ENABLE_OMIE_[NOME_DO_MODULO]_[AÇÃO]_JOB=true|false
OMIE_[NOME_DO_MODULO]_[AÇÃO]_CRON=0 */12 * * *
```

**Exemplo canônico:**
```env
ENABLE_OMIE_SALES_ORDER_SYNC_JOB=true
OMIE_SALES_ORDER_SYNC_CRON=0 */6 * * *
```

**Comportamento:**

* Executa ação periódica
* Usa idempotência por identificador
* Não concorre com comandos HTTP
* Não depende da API 2

---

## ✅ Observações Importantes

* **External Request ID**: Campo obrigatório em todos os comandos para idempotência
* **Separação de responsabilidades**: API 2 **NUNCA** chama Omie diretamente
* **Consumo canônico**: API 2 **SEMPRE** consome a API 1
* **Read‑models**: Não executam efeitos colaterais
* **Jobs**: Controlados exclusivamente por variáveis de ambiente
* **Nomenclatura**: Seguir [DOMAIN_NAMING_GUIDE.md](../../docs/DOMAIN_NAMING_GUIDE.md) para nomes canônicos

---

## 🚀 Como Adicionar um Novo Módulo

1. **Escolher nome canônico**: Seguir princípio "Entidade Específica + Capacidade"
2. **Criar estrutura**: Usar `pnpm --filter api gen:module`
3. **Implementar código**: Seguir [MODULE_TEMPLATE.md](../../docs/MODULE_TEMPLATE.md)
4. **Documentar rotas**: Adicionar seção neste arquivo seguindo o template acima
5. **Atualizar bootstrap**: Registrar módulo em `apps/api/src/bootstrap/routes.ts`
6. **Configurar env**: Adicionar variáveis de ambiente necessárias


## Product Catalog — Catálogo de Produtos (espelho Omie)

### ✅ Responsabilidades do módulo
- ✅ Manter espelho local do catálogo de produtos para consumo pela API 2
- ✅ Expor read-model para consulta rápida
- ✅ Permitir sync on-demand por produto
- ❌ Não executa efeitos colaterais em read-model
- ❌ Não expõe payload do Omie para consumidores

### ✅ Rota — Listagem/read-model do catálogo
GET /v1/admin/read/products/catalog

#### Query params suportados
- `view=summary|data`
- `q=<string>`
- `activeOnly=true|false`
- `limit=<number>`
- `offset=<number>`
- `sort=description|productCode|lastSyncAt`
- `order=asc|desc`
- `since=<ISO date>`

#### Comportamento
- Sem `view`: retorna `summary + data`
- `view=summary`: retorna apenas agregados
- `view=data`: retorna apenas lista

### ✅ Rota — Produto específico do catálogo
GET /v1/admin/read/products/catalog/:productCode

#### Comportamento
- Retorna produto específico do espelho `omie_product`
- Não chama Omie
- Não escreve no banco

### ✅ Rota — Sincronizar produto do catálogo (on-demand)
POST /v1/integration/product-catalog/:productCode/sync

#### Payload
{
  "externalRequestId": "<string>"
}

#### Descrição
- Busca produto no Omie (fake/real controlado por env)
- Atualiza espelho local em `omie_product`
- Usa idempotência por `externalRequestId`
- Retorna `202 Accepted`

#### Exemplo de resposta
{
  "success": true,
  "data": {
    "status": "ACCEPTED",
    "externalRequestId": "<string>",
    "productCode": "<string>"
  }
}



# ✅ ✅ DOCUMENTAÇÃO COMPLETA DO NOVO ENDPOINT

Você pode colocar assim 👇

***

## ✅ Endpoint

```
GET /v1/products/catalog/production-ready
```

***

## ✅ Descrição

```
Retorna catálogo consolidado com dados essenciais para produção,
incluindo estoque e indicação de estrutura do produto.

Endpoint otimizado para consumo pela API2 e fluxos operacionais.
```

***

## ✅ Query Params

```
q                 string    (opcional) → busca por descrição, código ou SKU
onlyActive        boolean   (default: true)
onlyInStock       boolean   (default: false)
minStock          number    (default: 0)
limit             number    (default: 100)
offset            number    (default: 0)
sort              string    (description | productCode | stock | lastSyncAt)
order             string    (asc | desc)
withAvailability  boolean   (default: true)
```

***

## ✅ Response

```json
{
  "success": true,
  "summary": {
    "total": 1747,
    "available": 1500,
    "unavailable": 247
  },
  "meta": {
    "pageSize": 100,
    "pageCount": 100,
    "offset": 0
  },
  "data": [
    {
      "productCode": "55P",
      "description": "55% cacau-Intenso ao Leite 30g",
      "sku": null,
      "active": true,
      "family": null,
      "unit": "UND",
      "lastSyncAt": "2026-01-28T10:59:04Z",

      "stock": 120,
      "minimumStock": 10,
      "available": true,

      "hasStructure": true,
      "structureItemsCount": 8
    }
  ]
}
```

***

# ✅ ✅ EXPLICAÇÃO DOS CAMPOS (ESSENCIAL)

Adicione uma seção explicando os novos campos 👇

***

## ✅ Campos adicionais

```
stock → quantidade atual em estoque consolidado
minimumStock → estoque mínimo configurado
available → indica se produto atende regra de disponibilidade (stock >= minStock)

hasStructure → indica se o produto possui estrutura (BOM)
structureItemsCount → quantidade de componentes da estrutura
```

***

# ✅ ✅ REGRA IMPORTANTE QUE DEVE ENTRAR NO DOC

👉 isso evita erro de quem consumir

```
⚠️ O endpoint NÃO retorna os itens da estrutura.

Para obter a estrutura completa do produto,
utilizar o módulo product-structure.
```

***

# ✅ ✅ DOCUMENTAR O CARÁTER DO ENDPOINT

Adicione isso (muito importante):

```
✅ Este endpoint é considerado CONTRATO DE PRODUÇÃO.

- Não deve quebrar compatibilidade
- Deve manter payload estável
- Deve permanecer desacoplado do formato do Omie
```

***

# 💥 ✅ POR QUE ISSO É IMPORTANTE

👉 porque agora você tem:

```
endpoint técnico → /admin/read ❌
endpoint de produto → production-ready ✅
```

👉 e esse segundo é o que:

```
API2 consome ✅
frontend usa ✅
negócio depende ✅
```

***

# ✅ ✅ RESULTADO FINAL

Seu módulo agora tem:

```
✔ endpoint genérico (flexível)
✔ endpoint de produção (contrato)
✔ payload otimizado
✔ desacoplamento do Omie
✔ documentação clara
```


# ✅ ✅ DOCUMENTAÇÃO COMPLETA DO MÓDULO

Agora vou te entregar **todo o bloco pronto** 👇

***

# ✅ 📘 1 - READ‑MODELS (GET)

***

## ✅ Catálogo completo (flexível)

```
GET /v1/admin/read/products/catalog
```

### Descrição

```
Retorna o catálogo de produtos sincronizado do Omie com suporte a filtros,
paginação, ordenação e seleção de campos.
```

***

## ✅ Produto por código

```
GET /v1/admin/read/products/catalog/:productCode
```

### Descrição

```
Retorna os dados detalhados de um produto específico do catálogo.
```

***

## ✅ Estatísticas do catálogo

```
GET /v1/admin/read/products/catalog/stats
```

### Descrição

```
Retorna estatísticas agregadas do catálogo local.
```

***

## ✅ Catálogo resumido (API2)

```
GET /v1/products/catalog/summary
```

### Descrição

```
Retorna versão simplificada do catálogo para consumo leve pela API2.
```

***

## ✅ Catálogo pronto para produção (API2)

```
GET /v1/products/catalog/production-ready
```

### Descrição

```
Retorna catálogo consolidado com estoque, disponibilidade e indicação
de estrutura, otimizado para uso em produção pela API2.
```

***

### Query Params

```
q                 string
onlyActive        boolean (default: true)
onlyInStock       boolean (default: false)
minStock          number  (default: 0)
limit             number  (default: 100)
offset            number  (default: 0)
sort              description | productCode | stock | lastSyncAt
order             asc | desc
withAvailability  boolean (default: true)
```

***

### Response

```json
{
  "success": true,
  "summary": {
    "total": 1747,
    "available": 1500,
    "unavailable": 247
  },
  "meta": {
    "pageSize": 100,
    "pageCount": 100,
    "offset": 0
  },
  "data": [
    {
      "productCode": "55P",
      "description": "Produto exemplo",
      "sku": null,
      "active": true,
      "family": null,
      "unit": "UND",
      "lastSyncAt": "2026-01-01T00:00:00Z",

      "stock": 120,
      "minimumStock": 10,
      "available": true,

      "hasStructure": true,
      "structureItemsCount": 8
    }
  ]
}
```

***

### Campos adicionais

```
stock → quantidade atual em estoque
minimumStock → estoque mínimo configurado
available → produto atende regra de disponibilidade

hasStructure → indica se o produto possui estrutura (BOM)
structureItemsCount → quantidade de itens da estrutura
```

***

### ⚠️ Observação importante

```
Este endpoint NÃO retorna os itens da estrutura.

Para obter a estrutura completa, utilizar o módulo product-structure.
```

***

## ✅ Status de sync

```
GET /v1/integration/product-catalog/sync-status/:externalRequestId
```

### Descrição

```
Retorna o status de um comando de sincronização.
```

***

## ✅ Histórico de sync

```
GET /v1/integration/product-catalog/sync-history
```

### Descrição

```
Retorna os últimos comandos executados do catálogo.
```

***

## ✅ Sync com falha

```
GET /v1/integration/product-catalog/sync-failures
```

### Descrição

```
Retorna comandos que falharam, para debug e retry.
```

***

## ✅ Último sync global

```
GET /v1/integration/product-catalog/last-sync
```

### Descrição

```
Retorna o último comando global executado.
```

***

# ✅ 🚀 2 - COMANDOS DE INTEGRAÇÃO (POST)

***

## ✅ Sync de produto

```
POST /v1/integration/product-catalog/:productCode/sync
```

### Descrição

```
Sincroniza um produto específico do Omie.
```

***

## ✅ Sync global

```
POST /v1/integration/product-catalog/sync-global
```

### Descrição

```
Sincroniza todo o catálogo de produtos do Omie.
```

***

### Payload

```json
{
  "externalRequestId": "string(opcional)"
}
```

***

# ✅ ⚙️ 3 - JOBS / ADMIN

***

## ✅ Status de lock

```
GET /v1/admin/product-catalog/lock-status
```

### Descrição

```
Retorna se existe sync em execução.
```

***

## ✅ Liberar lock

```
POST /v1/admin/product-catalog/release-lock
```

### Descrição

```
Libera lock travado manualmente.
```

***

## ✅ Product Structure Sync (cron)

**Controle por variáveis de ambiente:**

```env
ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB=true
OMIE_PRODUCT_STRUCTURE_SYNC_CRON=0 */12 * * *
```

**Descrição:**

```
Executa sync global de estruturas (BOM) a cada 12h.
Usa PrismaSyncStateStore para controle de estado incremental.
Idempotente por externalRequestId.
```

**Jobs ativos:**

| Job | Variável | Cron |
|-----|----------|------|
| Sync estruturas | `ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB` | 0 */12 * * * |

***

# 💥 ✅ BLOCO FINAL (MUITO IMPORTANTE)

Adicione isso no final do módulo:

***

## ✅ Contrato do módulo

```
Este módulo é responsável por:

- Sincronizar catálogo de produtos do Omie
- Manter read-model local desacoplado
- Expor endpoints otimizados para API2
- Controlar idempotência e status de comandos

Regras:

- Endpoints /admin/read são técnicos
- Endpoints /products são contratos de produção
- API2 nunca deve acessar diretamente dados do Omie
```

***

# 🧠 TL;DR

👉 agora você tem:

```
✔ documentação completa
✔ separação clara de responsabilidades
✔ endpoints técnicos vs produto
✔ contrato estável para API2
✔ módulo pronto para escala
```

***

# 🚀 CONCLUSÃO

👉 isso aqui é o que transforma seu módulo em:

```
infraestrutura de dados real ✅
```

***

Se quiser, próximo passo final mesmo:

👉 gerar README do módulo (documentação interna para equipe)


# ROTAS PÚBLICAS — API 1

## 1 - Read-models (GET)

### Product Catalog
- GET /v1/admin/read/products/catalog
- GET /v1/admin/read/products/catalog/:productCode
- GET /v1/admin/read/products/catalog/stats
- GET /v1/products/catalog/summary
- GET /v1/products/catalog/production-ready
- GET /v1/integration/product-catalog/sync-status/:externalRequestId
- GET /v1/integration/product-catalog/sync-history
- GET /v1/integration/product-catalog/sync-failures
- GET /v1/integration/product-catalog/last-sync

### Sales Order Sync
- GET /v1/integration/sales-order-sync/sync-status/:externalRequestId

### Production Orders
- GET /v1/integration/production-orders/read/:omieCode/with-bom

## 2 - Comandos de integração (POST)

### Product Catalog
- POST /v1/integration/product-catalog/:productCode/sync
- POST /v1/integration/product-catalog/sync-global
- POST /v1/admin/product-catalog/refresh-production-ready

### Sales Order Sync
- POST /v1/integration/sales-order-sync/sync-global

## 3 - Jobs / Admin

### Product Catalog
- GET /v1/admin/product-catalog/lock-status
- POST /v1/admin/product-catalog/release-lock