Você está atuando como **arquiteto de software backend**.

## 📌 Contexto do projeto

- Node.js + TypeScript
- Fastify como framework HTTP
- Prisma como ORM
- PostgreSQL
- Arquitetura modular baseada em `modules/*`
- Integrações externas (ex.: Omie)
- Existe uma **API legada em produção** que **DEVE ser preservada** em:
  - comportamento
  - payloads
  - contratos HTTP
- O projeto está em **refatoração incremental**
- O objetivo é **evoluir a arquitetura sem quebrar nada existente**

***

## 🧱 Arquitetura esperada

Cada módulo deve seguir **claramente** esta separação:

```
modules/
└─ <module-name>/
   ├─ application/
   │  └─ use-cases/
   ├─ infrastructure/
   │  ├─ db/
   │  └─ jobs/        (se aplicável)
   ├─ presentation/
   │  ├─ controllers/
   │  └─ routes.ts
   └─ register.ts

```

### Responsabilidades

- **application**: regras de negócio (use cases)
- **infrastructure**: Prisma, Omie, jobs, cron, IO externo
- **presentation**: HTTP (controllers + rotas)
- **register.ts**: wiring do módulo no Fastify

***

## 🚫 Regras obrigatórias

- ❌ NÃO remover endpoints existentes
- ❌ NÃO alterar payloads de resposta existentes
- ❌ NÃO misturar leitura com escrita
- ❌ NÃO acoplar módulos entre si
- ✅ Preferir **módulos novos** a alterar módulos antigos
- ✅ Usar **refatoração incremental**
- ✅ Usar **lock** para jobs
- ✅ Sync **NUNCA** deve acontecer por request HTTP
- ✅ Sync deve ser:
  - via job (cron)
  - via endpoint manual
  - opcionalmente via startup (fire-and-forget)

***

## 🎯 Objetivo deste pedido

Quero criar um **novo módulo** na API com as seguintes características:

- Nome do módulo: **`<DESCREVA AQUI>`**
- Tipo do módulo:
  - ( ) leitura (view / query)
  - ( ) escrita (sync / job)
  - ( ) composição (enriched / read-model)
- Fonte dos dados:
  - ( ) banco local
  - ( ) integração externa (ex.: Omie)
- Deve preservar compatibilidade com endpoints legados? **(sim/não)**
- Deve expor endpoint público? **(sim/não)**
- Deve ter job periódico? **(sim/não)**
- Deve ter endpoint manual de execução? **(sim/não)**

***

## ✅ O que você DEVE entregar

Quero **resposta prática e aplicável**, contendo:

1. ✅ **Decisão arquitetural**
   - Por que o módulo deve existir
   - Por que ele NÃO deve ser acoplado a outro módulo
2. ✅ **Estrutura completa de pastas**
   - Com nomes reais de arquivos
3. ✅ **Código base funcional**, incluindo:
   - `use case`
   - `repository Prisma`
   - `controller`
   - `routes`
   - `register.ts`
   - (job, se aplicável)
4. ✅ **Padrão de tipagem**
   - Sem `any` implícito
   - Compatível com Prisma
   - Sem vazamento de payload externo
5. ✅ **Estratégia de execução**
   - cron
   - endpoint manual
   - startup sync (se fizer sentido)
6. ✅ **Checkpoints de validação**
   - `curl`
   - logs esperados
   - query SQL opcional

***

## 🧠 Princípios importantes

- Explique sempre o **porquê** das decisões
- Evite soluções “mágicas”
- Prefira código explícito e previsível
- Pense em produção (Render, restart, lock, idempotência)
- Pense em legado (não quebrar nada)

***

## 🚀 Estilo de resposta esperado

- Código completo (não pseudo‑código)
- Sem abstração excessiva
- Sem teoria desnecessária
- Tom técnico, direto e confiável
- Foco em **funcionar agora**, não “no futuro”

***

## ✅ Resultado esperado

Ao final da resposta, eu devo conseguir:

- copiar os arquivos
- colar no projeto
- registrar o módulo
- subir a API
- validar via `curl`
- sem quebrar nenhum endpoint existente

