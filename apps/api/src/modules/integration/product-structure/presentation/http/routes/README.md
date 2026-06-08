
# Routes — Product Structure
Este diretório contém **todas as rotas HTTP do módulo Product Structure**.

Ele existe para:
- tornar explícitas as rotas disponíveis
- separar READ de COMMAND
- facilitar manutenção e onboarding
- servir de template para outros módulos


## 📁 Estrutura de diretórios



routes/
├─ read/
│  └─ get-production-readiness.route.ts
│
├─ commands/
│  └─ sync-product-structure.route.ts
│
├─ index.ts
└─ README.md


## ✅ Rotas expostas pelo módulo

### 📖 READ — Read Models (somente leitura)

#### Production Readiness dos Produtos

Arquivo:
read/get-production-readiness.route.ts


Rota:
GET /v1/admin/read/products/production-readiness

Descrição:
- Read-model agregado de readiness para produção
- Indica se o produto pode gerar Ordem de Produção
- Baseado na existência de estrutura (BOM)
- **Não chama Omie**
- **Não escreve no banco**

Query params suportados:
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

### ⚙️ COMMAND — Comandos de Integração (efeito colateral)

#### Sincronizar Estrutura do Produto (BOM)

Arquivo:
commands/sync-product-structure.route.ts

Rota:
POST /v1/integration/product-structure/:productCode/sync

Descrição:
- Comando de integração com o Omie
- Sincroniza a estrutura (BOM) do produto
- Atualiza os dados locais de estrutura
- Altera o estado do read-model de readiness

Regras importantes:
- Sempre exige `externalRequestId`
- Usa Fake ou Real conforme `env.PRODUCT_STRUCTURE_GATEWAY`
- Fake **não chama Omie**
- Real chama Omie e persiste o resultado
- Comando responde com **ACK (202 Accepted)**

Payload:
json

{
  "externalRequestId": "<string>"
}

## 🧭 Convenções adotadas

### ✅ 1 rota = 1 arquivo

* Cada arquivo registra uma única rota
* O nome do arquivo deve explicar claramente a intenção da rota

### ✅ Separação por intenção

#### `read/`

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
- `POST /v1/integration/product-structure/:productCode/apply`
- `POST /v1/integration/product-structure/:productCode/delete`

### Jobs
- Product Structure Sync (cron)
  - Controlado por `ENABLE_OMIE_PRODUCT_STRUCTURE_SYNC_JOB`
  - Agenda via `OMIE_PRODUCT_STRUCTURE_SYNC_CRON`