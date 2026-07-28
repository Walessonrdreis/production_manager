# 🚀 Template Oficial de Módulo de Integração (API 1)

## 🎯 Objetivo

Este template define o padrão obrigatório para criação de novos módulos de integração.

Todo módulo deve:

- Integrar com Omie (via API 1)
- Manter espelho local no banco
- Expor read-models
- Garantir idempotência
- Seguir padrão Fake/Real
- Expor comandos baseados em CAPACIDADE (não CRUD genérico)

---

# 📦 Estrutura do Módulo

modules/integration/<nome-modulo>/

├── application/
│   ├── ports/
│   ├── use-cases/
│   ├── dto/
│   └── utils/
│
├── infrastructure/
│   ├── db/
│   ├── gateways/
│   │   └── <capacidade>/
│   │       ├── real-*.gateway.ts
│   │       └── fake-*.gateway.ts
│   └── jobs/
│
├── presentation/
│   └── http/
│       ├── routes/
│       │   ├── commands/
│       │   └── read/
│       ├── routes.ts
│       └── Routes.md
│
├── <nome-modulo>-integration-register.ts
├── README.md
└── index.ts

---

# 🧠 Regras Arquiteturais

- UseCase é único por capacidade
- Gateway representa CAPACIDADE (não CRUD)
- Fake = simula mundo externo (não polui dados reais)
- Real = integra com Omie + persiste
- Read-model NUNCA chama Omie
- Command sempre tem externalRequestId
- API2 nunca fala direto com Omie

---

# 📘 Endpoints obrigatórios

## ✅ Read-model

GET /v1/admin/read/<modulo>
GET /v1/admin/read/<modulo>/:id

---

## 🚀 Comandos de integração (POST)

⚠️ Importante: comandos representam INTENÇÃO, não CRUD técnico

---

### 🔹 Sync (pull do Omie)

POST /v1/integration/<modulo>/:id/sync

Descrição:
Sincroniza o estado do recurso com o Omie → banco local

---

### 🔹 Apply (create/update no Omie)

POST /v1/integration/<modulo>/:id/apply

Descrição:
Cria ou atualiza o recurso no Omie.

Regras:
- Se não existir → cria
- Se existir → atualiza
- Deve ser idempotente

---

### 🔹 Delete (remoção no Omie)

POST /v1/integration/<modulo>/:id/delete

Descrição:
Remove ou desativa o recurso no Omie.

---

## ✅ Status

GET /v1/integration/<modulo>/sync-status/:externalRequestId

Descrição:
Retorna status: ACCEPTED | CONFIRMED | FAILED

---

# ⚙️ Gateway (padrão por capacidade)

application/ports/<modulo>-<capacidade>.gateway.ts

Capacidades típicas:

- Fetch / Sync
- Apply
- Delete

---

## ✅ Fake

- NÃO chama Omie
- NÃO escreve dados reais externos
- Pode simular retorno
- Pode escrever no store local (simulação)

---

## ✅ Real

- Chama Omie
- Trata erro
- Aplica retry
- Persiste no DB
- Respeita idempotência

---

# 🗄️ Store (DB)

infrastructure/db/<modulo>-integration.store.ts

Responsável por:

- persistência
- upsert
- leitura para read-model

---

# 🧾 Command Store

infrastructure/db/<modulo>-command.store.ts

Responsabilidades:

- idempotência
- status (ACCEPTED / CONFIRMED / FAILED)
- auditoria mínima

---

# 🔄 Use Cases

application/use-cases/

Deve conter:

- sync individual
- sync global (se aplicável)
- apply
- delete
- read-model

---

# 🌐 Rotas

presentation/http/routes/

commands/
read/

---

# 📄 Documentação obrigatória

## README.md

- responsabilidades
- arquitetura
- regras do módulo

---

## Routes.md

- lista de endpoints
- payload simplificado
- uso rápido

---

## ROUTES.md global

Atualizar:

apps/api/ROUTES.md

---

# 🔧 Variáveis de ambiente

<MODULO>_GATEWAY=fake | real

ENABLE_OMIE_<MODULO>_SYNC_JOB=true | false

OMIE_<MODULO>_SYNC_CRON=...

---

# 🧪 Fluxo de Teste

1. POST /sync
2. POST /apply
3. POST /delete
4. GET /sync-status
5. GET /read-model

---

# ✅ Checklist de criação

[ ] Tem gateway fake/real por capacidade  
[ ] Tem command store  
[ ] Tem integration store  
[ ] Tem read-model  
[ ] Tem sync  
[ ] Tem apply  
[ ] Tem delete (se aplicável)  
[ ] Tem endpoint de status  
[ ] Tem README.md  
[ ] Tem Routes.md  
[ ] Atualizou ROUTES.md global  

---

# 🚀 Resultado esperado

✔ módulo desacoplado do Omie  
✔ idempotente  
✔ consistente entre módulos  
✔ baseado em intenção (não CRUD genérico)  
✔ escalável  

---

# 🧠 TL;DR

Use sempre:

sync → trazer do Omie  
apply → criar/atualizar no Omie  
delete → remover no Omie  

Nunca usar CRUD direto (create/update/delete)

---