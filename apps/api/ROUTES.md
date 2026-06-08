
# API 1 — Rotas Públicas

Este arquivo lista **todas as rotas expostas pela API 1**.  
Ele é a **fonte de verdade para a API 2** e para qualquer consumidor interno.

---

## ✅ Read‑Models (somente leitura)

---

## Product Structure — Production Readiness

Este módulo fornece o **read‑model canônico de readiness de produção** dos produtos,
baseado na **existência de estrutura (BOM)**.

Ele responde à pergunta de negócio:

> **“Este produto pode gerar Ordem de Produção agora?”**

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

````

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
````

**Descrição:**

* Read‑model agregado
* **Não chama Omie**
* **Não escreve no banco**
* Usado por dashboards e validação antes de comandos

***

## ✅ Comandos de Integração (efeito colateral)

Todos os comandos abaixo:

* ✅ São **idempotentes**
* ✅ Exigem `externalRequestId`
* ✅ Retornam **202 Accepted**
* ✅ Fake / Real controlado por env
* ✅ Executam lógica via API 1 (Anti‑Corruption Layer)

***

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

## ✅ Jobs / Admin

### Product Structure Sync (cron)

Job automático de reconciliação de estruturas de produto.

**Controle por variáveis de ambiente:**

```env
ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB=true|false
OMIE_PRODUCT_STRUCTURE_SYNC_CRON=0 */12 * * *
```

**Comportamento:**

* Executa sync periódico
* Usa idempotência por produto
* Não concorre com comandos HTTP
* Não depende da API 2

***

## ✅ Observações Importantes

* Todas as rotas de comando exigem `externalRequestId`
* API 2 **NUNCA** chama Omie diretamente
* API 2 **SEMPRE** consome a API 1
* Read‑models **não executam efeitos colaterais**
* Jobs são controlados exclusivamente por env

## ✅ 3) O que foi corrigido (para sua tranquilidade)

- ✅ Organização por **Read‑Models / Commands / Jobs**
- ✅ Product Structure isolado corretamente
- ✅ Apply / Sync / Delete documentados
- ✅ Job documentado (cron + env)
- ✅ Markdown válido (sem blocos quebrados)
- ✅ Alinhado com **o que você testou em localhost:3333**
- ✅ Pronto para API 2 consumir sem dúvida semântica


