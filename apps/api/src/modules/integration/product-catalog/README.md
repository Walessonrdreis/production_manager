
# 📦 `product-catalog` — README OFICIAL

📍 **Caminho**

```
apps/api/src/modules/integration/product-catalog/README.md
```

```md
# Product Catalog — Omie Integration Module

Este módulo é responsável por manter o **catálogo canônico de produtos**
sincronizado a partir do **Omie**, servindo como **base de referência**
para todo o sistema de produção.

Ele é a **fonte de verdade de produtos** dentro da API 1.

---

## 🎯 Papel do módulo

O **Product Catalog** representa o *estado canônico dos produtos vindos do Omie*,
normalizado e pronto para consumo interno.

Ele é a base para:

- ✅ Product Structure (BOM)
- ✅ Estoque
- ✅ Ordens de Produção
- ✅ Read‑models de produção
- ✅ API 2 e Frontend

---

## ✅ Responsabilidades

- ✅ Sincronizar produtos a partir do Omie
- ✅ Persistir espelho local (`omie_product`)
- ✅ Armazenar `rawPayload` do Omie
- ✅ Atualizar status de ativo/inativo
- ✅ Expor produtos via read‑models
- ✅ Executar reconciliação automática via job

---

## ❌ Não é responsabilidade

- ❌ CRUD manual de produtos
- ❌ UX ou regras de negócio humanas
- ❌ Decisões de produção
- ❌ Chamada direta pelo Front
- ❌ Escrita de dados de domínio interno

---

## 🧱 Tabelas envolvidas (ownership da API 1)

- `omie_product`
- Campos normalizados:
  - `omieCode`
  - `omieId`
  - `sku`
  - `description`
  - `familyDescription`
  - `active`
  - `lastSyncAt`
- `rawPayload` (JSON completo do Omie)

Essas tabelas **são base** para outros módulos e **não devem ser escritas pela API 2**.

---

## 🔌 Gateways (Strategy Pattern)

### Capacidade: **Product Catalog Sync**

```

infrastructure/gateways/sync/
├─ product-catalog-sync.gateway.ts
├─ real-product-catalog-sync.gateway.ts
└─ fake-product-catalog-sync.gateway.ts

```

### Regras

- ✅ Use case é único
- ✅ Gateway varia por Fake / Real
- ✅ Seleção via env
- ✅ Fake **não chama Omie**
- ✅ Real aplica idempotência, retry e persistência

---

## ⚙️ Use case

```

application/use-cases/sync-product-catalog.usecase.ts

````

Responsabilidades:

- Executar sincronização
- Chamar gateway Fake/Real
- Atualizar espelho local
- Registrar execução (job / comando)

---

## 🔁 Job de sincronização (cron)

### Variáveis de ambiente

```env
ENABLE_OMIE_PRODUCT_SYNC_JOB=true|false
OMIE_PRODUCT_SYNC_CRON=0 */12 * * *
````

### Comportamento

* Executa sync periódico
* Idempotente
* Atualiza apenas produtos alterados
* Não depende da API 2
* Não concorre com comandos manuais

***

## 📖 Read‑models expostos

### 🔹 Lista canônica de produtos

```
GET /v1/admin/read/products
```

Campos mínimos:

* `productCode`
* `description`
* `active`
* `hasStructure`
* `canCreateProductionOrder`

> Este read‑model é **consumido diretamente pela API 2**.

***

## 🧠 Regras importantes

* Product Catalog é **pré‑requisito** para Product Structure
* Nenhum módulo deve assumir produto sem passar por aqui
* API 2 **nunca chama Omie**
* API 2 **nunca escreve nessas tabelas**
* Todo enriquecimento humano ocorre fora deste módulo

***

## ✅ Estado do módulo

* ✔ Nome fechado
* ✔ Responsabilidade clara
* ✔ Contratos definidos
* ✔ Alinhado com API 1 / API 2
* ✔ Base oficial do projeto

```

---

# 📜 CONTRATOS DE ROTAS — `product-catalog`

📍 **Adicionar em**  
```

apps/api/ROUTES.md

````

```md
## Product Catalog (Produtos — Omie)

### Read‑Models

- `GET /v1/admin/read/products`
  - Lista canônica de produtos
  - Base para Product Structure, Estoque e OP

### Comandos de Integração

- `POST /v1/integration/product-catalog/sync`
  - Sincroniza catálogo de produtos a partir do Omie
  - Idempotente
  - Fake / Real por env

### Jobs

- Product Catalog Sync (cron)
  - Controlado por `ENABLE_OMIE_PRODUCT_SYNC_JOB`
  - Agenda via `OMIE_PRODUCT_SYNC_CRON`
````

