```text
apps/api/
├─ src/                      # Código-fonte (TypeScript)
│  ├─ app.ts                 # Monta o Fastify e registra plugins/rotas
│  ├─ server.ts              # Ponto de entrada do servidor HTTP
│  ├─ env.ts                 # Leitura/validação de variáveis de ambiente
│  ├─ db.ts                  # Cliente Prisma e acesso ao banco
│  ├─ routes/                # Rotas HTTP (handlers + registro)
│  │  ├─ index.ts            # Agregador de rotas (register)
│  │  ├─ omie.ts             # Endpoints Omie (produtos, estoque, sync, etc.)
│  │  ├─ plans.ts            # Endpoints de planos de produção
│  │  ├─ product-sector.ts   # Endpoints de vínculo produto↔setor
│  │  ├─ products.ts         # Endpoints de produtos internos (admin)
│  │  └─ sectors.ts          # Endpoints de setores (admin)
│  ├─ services/              # Casos de uso (regras de aplicação)
│  │  ├─ CreatePlanItemService.ts
│  │  ├─ CreatePlanService.ts
│  │  ├─ CreateSectorService.ts
│  │  ├─ SetProductDefaultSectorService.ts
│  │  ├─ jobLock.service.ts                   # Lock de jobs (evita concorrência)
│  │  ├─ omieProductRead.service.ts           # Leitura/listagem com enriquecimento (ex.: estoque atual)
│  │  ├─ omieProductSync.service.ts           # Sincronização de produtos Omie
│  │  ├─ omieStock.service.ts                 # Utilidades de estoque Omie
│  │  ├─ publicProductsRead.service.ts        # Leitura de catálogo público (contrato)
│  │  └─ stockRefresh.service.ts              # Refresh/persistência do estoque
│  ├─ repositories/          # Acesso a dados (Prisma) por agregados/entidades
│  │  ├─ PlanRepository.ts
│  │  ├─ ProductRepository.ts
│  │  └─ SectorRepository.ts
│  ├─ integrations/          # Integrações externas
│  │  └─ omie/               # Integração com Omie
│  │     ├─ OmieAdapter.ts           # Normalização/extração de dados
│  │     ├─ OmieClient.ts            # Cliente HTTP Omie
│  │     ├─ OmieOrdersAdapter.ts     # Mapeamento de pedidos Omie
│  │     ├─ OmieStockCache.ts        # Cache/estratégia para estoque
│  │     ├─ omie.constants.ts        # Constantes da integração
│  │     └─ omieUtils.ts             # Helpers específicos Omie
│  ├─ core/                  # Núcleo de domínio/aplicação
│  │  ├─ SyncOmieProductsService.ts        # Serviço de sync de produtos Omie
│  │  ├─ SyncOmieStage20OrdersService.ts   # Serviço de sync de pedidos etapa 20
│  │  └─ errors/
│  │     └─ AppError.ts               # Erro padrão da aplicação (código + status + mensagem)
│  ├─ jobs/                  # Jobs agendados/rotinas
│  │  ├─ omieOrdersStage20.job.ts     # Job: sync de pedidos etapa 20
│  │  ├─ omieProductSync.job.ts       # Job: sync de produtos
│  │  └─ stockRefresh.job.ts          # Job: refresh de estoque
│  ├─ lib/                   # Infra/utilidades de suporte
│  │  ├─ errors.ts           # Helpers de erro
│  │  ├─ http.ts             # Helpers HTTP (ok/paginated/deprecated/etc.)
│  │  └─ logger.ts           # Logger
│  ├─ utils/                 # Utilitários genéricos
│  │  ├─ backoff.ts          # Backoff/retry
│  │  ├─ domainErrors.ts     # Erros de domínio reutilizáveis
│  │  └─ errors.ts           # Padronização de payload de erro
│  └─ contracts/             # Contratos expostos (quando aplicável)
│     └─ publicProducts.contract.ts   # Contrato de catálogo público (schema/typing)
├─ prisma/                   # Prisma (schema + migrações)
│  ├─ schema.prisma          # Modelo do banco (tabelas/relacionamentos)
│  └─ migrations/            # Histórico de migrações (cada pasta contém migration.sql)
├─ tests/                    # Testes (Vitest)
├─ scripts/                  # Scripts de manutenção/diagnóstico
│  ├─ backfill-omie-code.ts  # Ajustes/atualizações em massa (ex.: preencher omieCode)
│  ├─ check-env.mjs          # Verificação de variáveis de ambiente
│  ├─ repo-metrics.mjs       # Geração de métricas do repositório
│  ├─ metrics/               # Scripts auxiliares de métricas/relatórios
│  └─ update-estrutura-projeto.mjs
├─ dist/                     # Build compilado (gerado) para execução
├─ docs/                     # Documentação (contratos + typedoc gerado)
├─ package.json              # Dependências e scripts da API
├─ tsconfig.json             # Config do TypeScript
├─ typedoc.json              # Config do TypeDoc (geração de docs)
├─ metrics-report.json       # Relatório gerado de métricas
├─ README.md                 # Orientações específicas da API
├─ IMPROVEMENT_PLAN.md       # Backlog/idéias de melhorias (API)
└─ UPDATE_SUMMARY_2026-04-14.md # Resumo de mudanças (API)
```
