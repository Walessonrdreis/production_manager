
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