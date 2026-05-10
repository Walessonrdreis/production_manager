# PROMPT PARA FASE 2 - API AVANÇADA (MÉTRICAS, PREVISÃO, RELATÓRIOS)

## 🎯 CONTEXTO DA FASE - ESTRATÉGIA API-FIRST
Você está implementando a **FASE 2 da Etapa 2** com foco **API-FIRST**. Esta fase (Dias 11-20) desenvolve a **API Avançada** completa, expandindo a API Core com funcionalidades avançadas.

**PRINCÍPIO FUNDAMENTAL:** API completa versão 1.0 estável antes do frontend.

## 📋 INSTRUÇÕES PARA O CHAT BUILDER - FASE API AVANÇADA

### O QUE VOCÊ PRECISA FAZER (DIAS 11-20):
1. **Implementar endpoints de métricas** (`GET /api/metrics/production/efficiency`)
2. **Criar sistema de previsão de demanda** (`POST /api/forecast/demand`)
3. **Desenvolver relatórios avançados** (`GET /api/reports/production/daily`)
4. **Expandir sistema de filas** com prioridades avançadas
5. **Implementar segurança completa** (authentication, authorization)
6. **Otimizar performance** (database indexing, query optimization)

### PASSO A PASSO PARA API AVANÇADA:
1. **Dia 11-12**: Criar endpoints de métricas de produção e qualidade
2. **Dia 13-14**: Implementar sistema de previsão de demanda
3. **Dia 15**: Desenvolver relatórios avançados em PDF
4. **Dia 16-17**: Testes de integração end-to-end
5. **Dia 18-19**: Performance tuning e security hardening
6. **Dia 20**: API versão 1.0 pronta para consumo

### 🚫 REGRA CRÍTICA: NENHUM FRONTEND ANTES DO DIA 21
**PROIBIDO:** Desenvolver qualquer componente React, HTML ou CSS nesta fase.
**PERMITIDO:** Apenas desenvolvimento de API avançada (métricas, previsão, relatórios, segurança).

## 📋 INSTRUÇÕES PARA O CHAT BUILDER

### O QUE VOCÊ PRECISA FAZER:
1. **Configurar Redis** no ambiente de desenvolvimento e produção
2. **Implementar `MultiLevelCacheService`** com 4 níveis de cache
3. **Integrar cache** com todos os módulos existentes
4. **Implementar sistema de invalidação** baseado em eventos
5. **Escrever testes completos** para cache e Redis

### PASSO A PASSO:
1. **Configure Redis**: Adicione `REDIS_URL` ao `.env` e crie `infra/redis.ts`
2. **Crie o cache service**: `modules/shared/services/MultiLevelCacheService.ts`
3. **Atualize módulos**: Modifique `omie-production-orders`, `omie-sales-orders`, etc.
4. **Implemente invalidação**: Sistema que remove cache quando dados mudam
5. **Escreva testes**: Unitários para cache, integração com Redis
6. **Execute testes**: Verifique performance e consistência
7. **Solicite revisão**: Use `@fase-2-cache`

### REGRAS IMPORTANTES:
- **Hierarquia de cache**: Memória → Redis → Banco → Omie
- **Stale-while-revalidate**: Serve dados antigos enquanto atualiza
- **TTLs configuráveis**: Diferentes por tipo de dado
- **Fallback robusto**: Sistema funciona mesmo se Redis cair
- **Métricas**: Cache hit rate monitorado

### PRÉ-REQUISITOS:
- **Fase 1 aprovada**: Polling inteligente funcionando
- **Redis instalado**: Localmente ou via Docker
- **Variáveis de ambiente**: `REDIS_URL` configurada

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
1. **Planejar**: "Vou configurar Redis no `.env` e criar estrutura básica do client"
2. **Implementar**: Adicionar `REDIS_URL` ao `.env` + criar `infra/redis.ts` (estrutura)
3. **Testar**: Escrever testes básicos para conexão Redis
4. **Mostrar**: Mostrar configuração e testes
5. **Perguntar**: "Redis configurado com sucesso. Devo continuar implementando o cache service?"

#### ❌ EXEMPLO DE FLUXO ERRADO (múltiplas ações juntas):
- Configurar Redis + implementar todo cache + integrar todos módulos + testar tudo
- Implementar múltiplos níveis de cache sem mostrar progresso intermediário
- Trabalhar por mais de 15 minutos sem parar para mostrar progresso

#### 🎯 METAS POR AÇÃO
- **Ideal**: 1-2 arquivos, 1 funcionalidade, 5-15 minutos
- **Aceitável**: 3 arquivos, 1 funcionalidade, até 15 minutos  
- **Proibido**: >3 arquivos, >1 funcionalidade, >15 minutos

#### 📋 CHECKLIST APÓS CADA AÇÃO
- [ ] Mostrei quais arquivos foram criados/modificados?
- [ ] Mostrei testes executados e resultados?
- [ ] Verifiquei logs do sistema?
- [ ] Corrigi erros imediatamente?
- [ ] A ação levou menos de 15 minutos?
- [ ] Modifiquei no máximo 3 arquivos?
- [ ] Implementei apenas UMA funcionalidade?
- [ ] Perguntei se devo continuar?

## 📊 OBJETIVOS DA FASE API AVANÇADA
1. **API completa versão 1.0**: Todos os endpoints avançados implementados
2. **Sistema de métricas operacional**: Métricas de produção e qualidade calculadas
3. **Previsão de demanda funcional**: Algoritmos de previsão implementados
4. **Relatórios avançados gerados**: PDFs com análises detalhadas
5. **Segurança implementada**: Authentication, authorization, rate limiting
6. **Performance otimizada**: Database indexing, query optimization

## 🛠️ TAREFAS ESPECÍFICAS - API AVANÇADA

### TAREFA 2.1: ENDPOINTS DE MÉTRICAS DE PRODUÇÃO
Criar `modules/metrics/routes/production.routes.ts` com:
- `GET /api/metrics/production/efficiency`: Eficiência de produção
- `GET /api/metrics/quality/rejection-rate`: Taxa de rejeição
- `GET /api/metrics/timeliness/cycle-time`: Tempo de ciclo
- `GET /api/metrics/stock/turnover`: Giro de estoque
- Agregações SQL otimizadas com indexes

### TAREFA 2.2: SISTEMA DE PREVISÃO DE DEMANDA
Criar `modules/forecast/routes/demand.routes.ts` com:
- `POST /api/forecast/demand`: Prever demanda para período
- `GET /api/forecast/history`: Histórico de previsões
- `GET /api/forecast/accuracy`: Precisão das previsões
- Algoritmos: Média móvel, regressão linear, sazonalidade

### TAREFA 2.3: RELATÓRIOS AVANÇADOS
Criar `modules/reports/routes/production.routes.ts` com:
- `GET /api/reports/production/daily`: Relatório diário de produção
- `GET /api/reports/stock/trends`: Tendências de estoque
- `POST /api/reports/custom`: Relatório customizado com filtros
- Geração de PDF com gráficos e análises

### TAREFA 2.4: SEGURANÇA COMPLETA DA API
Implementar sistema de segurança:
- **Authentication**: JWT tokens com refresh
- **Authorization**: RBAC (Role-Based Access Control)
- **Rate limiting**: Limitação inteligente por endpoint
- **CORS**: Configuração segura para múltiplos domínios
- **Input validation**: Sanitização de dados de entrada

### TAREFA 2.5: OTIMIZAÇÃO DE PERFORMANCE
Otimizar performance da API:
- **Database indexing**: Indexes para queries frequentes
- **Query optimization**: Otimização de queries do Prisma
- **Connection pooling**: Configuração otimizada do PostgreSQL
- **Cache Redis**: Estratégias avançadas de cache
- **Compression**: Gzip compression para respostas grandes
## 🧪 TESTES OBRIGATÓRIOS - API AVANÇADA

### TESTES UNITÁRIOS PARA ENDPOINTS AVANÇADOS
1. **Endpoints de métricas**
   - `GET /api/metrics/production/efficiency`: Testar cálculo de eficiência
   - `GET /api/metrics/quality/rejection-rate`: Testar taxa de rejeição
   - `GET /api/metrics/timeliness/cycle-time`: Testar tempo de ciclo
   - `GET /api/metrics/stock/turnover`: Testar giro de estoque

2. **Sistema de previsão**
   - `POST /api/forecast/demand`: Testar algoritmos de previsão
   - `GET /api/forecast/history`: Testar histórico de previsões
   - `GET /api/forecast/accuracy`: Testar precisão das previsões

3. **Relatórios avançados**
   - `GET /api/reports/production/daily`: Testar geração de relatório diário
   - `GET /api/reports/stock/trends`: Testar análise de tendências
   - `POST /api/reports/custom`: Testar relatórios customizados

4. **Segurança da API**
   - Testar authentication JWT tokens
   - Testar authorization RBAC
   - Testar rate limiting por endpoint
   - Testar CORS configuration

### TESTES DE INTEGRAÇÃO AVANÇADOS
1. **Fluxo completo de métricas**
   - Testar cálculo de métricas com dados reais
   - Testar performance de agregações SQL
   - Testar cache de métricas calculadas

2. **Sistema de previsão em produção**
   - Testar precisão com dados históricos
   - Testar performance de algoritmos
   - Testar atualização automática de modelos

3. **Segurança e performance combinadas**
   - Testar API sob carga com autenticação
   - Testar rate limiting em cenários reais
   - Testar fallback de segurança

## 📈 MÉTRICAS DE SUCESSO - API AVANÇADA

### TÉCNICAS (OBRIGATÓRIAS)
- ✅ **10 endpoints avançados implementados**: Métricas, previsão, relatórios
- ✅ **Segurança completa**: Authentication, authorization, rate limiting
- ✅ **Performance otimizada**: Database indexes, query optimization
- ✅ **Cache avançado**: Redis com estratégias multi-nível
- ✅ **Test coverage > 85%**: Testes unitários e de integração
- ✅ **Response time < 300ms**: Performance superior (p95)

### DE NEGÓCIO (CRÍTICAS)
- ✅ **Métricas de produção calculadas**: Eficiência, qualidade, tempo
- ✅ **Previsão de demanda funcional**: Algoritmos precisos (>80%)
- ✅ **Relatórios gerados automaticamente**: PDFs com análises detalhadas
- ✅ **Sistema de filas avançado**: Prioridades, balanceamento, monitoramento

### QUALIDADE (VERIFICAÇÃO)
- ✅ **Segurança auditada**: Vulnerabilidades corrigidas
- ✅ **Performance validada**: Sob carga real de produção
- ✅ **Documentação completa**: Inclui exemplos e guias avançados
- ✅ **Testes automatizados**: Pipeline CI/CD funcionando

## ⚠️ SINAIS DE ALERTA - REJEITAR IMEDIATAMENTE

### VIOLAÇÃO DA ESTRATÉGIA API-FIRST
- ❌ **Qualquer desenvolvimento frontend**: React, HTML, CSS, componentes UI
- ❌ **Endpoints sem segurança**: Sem authentication ou authorization
- ❌ **Performance inadequada**: Response time > 500ms para endpoints críticos
- ❌ **Testes incompletos**: Coverage < 85% para endpoints avançados

### ARQUITETURA DA API AVANÇADA
- ❌ **Métricas calculadas incorretamente**: Cálculos imprecisos ou incompletos
- ❌ **Previsão não funcional**: Algoritmos não implementados ou imprecisos
- ❌ **Relatórios não gerados**: PDFs não criados ou com erros
- ❌ **Segurança incompleta**: Falta de rate limiting ou authorization

### QUALIDADE DO CÓDIGO AVANÇADO
- ❌ **Queries não otimizadas**: Sem indexes para agregações frequentes
- ❌ **Algoritmos não testados**: Previsão sem validação de precisão
- ❌ **Cache ineficiente**: Hit rate < 70% para dados críticos
- ❌ **Logs inadequados**: Sem registro de cálculos complexos

## 🚀 PRÓXIMOS PASSOS APÓS APROVAÇÃO DA API AVANÇADA

### FASE 3: FRONTEND (DIAS 21-40)
1. **Dashboard básico React**: Layout, componentes, integração API
2. **Visualizações em tempo real**: Gráficos, atualizações automáticas
3. **Sistema de notificações**: Alertas em tempo real no frontend
4. **Responsividade completa**: Mobile, tablet, desktop

### COORDENAÇÃO COM EQUIPE FRONTEND
1. **API versão 1.0 estável**: Pronta para consumo do frontend
2. **Documentação compartilhada**: Ambos times usam mesma OpenAPI spec
3. **Testes de integração**: Frontend pode testar contra API estável
4. **Contrato bem definido**: Interface clara entre equipes

## 💬 COMO SOLICITAR REVISÃO
```
@fase-2-cache: Implementei endpoints avançados de métricas, previsão e relatórios.
API completa versão 1.0 pronta para consumo frontend. Por favor, revise.
```

## 🔗 REFERÊNCIAS - API AVANÇADA

### DOCUMENTAÇÃO PRINCIPAL
- [ETAPA_2_API_FIRST_DETALHADO.md](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/ETAPA_2_API_FIRST_DETALHADO.md) - Plano completo API-first
- [CRONOGRAMA_API_FIRST.md](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/CRONOGRAMA_API_FIRST.md) - Cronograma visual por dia

### ENDPOINTS DE REFERÊNCIA AVANÇADOS
- `GET /api/metrics/production/efficiency` - Eficiência de produção
- `POST /api/forecast/demand` - Previsão de demanda
- `GET /api/reports/production/daily` - Relatório diário
- `POST /api/integration/rules` - Regras de conversão
- `GET /api/metrics/stock/turnover` - Giro de estoque