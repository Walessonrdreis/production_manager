### 📄 `apps/api/ROUTES.md`

```md
# API 1 — Rotas Públicas

Este arquivo lista **todas as rotas expostas pela API 1**.
Ele é a **fonte de verdade para a API 2** e para qualquer consumidor.

---

## ✅ Read‑Models (somente leitura)

### Produtos para Produção
# Product Structure — Production Readiness

Este módulo fornece o **read-model canônico de readiness de produção** dos produtos,
baseado na **existência de estrutura (BOM)**.

Ele responde à pergunta de negócio:

> **“Este produto pode gerar Ordem de Produção agora?”**

---

## ✅ Responsabilidade do módulo

- ✅ Consolidar dados de produto + estrutura
- ✅ Expor decisão pronta (`canCreateProductionOrder`)
- ✅ Servir dashboards, validações e bloqueios
- ❌ Não cria OP
- ❌ Não chama Omie em read-model

---

## ✅ Rotas expostas

### Readiness de produtos para produção
GET /v1/admin/read/products/production-readiness
### Query params suportados

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

### Comportamento

- Sem `view`: retorna `summary + data`
- `view=summary`: retorna apenas agregados
- `view=data`: retorna apenas lista

---

## ✅ Exemplo de resposta — Summary

```json
{
  "summary": {
    "total": 4321,
    "withStructure": 2998,
    "withoutStructure": 1323,
    "canCreateProductionOrder": 2998,
    "blockedFromProduction": 1323
  }
}

#### Comportamento
- Sem `view`: retorna `summary + data`
- `view=summary`: retorna apenas agregados
- `view=data`: retorna apenas lista

---

## ✅ Exemplo de resposta (summary)

```json
{
  "summary": {
    "total": 4321,
    "withStructure": 2998,
    "withoutStructure": 1323,
    "canCreateProductionOrder": 2998,
    "blockedFromProduction": 1323
  }
}
Descrição:
- Read‑model agregado de produtos com/sem estrutura
- **Não chama Omie**
- **Não escreve no banco**
- Usado por dashboards e validação antes de comandos


---

## ✅ Comandos de Integração (efeito colateral)

### Criar Ordem de Produção
```

POST /v1/integration/production-order

````

Payload:
```json
{
  "externalRequestId": "<string>",
  "productId": "<string>",
  "quantity": <number>
}
````

Descrição:

* Cria OP no Omie (Fake/Real por env)
* Idempotente por `externalRequestId`

***

### Consultar status da OP

```
GET /v1/integration/production-order/:externalRequestId
```

Descrição:

* Consulta status da criação da OP

***

### Sincronizar Estrutura do Produto (on‑demand)

```
POST /v1/integration/product-structure/:productCode/sync
```

Payload:

```json
{
  "externalRequestId": "<string>"
}
```

Descrição:

* Dispara sync da estrutura no Omie
* Usado quando produto não tem estrutura
* Fake/Real por env

***

## ✅ Observações Importantes

* Todas as rotas de comando exigem `externalRequestId`
* API 2 **NUNCA** chama Omie diretamente
* API 2 **SEMPRE** consome essas rotas

