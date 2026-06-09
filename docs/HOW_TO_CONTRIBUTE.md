# Como Contribuir - Production Manager

Este guia prático explica como configurar o ambiente, desenvolver novos módulos, testar e fazer deploy do projeto.

## 1. Pré-requisitos

### 1.1 Ferramentas Necessárias
- **Node.js**: Versão 20.x (exigida pelo `engines`)
- **PNPM**: Gerenciador de pacotes (obrigatório)
- **Docker** (opcional): Para banco de dados local
- **Git**: Controle de versão

### 1.2 Instalação Rápida
```bash
# Instalar pnpm globalmente (se não tiver)
npm install -g pnpm

# Clonar o repositório
git clone <repositorio>
cd production_manager

# Instalar dependências
pnpm install

# Configurar ambiente
cp apps/api/.env.example apps/api/.env
# Editar apps/api/.env com suas credenciais
```

## 2. Configuração do Ambiente

### 2.1 Variáveis de Ambiente
Crie/edite `apps/api/.env`:

```env
# Banco de dados (dev local)
DATABASE_URL_DEV="postgresql://postgres:postgres@localhost:5432/production_manager?schema=public"
DIRECT_URL_DEV="postgresql://postgres:postgres@localhost:5432/production_manager?schema=public&connection_limit=1"

# Banco de dados (produção - Supabase)
DATABASE_URL="postgresql://usuario:senha@aws-1-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://usuario:senha@aws-1-us-west-1.pooler.supabase.com:5432/postgres"

# API
PORT=3333
CORS_ORIGIN="http://localhost:5174"

# Omie (integração)
OMIE_APP_KEY="sua-app-key"
OMIE_APP_SECRET="sua-app-secret"
OMIE_BASE_URL="https://app.omie.com.br/api/v1/"

# Jobs (habilitar/desabilitar)
ENABLE_STOCK_REFRESH_JOB=false
STOCK_REFRESH_CRON=*/30 * * * *
ENABLE_OMIE_PRODUCT_SYNC_JOB=false
OMIE_PRODUCT_SYNC_CRON=0 */12 * * *

# Gateways (fake/real)
PRODUCTION_ORDER_GATEWAY=real
PRODUCT_STRUCTURE_GATEWAY=fake  # Use 'fake' para desenvolvimento
```

### 2.2 Banco de Dados Local
```bash
# Usando Docker (recomendado)
docker run -d \
  --name production-manager-db \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=production_manager \
  postgres:16

# Ou usando Supabase local (alternativa)
# https://supabase.com/docs/guides/local-development
```

### 2.3 Migrações do Banco
```bash
# Gerar cliente Prisma
pnpm --filter api prisma:generate

# Executar migrações (dev)
pnpm --filter api db:migrate:dev

# Aplicar migrações (produção)
pnpm --filter api db:migrate:prod

# Studio do Prisma (UI para banco)
pnpm --filter api db:studio
```

## 3. Desenvolvimento Local

### 3.1 Iniciar Servidor
```bash
# Desenvolvimento com hot reload
pnpm --filter api dev

# Ou navegar para apps/api e executar
cd apps/api
pnpm dev
```

### 3.2 Estrutura do Projeto
```
production_manager/
├── apps/
│   └── api/                    # API principal
│       ├── src/
│       │   ├── modules/
│       │   │   └── integration/  # Módulos de integração (FOCAR AQUI)
│       │   │       ├── product-structure/  # Modelo canônico
│       │   │       └── [novo-modulo]/      # Seu novo módulo
│       │   ├── shared/         # Utilitários compartilhados
│       │   ├── bootstrap/      # Inicialização da app
│       │   └── config/         # Configurações
│       ├── prisma/             # Schema do banco
│       └── package.json        # Scripts e dependências
└── packages/
    └── shared/                 # Package compartilhado
```

### 3.3 Scripts Úteis
```bash
# Gerar novo módulo (scaffold)
pnpm --filter api gen:module

# Gerar estrutura do projeto
pnpm --filter api gen:structure

# Gerar resumo do projeto
pnpm --filter api gen:resumo

# Criar arquivo interativo
pnpm --filter api create:file

# Atualizar documentação
pnpm --filter api metrics:update-docs
```

## 4. Criando um Novo Módulo

### 4.1 Passo a Passo
1. **Escolher nome**: `kebab-case` (ex: `sales-order-sync`)
   > **📌 IMPORTANTE**: Consulte [DOMAIN_NAMING_GUIDE.md](./DOMAIN_NAMING_GUIDE.md) para padrões canônicos de nomenclatura de domínio. Use "Entidade Específica + Capacidade" (ex: `sales-order-sync`, não `orders-sync`).
2. **Gerar scaffold**:
   ```bash
   pnpm --filter api gen:module
   # Seguir prompts interativos
   ```
3. **Seguir estrutura canônica**:
   - Verificar [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md)
   - Usar `product-structure` como referência
4. **Implementar camadas**:
   - `application/ports/`: Interfaces
   - `application/use-cases/`: Lógica de negócio
   - `infrastructure/gateways/`: Implementações (real/fake)
   - `infrastructure/db/`: Stores (repositórios)
5. **Documentar rotas**:
   - Atualizar [ROUTES.md](../../apps/api/ROUTES.md) seguindo template canônico
   - Incluir todas as rotas públicas do módulo
   - Seguir padrão "Entidade Específica + Capacidade"
   - `presentation/http/routes/`: Rotas HTTP

### 4.2 Template Rápido
```bash
# Estrutura mínima obrigatória
novo-modulo/
├── application/
│   ├── ports/
│   │   └── novo-modulo-[ação].gateway.ts
│   └── use-cases/
│       └── [ação]-novo-modulo.usecase.ts
├── infrastructure/
│   ├── db/
│   │   └── novo-modulo-[tipo].store.ts
│   ├── gateways/
│   │   ├── [ação]/
│   │   │   ├── real-novo-modulo-[ação].gateway.ts
│   │   │   └── fake-novo-modulo-[ação].gateway.ts
│   └── jobs/
│       ├── [ação]-novo-modulo.job.ts
│       └── novo-modulo-jobs.register.ts
├── presentation/
│   └── http/
│       ├── routes/
│       │   ├── commands/
│       │   │   └── [ação]-novo-modulo.route.ts
│       │   └── read/
│       │       └── get-[modelo]-read-model.route.ts
│       ├── routes.ts
│       └── index.ts
├── index.ts
└── novo-modulo-integration-register.ts
```

### 4.3 Registro do Módulo
Cada módulo DEVE ter um arquivo `[nome]-integration-register.ts`:

```typescript
// novo-modulo-integration-register.ts
import type { FastifyInstance } from "fastify";
import { registerRoutes } from "./presentation/http/routes";
import { registerJobs } from "./infrastructure/jobs/novo-modulo-jobs.register";

export function createNovoModuloIntegration() {
  return {
    name: "novo-modulo-integration",
    register: (app: FastifyInstance) => {
      registerRoutes(app);
      registerJobs();
    }
  };
}
```

## 5. Padrões de Desenvolvimento

### 5.1 Clean Architecture
- **Presentation**: Rotas HTTP, controllers
- **Application**: Use cases, ports (interfaces)
- **Infrastructure**: Gateways, stores, jobs

### 5.2 Ports & Adapters
```typescript
// Port (interface) - application/ports/
export interface NovoModuloGateway {
  execute(data: any): Promise<any>;
}

// Adapter (implementação) - infrastructure/gateways/
export class RealNovoModuloGateway implements NovoModuloGateway { ... }
export class FakeNovoModuloGateway implements NovoModuloGateway { ... }
```

### 5.3 Strategy Fake/Real
Configure no `.env`:
```env
NOVO_MODULO_GATEWAY=fake  # dev/test
NOVO_MODULO_GATEWAY=real  # produção
```

### 5.4 Eventual Consistency
- **Commands**: POST retorna 202 Accepted, processa assincronamente
- **Read-models**: GET para consultas rápidas
- **Idempotência**: Use `externalRequestId` para evitar duplicação

## 6. Testando

### 6.1 Testes Unitários
```bash
# Executar testes
pnpm --filter api test

# Watch mode
pnpm --filter api test --watch
```

### 6.2 Testes de Integração
```typescript
// Exemplo: testando use case
import { ApplyProductStructureUseCase } from "./apply-product-structure.usecase";
import { FakeProductStructureApplyGateway } from "./gateways/apply/fake-product-structure-apply.gateway";

describe("ApplyProductStructureUseCase", () => {
  it("deve aplicar estrutura com sucesso", async () => {
    const gateway = new FakeProductStructureApplyGateway();
    const useCase = new ApplyProductStructureUseCase(gateway, ...);
    
    const result = await useCase.execute(command);
    expect(result.status).toBe("CONFIRMED");
  });
});
```

### 6.3 Testando com Fake Gateways
Sempre use `fake` gateways para desenvolvimento local:
```typescript
// No seu teste ou desenvolvimento
const gateway = env.NOVO_MODULO_GATEWAY === "real" 
  ? new RealNovoModuloGateway() 
  : new FakeNovoModuloGateway();
```

## 7. Commits e Versionamento

### 7.1 Mensagens de Commit
Use o formato convencional:
```
tipo(escopo): descrição breve

Descrição detalhada (opcional)

BREAKING CHANGE: se houver mudança quebra compatibilidade
```

**Tipos**:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (espaços, vírgulas)
- `refactor`: Refatoração sem mudança funcional
- `test`: Adição/atualização de testes
- `chore`: Tarefas de manutenção

**Exemplo**:
```
feat(product-structure): adiciona reconciliação automática

- Implementa job de reconciliação a cada 5 minutos
- Adiciona store para tracking de comandos
- Configura cron expression via .env

BREAKING CHANGE: remove endpoint sync manual
```

### 7.2 Branch Strategy
- `main`: Produção (só merges via PR)
- `develop`: Desenvolvimento (integração)
- `feature/nome-da-feature`: Nova funcionalidade
- `fix/nome-do-bug`: Correção de bug
- `hotfix/nome-do-hotfix`: Correção urgente

## 8. Code Review

### 8.1 Checklist para Review
- [ ] Estrutura canônica seguida
- [ ] Nomenclatura conforme convenções
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Gateways configuráveis (fake/real)
- [ ] Idempotência com `externalRequestId`
- [ ] Tratamento de erros adequado
- [ ] Logs informativos
- [ ] Variáveis de ambiente documentadas

### 8.2 Pontos de Atenção
1. **Não hardcode valores**: Use `.env` ou configurações
2. **Não acoplar com Omie**: Use gateways abstratos
3. **Não esquecer idempotência**: Sempre use `externalRequestId`
4. **Não misturar camadas**: Presentation não acessa infrastructure diretamente

## 9. Deploy

### 9.1 Ambiente de Produção
```bash
# Build
pnpm --filter api build

# Migrações (com resiliência)
pnpm --filter api db:migrate:resilient

# Iniciar
pnpm --filter api start
```

### 9.2 Variáveis de Produção
Certifique-se de configurar:
- `DATABASE_URL` (Supabase com pgbouncer)
- `DIRECT_URL` (Supabase direto para migrações)
- `OMIE_APP_KEY` e `OMIE_APP_SECRET` (produção)
- Todos os gateways como `real`
- Jobs habilitados conforme necessidade

### 9.3 Monitoramento
```bash
# Métricas do projeto
pnpm --filter api metrics:all

# Status da API
pnpm --filter api docs:status

# Contrato da API
pnpm --filter api docs:contract
```

## 10. Solução de Problemas

### 10.1 Problemas Comuns

#### "Cannot find module"
```bash
# Recriar node_modules
rm -rf node_modules
pnpm install

# Recriar links dos workspaces
pnpm install --force
```

#### "Prisma client not generated"
```bash
# Gerar cliente
pnpm --filter api prisma:generate

# Ou forçar regeneração
rm -rf apps/api/node_modules/.prisma
pnpm --filter api prisma:generate
```

#### "Migration failed"
```bash
# Corrigir migração falha
pnpm --filter api db:fix:failed

# Ou resetar banco local (DEV APENAS)
pnpm --filter api db:migrate:dev --name reset
```

### 10.2 Logs e Debug
```typescript
// Use logger consistente
import { logger } from "@/shared/logger";

logger.info("Iniciando processamento", { externalRequestId });
logger.error("Falha na integração", { error: err, productCode });
```

### 10.3 Performance
- Use `fake` gateways para desenvolvimento rápido
- Configure cron expressions apropriadas
- Monitore queries do Prisma com `prisma.$on("query")`

## 11. Recursos Adicionais

### 11.1 Documentação
- [PROJECT_VISION.md](./PROJECT_VISION.md): Visão e regras do projeto
- [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md): Arquitetura técnica
- [NAMING_CONVENTIONS.md](./NAMING_CONVENTIONS.md): Padrões de nomenclatura
- [IMPORTS_LIBRARY.md](./IMPORTS_LIBRARY.md): Biblioteca de imports

### 11.2 Exemplos
- `apps/api/src/modules/integration/product-structure/`: Módulo modelo
- `apps/api/scripts/scaffold/`: Gerador de módulos
- `apps/api/src/shared/`: Utilitários compartilhados

### 11.3 Ferramentas
- **Prisma Studio**: `pnpm --filter api db:studio`
- **Swagger UI**: `http://localhost:3333/docs`
- **Metrics**: `pnpm --filter api metrics:all`

---

**Dúvidas?** Consulte:
1. Módulo `product-structure` como referência
2. Arquivos `.trae/rules/` para regras do assistente
3. Issues do projeto para contexto histórico

**Importante**: Foque apenas nos módulos em `integration/`. O resto é legado.