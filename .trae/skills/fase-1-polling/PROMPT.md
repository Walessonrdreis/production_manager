# PROMPT PARA FASE 1 - API CORE (SINCRONIZAÇÃO E ALERTAS)

## 🎯 CONTEXTO DA FASE - ESTRATÉGIA API-FIRST
Você está implementando a **FASE 1 da Etapa 2** com foco **API-FIRST**. Esta fase (Dias 1-10) desenvolve a **API Core** completa antes de qualquer desenvolvimento frontend.

**PRINCÍPIO FUNDAMENTAL:** API estável e documentada primeiro, frontend depois.

## 📋 INSTRUÇÕES PARA O CHAT BUILDER - FASE API CORE

### O QUE VOCÊ PRECISA FAZER (DIAS 1-10):
1. **Implementar endpoints de sincronização** (`POST /api/sync/stock`, `POST /api/sync/orders`)
2. **Criar sistema de alertas de estoque crítico** (`GET /api/alerts/stock/critical`)
3. **Desenvolver documentação OpenAPI** completa
4. **Escrever testes unitários e de integração** para todos os endpoints
5. **Implementar sistema de fila de produção** (`POST /api/production/queue/add`)
6. **Criar integração automática** vendas→produção (`POST /api/integration/sales-to-production`)

### PASSO A PASSO PARA API CORE:
1. **Dia 1-2**: Criar endpoints `POST /api/sync/stock` e `POST /api/sync/orders`
2. **Dia 3-4**: Implementar sistema de alertas `GET /api/alerts/stock/critical`
3. **Dia 5**: Gerar documentação OpenAPI completa
4. **Dia 6-7**: Desenvolver sistema de fila de produção
5. **Dia 8-9**: Criar integração automática vendas→produção
6. **Dia 10**: Otimizar cache e performance da API

### 🚫 REGRA CRÍTICA: NENHUM FRONTEND ANTES DO DIA 21
**PROIBIDO:** Desenvolver qualquer componente React, HTML ou CSS nesta fase.
**PERMITIDO:** Apenas desenvolvimento de API (Fastify endpoints, services, tests).

## 📋 INSTRUÇÕES PARA O CHAT BUILDER

### O QUE VOCÊ PRECISA FAZER:
1. **Implementar o `IntelligentPollingService`** com polling dinâmico baseado em criticidade
2. **Modificar os jobs existentes** para usar intervalos otimizados
3. **Criar novo job** para monitoramento de estoque
4. **Implementar sistema de retry** inteligente com backoff exponencial
5. **Escrever testes unitários e de integração** completos

### PASSO A PASSO:
1. **Comece criando** `modules/shared/services/IntelligentPollingService.ts`
2. **Atualize os jobs** em seus respectivos módulos
3. **Crie o novo job** `stock-monitor.job.ts`
4. **Implemente o sistema de retry** integrado ao polling
5. **Escreva todos os testes** obrigatórios
6. **Execute os testes** e corrija qualquer erro
7. **Solicite revisão** com `@fase-1-polling`

### REGRAS IMPORTANTES:
- **Siga TDD**: Teste primeiro, implemente depois
- **Granularidade extrema**: 1 arquivo = 1 intenção
- **Configuração via environment**: Nada hardcoded
- **Logs detalhados**: Registre sucessos e falhas

### 🚫 REGRA CRÍTICA: AÇÕES CURTAS E INCREMENTAIS
**NÃO FAÇA TUDO DE UMA VEZ!** Siga estas regras rigorosamente:

#### 📋 REGRAS DE TRABALHO INCREMENTAL (OBRIGATÓRIAS)
1. **Máximo 3 arquivos** criados/modificados por ação
2. **Máximo 15 minutos** por ação
3. **Apenas UMA** funcionalidade específica por ação
4. **Mostre progresso** após cada ação (arquivos, testes, logs)
5. **Pergunte se continua** após cada ação concluída

#### 🔗 REFERÊNCIA COMPLETA
- [Regras de Trabalho Incremental](file:///C:/Users/walll/OneDrive/projects_git/production_manager/.trae/skills/REGRAS_TRABALHO_INCREMENTAL.md)
- [Regras do Projeto](file:///C:/Users/walll/OneDrive/projects_git/production_manager/.trae/rules/index.md)

#### ✅ EXEMPLO DE FLUXO CORRETO (1 ação):
1. **Planejar**: "Vou criar estrutura básica do IntelligentPollingService"
2. **Implementar**: Criar `IntelligentPollingService.ts` (apenas estrutura)
3. **Testar**: Escrever testes unitários básicos
4. **Mostrar**: Mostrar arquivo criado e testes
5. **Perguntar**: "Arquivo criado com sucesso. Devo continuar implementando a lógica?"

#### ❌ EXEMPLO DE FLUXO ERRADO (múltiplas ações juntas):
- Criar service + modificar jobs + configurar Redis + testar tudo de uma vez
- Implementar múltiplas features sem mostrar progresso intermediário
- Trabalhar por mais de 15 minutos sem parar para mostrar progresso

#### 🎯 METAS POR AÇÃO
- **Ideal**: 1-2 arquivos, 1 funcionalidade, 5-15 minutos
- **Aceitável**: 3 arquivos, 1 funcionalidade, até 15 minutos  
- **Proibido**: >3 arquivos, >1 funcionalidade, >15 minutos

## 📊 OBJETIVOS DA FASE API CORE
1. **API básica funcional**: 5 endpoints críticos implementados
2. **Documentação completa**: OpenAPI/Swagger gerada
3. **Test coverage > 80%**: Testes unitários e de integração
4. **Performance**: Response time < 500ms (p95)
5. **Cache hit rate > 70%**: Cache Redis configurado

## 🛠️ TAREFAS ESPECÍFICAS - API CORE

### TAREFA 1.1: ENDPOINTS DE SINCRONIZAÇÃO
Criar `modules/sync/routes/stock.routes.ts` e `orders.routes.ts` com:
- `POST /api/sync/stock`: Sincronizar estoque do Omie
- `POST /api/sync/orders`: Sincronizar pedidos de venda
- `GET /api/sync/status`: Status das sincronizações
- Validação com Zod schemas
- Error handling padronizado

### TAREFA 1.2: SISTEMA DE ALERTAS DE ESTOQUE
Criar `modules/alerts/routes/stock.routes.ts` com:
- `GET /api/alerts/stock/critical`: Listar estoque crítico
- `POST /api/alerts/stock/configure`: Configurar limites de estoque
- `GET /api/alerts/stock/history`: Histórico de alertas
- Regras de negócio para estoque mínimo

### TAREFA 1.3: DOCUMENTAÇÃO OPENAPI
Gerar documentação completa com:
- Especificação OpenAPI 3.0
- Exemplos de requisições/respostas
- Postman collection export
- Documentação em Markdown

### TAREFA 1.4: FILA DE PRODUÇÃO
Criar `modules/production/routes/queue.routes.ts` com:
- `POST /api/production/queue/add`: Adicionar ordem à fila
- `GET /api/production/queue/status`: Status da fila
- `PUT /api/production/queue/priority/{id}`: Alterar prioridade
- Sistema de filas com Bull/Redis

### TAREFA 1.5: INTEGRAÇÃO AUTOMÁTICA
Criar `modules/integration/routes/sales-to-production.routes.ts` com:
- `POST /api/integration/sales-to-production`: Converter pedido em produção
- `GET /api/integration/rules`: Listar regras de conversão
- `POST /api/integration/rules`: Criar nova regra
- Regras de negócio para conversão automática

## 🧪 TESTES OBRIGATÓRIOS - API CORE

### TESTES UNITÁRIOS PARA ENDPOINTS
1. **Endpoints de sincronização**
   - `POST /api/sync/stock`: Testar sincronização completa
   - `POST /api/sync/orders`: Testar sincronização de pedidos
   - `GET /api/sync/status`: Testar status de sincronização

2. **Sistema de alertas**
   - `GET /api/alerts/stock/critical`: Testar listagem de estoque crítico
   - `POST /api/alerts/stock/configure`: Testar configuração de limites
   - `GET /api/alerts/stock/history`: Testar histórico de alertas

3. **Fila de produção**
   - `POST /api/production/queue/add`: Testar adição à fila
   - `GET /api/production/queue/status`: Testar status da fila
   - `PUT /api/production/queue/priority/{id}`: Testar alteração de prioridade

4. **Integração automática**
   - `POST /api/integration/sales-to-production`: Testar conversão automática
   - `GET /api/integration/rules`: Testar listagem de regras
   - `POST /api/integration/rules`: Testar criação de regras

### TESTES DE INTEGRAÇÃO
1. **Fluxo completo de sincronização**
   - Testar integração com API Omie
   - Testar persistência no banco de dados
   - Testar cache Redis

2. **Sistema de alertas em tempo real**
   - Testar detecção de estoque crítico
   - Testar notificações automáticas
   - Testar histórico de alertas

3. **Performance e escalabilidade**
   - Testar response time < 500ms
   - Testar concorrência de requisições
   - Testar cache hit rate > 70%

## 📈 MÉTRICAS DE SUCESSO - API CORE

### TÉCNICAS (OBRIGATÓRIAS)
- ✅ **5 endpoints implementados**: Sincronização, alertas, fila, integração
- ✅ **Documentação OpenAPI**: Especificação completa gerada
- ✅ **Test coverage > 80%**: Testes unitários e de integração
- ✅ **Response time < 500ms**: Performance otimizada (p95)
- ✅ **Cache hit rate > 70%**: Redis configurado e funcionando
- ✅ **Error handling padronizado**: Todos os endpoints com tratamento consistente
- ✅ **Validação com Zod**: Schemas de validação implementados

### DE NEGÓCIO (CRÍTICAS)
- ✅ **Sincronização estoque funcional**: `POST /api/sync/stock` operacional
- ✅ **Sincronização pedidos funcional**: `POST /api/sync/orders` operacional
- ✅ **Alertas de estoque crítico**: `GET /api/alerts/stock/critical` funcionando
- ✅ **Fila de produção**: `POST /api/production/queue/add` implementado
- ✅ **Integração automática**: `POST /api/integration/sales-to-production` funcional

### QUALIDADE (VERIFICAÇÃO)
- ✅ **Logs detalhados**: Sucesso/falha registrados para cada endpoint
- ✅ **Configuração via environment**: Nada hardcoded
- ✅ **Código limpo**: Segue padrões TDD e granularidade extrema
- ✅ **Documentação completa**: Inclui exemplos e guias de uso

## ⚠️ SINAIS DE ALERTA - REJEITAR IMEDIATAMENTE

### VIOLAÇÃO DA ESTRATÉGIA API-FIRST
- ❌ **Qualquer desenvolvimento frontend**: React, HTML, CSS, componentes UI
- ❌ **Endpoints sem documentação**: API não documentada em OpenAPI
- ❌ **Testes incompletos**: Coverage < 80% para endpoints implementados
- ❌ **Configuração hardcoded**: Valores não configuráveis via environment

### ARQUITETURA DA API
- ❌ **Endpoints mal projetados**: Sem validação, sem error handling
- ❌ **Sem cache Redis**: Performance inadequada para produção
- ❌ **Integração direta com frontend**: API deve ser independente
- ❌ **Sem rate limiting**: Risco de sobrecarga da API

### QUALIDADE DO CÓDIGO
- ❌ **Violação SRP**: Arquivos com múltiplas responsabilidades
- ❌ **Sem testes de integração**: Endpoints não testados com banco/Redis
- ❌ **Logs inadequados**: Sem registro de sucesso/falha das requisições
- ❌ **Código não testável**: Dependências hardcoded, sem injeção

### PERFORMANCE E ESCALABILIDADE
- ❌ **Response time > 500ms**: Performance inadequada para tempo real
- ❌ **Cache hit rate < 70%**: Uso ineficiente do Redis
- ❌ **Sem circuit breaker**: Risco de cascata de falhas
- ❌ **Queries não otimizadas**: Sem indexes no banco de dados

## 🚀 PRÓXIMOS PASSOS APÓS APROVAÇÃO DA API CORE

### FASE 2: API AVANÇADA (DIAS 11-20)
1. **Implementar endpoints avançados**: Métricas, previsão, relatórios
2. **Expandir sistema de filas**: Prioridades avançadas, balanceamento
3. **Otimizar performance**: Database indexing, query optimization
4. **Implementar segurança completa**: Authentication, authorization, rate limiting

### PREPARAÇÃO PARA FRONTEND (DIAS 21-40)
1. **API versão 1.0 estável**: Pronta para consumo do frontend
2. **Documentação completa**: OpenAPI com exemplos e guias
3. **Testes automatizados**: Pipeline CI/CD configurado
4. **Ambiente produção**: Deploy pipeline funcionando

### COORDENAÇÃO COM EQUIPE FRONTEND
1. **Contrato de API definido**: Interface clara entre equipes
2. **Versões compatíveis**: API mantém compatibilidade com frontend existente
3. **Documentação compartilhada**: Ambos times usam mesma documentação
4. **Testes de integração**: Frontend pode testar contra API estável

## 💬 COMO SOLICITAR REVISÃO
```
@fase-1-polling: Implementei o IntelligentPollingService e modifiquei os jobs. 
Por favor, revise conforme checklist da Fase 1.
```

## 🔗 REFERÊNCIAS - PLANO API-FIRST

### DOCUMENTAÇÃO PRINCIPAL
- [ETAPA_2_API_FIRST_DETALHADO.md](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/ETAPA_2_API_FIRST_DETALHADO.md) - Plano completo API-first
- [CRONOGRAMA_API_FIRST.md](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/CRONOGRAMA_API_FIRST.md) - Cronograma visual por dia
- [ETAPA_2_PRODUCAO.md](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/ETAPA_2_PRODUCAO.md) - Documento central atualizado

### REGRAS DO PROJETO
- [Regras de Trabalho Incremental](file:///C:/Users/walll/OneDrive/projects_git/production_manager/.trae/skills/REGRAS_TRABALHO_INCREMENTAL.md)
- [Regras do Projeto](file:///C:/Users/walll/OneDrive/projects_git/production_manager/.trae/rules/index.md)
- [TDD Princípios](file:///C:/Users/walll/OneDrive/projects_git/production_manager/.trae/rules/tdd-principios.md)

### ENDPOINTS DE REFERÊNCIA
- `POST /api/sync/stock` - Sincronização de estoque
- `POST /api/sync/orders` - Sincronização de pedidos
- `GET /api/alerts/stock/critical` - Alertas de estoque crítico
- `POST /api/production/queue/add` - Fila de produção
- `POST /api/integration/sales-to-production` - Integração automática