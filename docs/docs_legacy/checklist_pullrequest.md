<br />

1️⃣ **Checklist de Pull Request para novos módulos**\
2️⃣ **Template de** **`README.md`** **por módulo**

***

# ✅ 1️⃣ CHECKLIST DE PULL REQUEST — NOVOS MÓDULOS

> **Use este checklist como template de PR.**\
> Ele evita 90% dos bugs que você acabou de resolver neste projeto.

***

## 📦 Identificação do módulo

- Nome do módulo: `modules/<nome-do-modulo>`
- Tipo:
  - leitura (view / query)
  - escrita (sync / job)
  - composição (enriched / read-model)
- Origem dos dados:
  - banco local
  - integração externa (ex.: Omie)

***

## 🧱 Arquitetura e organização

- O módulo segue a estrutura: modules// ├─ application/ ├─ infrastructure/ ├─ presentation/ └─ register.ts
- **Nenhuma lógica de domínio** está no controller
- **Nenhuma lógica de negócio** está no repository
- Integrações externas estão isoladas em `infrastructure`

***

## 🔒 Legado e compatibilidade

- Nenhum endpoint existente foi removido
- Nenhum payload existente foi alterado
- Endpoints legados continuam funcionando
- Novo endpoint foi criado **em vez de alterar um antigo**
- Qualquer endpoint novo está claramente documentado como:
  - público
  - admin
  - técnico / job

***

## 🧠 Regras de negócio

- Use cases são **idempotentes**
- Use cases **não dependem de HTTP**
- Nenhum use case depende de outro módulo diretamente
- Nenhuma chamada à Omie ocorre em tempo de request
- Regras de elegibilidade (ex.: `isEligibleStage20`) estão explícitas

***

## 🔁 Jobs e sincronização (se aplicável)

- Existe **job periódico** (cron)
- Existe **endpoint manual** (`POST /sync`)
- Job usa **lock exclusivo**
- Job é **seguro contra duplicação**
- Job **não roda por request HTTP**
- Existe opção de **sync no startup** (fire-and-forget)
- Startup sync é controlado por ENV

***

## 🧾 Prisma e banco

- Repository Prisma faz **whitelist de campos**
- Nenhum campo Omie camelCase vazou para o schema
- Dados Omie em snake\_case ficam **somente em** **`rawPayload`**
- Não existe `as any` em create/update
- Campos `Json` usam `Prisma.InputJsonValue`
- `lastSyncAt` ou equivalente é atualizado corretamente

***

## 🧪 Tipagem e qualidade

- Nenhuma função tem retorno `any` implícito
- Tipos explícitos para inputs/outputs principais
- Nenhum `unknown` passado para Prisma
- Erros são encapsulados em `AppError`
- Logs relevantes existem (start, end, error)

***

## 📡 Rotas e DX

- Rotas registradas via `register.ts`
- Rota aparece em `app.printRoutes()`
- Endpoint novo aparece no índice `/v1`
- Exemplo de `curl` validado manualmente

***

## ✅ Checkpoints obrigatórios (antes do merge)

- `pnpm run dev` sobe sem erro
- Sync manual funciona (`POST /sync`)
- Dados aparecem no banco
- Endpoint de leitura reflete os dados
- Logs confirmam execução correta

***

## 📝 Documentação

- `README.md` do módulo criado
- README explica:
  - o que o módulo faz
  - como executar
  - como validar
- ENV necessárias estão documentadas

***

# ✅ 2️⃣ TEMPLATE DE README.md — POR MÓDULO

> **Crie este arquivo em:**\
> `modules/<nome-do-modulo>/README.md`

***

<br />

\# 📦 Módulo: \<Nome do Módulo>



\## 🎯 Objetivo

Descrever claramente **por que este módulo existe** e **qual problema ele resolve**.



\> Exemplo:

\> Este módulo é responsável por sincronizar o estoque de produtos a partir da Omie

\> e manter a tabela `product_stock` atualizada no banco local.



\---



\## 🧠 Responsabilidades

✅ Este módulo **FAZ**:

\- Sincroniza dados com a Omie

\- Persiste dados no banco local

\- Expõe endpoint de execução manual

\- Executa job periódico



❌ Este módulo **NÃO FAZ**:

\- Não atende requisições de leitura pública

\- Não chama Omie em tempo de request

\- Não altera endpoints legados



\---



\## 🧱 Estrutura

<br />

modules// ├─ application/ │ └─ use-cases/ ├─ infrastructure/ │ ├─ db/ │ └─ jobs/ ├─ presentation/ │ └─ routes.ts └─ register.ts

```

---

## 🔌 Endpoints

### ▶️ Execução manual

```

POST /v1/admin//sync

````

**Descrição:** Executa a sincronização manualmente  
**Idempotente:** ✅  
**Lock:** ✅ exclusivo

**Exemplo:**
```bash
curl -X POST http://localhost:3333/v1/admin/<path>/sync

````

***

### 📖 (Se aplicável) Endpoint de leitura

```
GET /v1/<path>

```

**Descrição:** Retorna dados já persistidos no banco\
**Fonte:** banco local (não chama Omie)

***

## 🔁 Job automático

- Cron: `*/5 * * * *`
- Controlado por ENV
- Usa lock exclusivo
- Seguro contra duplicação

***

## 🚀 Sync no startup (opcional)

Se habilitado, o sync é disparado automaticamente quando a API sobe.

<br />

\<NOME\_DA\_ENV>\_ON\_STARTUP=true

<br />

⚠️ Executa de forma **fire-and-forget**, não bloqueia o boot.

***

## 🧾 Banco de dados

- Tabela(s):
  - `<nome_da_tabela>`
- Campos Omie permanecem em `rawPayload`
- Campos promovidos ao schema:
  - listar aqui

***

## 🧪 Validação

### 1️⃣ Executar sync

curl -X POST <http://localhost:3333/v1/admin/&lt;path&gt;/sync>

### 2️⃣ Conferir no banco

<br />

select \* from \<tabela> order by last\_sync\_at desc;

\`\`

<br />

### 3️⃣ Conferir endpoint

curl <http://localhost:3333/v1/&lt;path>>

***

## ⚠️ Observações importantes

- Este módulo preserva compatibilidade com o legado
- Qualquer alteração de payload exige criação de novo endpoint
- Não mover lógica de sync para controllers

***

## ✅ Status

- Implementado
- Validado localmente
- Pronto para produção

```

---

## ✅ CONCLUSÃO

Com esse **checklist + README**, você tem agora:

- ✅ padrão repetível
- ✅ prevenção de bugs estruturais
- ✅ documentação viva
- ✅ PRs muito mais rápidas de revisar
- ✅ refatoração segura sem quebrar legado

Se quiser, no próximo passo posso:
- gerar um **template de módulo vazio** já com tudo plugado
- ou um **script de scaffolding** (ex.: `pnpm create-module product-stock`)

Mas com isso aqui, você já está **num nível bem alto de maturidade de API** 👏

```

