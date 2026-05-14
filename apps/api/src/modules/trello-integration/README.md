# Módulo `trello-integration`

> AUTO-GENERATED: module-scaffold  
> Última atualização: `2026-05-14T01:38:57.801Z`

## 🎯 Objetivo do módulo
Descreva aqui a responsabilidade do módulo `trello-integration` (domínio, integrações, limites).

## 🧱 Padrão arquitetural (por módulo)
Este módulo segue:
- `presentation/http` (Fastify: request/reply)
- `application/use-cases` (regras de negócio, sem HTTP)
- `application/ports` (interfaces/contratos)
- `infrastructure` (Prisma, integrações, jobs)
- `index.ts` (composição e wiring)

## ✅ Status da estrutura (template)
Progresso: **12/13** itens presentes.

### Pastas
- [x] `application/dtos`
- [x] `application/ports`
- [x] `application/use-cases`
- [x] `infrastructure/db`
- [x] `infrastructure/integrations`
- [x] `infrastructure/jobs`
- [x] `presentation/http`
- [x] `presentation/http/controllers`

### Arquivos
- [x] `index.ts`
- [x] `presentation/http/controllers/index.ts`
- [x] `presentation/http/routes.ts`
- [x] `presentation/http/schemas.ts`
- [ ] `README.md`


## 🧩 O que falta implementar (próximos passos)
- Criar arquivos faltantes (1).

## 🧪 Checkpoints de validação
- `app.printRoutes()` deve listar as rotas do módulo (quando registradas).
- `presentation` não acessa Prisma diretamente.
- `application` não conhece Fastify/HTTP.
- `index.ts` é o único lugar com wiring de dependências.

## 📦 Itens extras encontrados (fora do template)

> Não é necessariamente erro — mas vale revisar para manter o padrão.

- `application`
- `infrastructure`
- `presentation`

