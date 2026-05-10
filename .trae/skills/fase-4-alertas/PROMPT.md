# PROMPT PARA FASE 4 - SISTEMA DE ALERTAS AVANÇADO (API AVANÇADA)

## 🎯 CONTEXTO DA FASE - ESTRATÉGIA API-FIRST
Você está implementando a **Fase 4 da Etapa 2** com foco **API-FIRST**. Esta fase (Dias 11-20) desenvolve o **Sistema de Alertas Avançado** como parte da **API Avançada**, após a API Core estar estável.

**PRINCÍPIO FUNDAMENTAL:** Sistema de alertas complexo com regras de negócio avançadas, disponível para múltiplos consumidores via API.

## 📋 INSTRUÇÕES PARA O CHAT BUILDER - FASE ALERTAS API AVANÇADA

### O QUE VOCÊ PRECISA FAZER (DIAS 11-20):
1. **Implementar módulo `advanced-alerts`** na API Avançada com endpoints REST
2. **Criar `AdvancedAlertService`** com monitoramento complexo de estoque crítico
3. **Desenvolver sistema de notificações multi-canal** (Email, SMS, WebSocket)
4. **Implementar regras de negócio avançadas** (machine learning, previsão)
5. **Criar dashboard de gestão de alertas** com endpoints de configuração
6. **Integrar com métricas e previsão** da API Avançada

### PASSO A PASSO PARA API AVANÇADA (DIAS 11-20):
1. **Dia 11**: Configurar módulo `advanced-alerts` com estrutura Clean Architecture
2. **Dia 12**: Implementar `AdvancedAlertService` com regras complexas
3. **Dia 13**: Criar endpoints REST para gestão de regras de alerta
4. **Dia 14**: Implementar sistema de notificações multi-canal
5. **Dia 15**: Integrar com sistema de previsão de demanda
6. **Dia 16**: Desenvolver dashboard de gestão de alertas
7. **Dia 17**: Implementar machine learning para detecção de anomalias
8. **Dia 18**: Testes unitários e integração complexos
9. **Dia 19**: Otimizar performance e escalabilidade
10. **Dia 20**: Documentação OpenAPI completa e deploy staging

### ✅ REGRA CRÍTICA: PARTE DA API AVANÇADA
**PERMITIDO APENAS SE:** Sistema implementado como endpoints REST da API Avançada, após API Core estável.
**PROIBIDO:** Implementar lógica básica que deveria estar na API Core.

## 📋 INSTRUÇÕES PARA O CHAT BUILDER

### O QUE VOCÊ PRECISA FAZER:
1. **Implementar módulo `advanced-alerts`** seguindo estrutura Clean Architecture
2. **Criar `AdvancedAlertService`** com monitoramento complexo de estoque
3. **Desenvolver endpoints REST avançados** para gestão de regras
4. **Implementar sistema multi-canal** (Email, SMS, WebSocket)
5. **Integrar com machine learning** para detecção de anomalias

### PASSO A PASSO:
1. **Módulo Advanced-Alerts**: Crie `modules/advanced-alerts/` com presentation/application/infrastructure
2. **AdvancedAlertService**: Implemente `AdvancedAlertService.ts` com regras complexas
3. **Endpoints REST Avançados**: Crie routes para gestão de regras ML, configuração multi-canal
4. **Sistema Multi-canal**: Configure Email, SMS e WebSocket integrados
5. **Integração ML**: Conecte com sistema de previsão e detecção de anomalias
6. **Testes Complexos**: Escreva testes unitários, integração e E2E para regras avançadas
7. **Solicite revisão**: Use `@fase-4-alertas`

### REGRAS IMPORTANTES:
- **API First**: Endpoints REST bem definidos e documentados
- **Tempo real**: WebSocket para notificações imediatas
- **Configurável**: Regras ajustáveis via API
- **Histórico**: Todos alertas registrados para consulta
- **Performance**: Monitoramento executa em < 30 segundos

### PRÉ-REQUISITOS:
- **Estrutura Clean Architecture**: Módulos existentes como referência
- **Fastify configurado**: Servidor HTTP funcionando
- **Prisma ORM**: Banco de dados configurado
- **Node.js 18+**: Ambiente de desenvolvimento

### ENDPOINTS DA API CORE A IMPLEMENTAR:
1. **GET /v1/alerts**: Lista alertas ativos com filtros
2. **GET /v1/alerts/{id}**: Detalhes de um alerta específico
3. **POST /v1/alerts**: Criar novo alerta manualmente
4. **PUT /v1/alerts/{id}**: Atualizar status de alerta
5. **GET /v1/alerts/rules**: Listar regras de alerta configuradas
6. **POST /v1/alerts/rules**: Criar nova regra de alerta
7. **PUT /v1/alerts/rules/{id}**: Atualizar regra existente
8. **GET /v1/alerts/history**: Consultar histórico de alertas

### TIPOS DE ALERTAS BÁSICOS (API CORE):
1. **Estoque crítico**: Produto abaixo do nível mínimo configurado
2. **Estoque baixo**: Produto próximo do nível mínimo (warning)
3. **Sincronização falhou**: Erro na sincronização com Omie
4. **Sistema indisponível**: Serviço externo não respondendo

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
1. **Planejar**: "Vou criar estrutura básica do módulo stock-monitor"
2. **Implementar**: Criar diretório `modules/stock-monitor/` + arquivos básicos (index.ts, register.ts)
3. **Testar**: Escrever testes básicos para estrutura do módulo
4. **Mostrar**: Mostrar estrutura criada e testes
5. **Perguntar**: "Módulo stock-monitor criado com sucesso. Devo continuar implementando o StockMonitorService?"

#### ❌ EXEMPLO DE FLUXO ERRADO (múltiplas ações juntas):
- Criar todo módulo + implementar todas regras + configurar todos canais + testar tudo
- Implementar múltiplas regras de negócio sem mostrar progresso intermediário
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

#### 🗂️ DIVISÃO RECOMENDADA PARA FASE 4:
- **Ação 1**: Estrutura do módulo stock-monitor (diretório + arquivos básicos)
- **Ação 2**: StockMonitorService básico (estrutura + interface)
- **Ação 3**: Regra de estoque mínimo (implementação + testes)
- **Ação 4**: Notificações por email (configuração + envio básico)
- **Ação 5**: Regra de consumo anormal (implementação + testes)
- **Ação 6**: Notificações por SMS (configuração + envio básico)
- **Ação 7**: Integração com dashboard (WebSocket + UI alerts)
- **Ação 8**: Sistema de histórico (banco + queries básicas)
- **Ação 9**: Testes completos (unitários + integração)

#### 💡 DICA IMPORTANTE:
**Economize créditos**: Cada ação curta usa menos créditos. Se você fizer tudo de uma vez, pode esgotar os créditos antes de terminar e ficar difícil revisar. Faça pouco a pouco!

## 📊 OBJETIVOS DE NEGÓCIO
1. **Prevenção ruptura**: Alertas antes do estoque zerar
2. **Otimização estoque**: Evitar excesso ou falta
3. **Ação proativa**: Tempo para reagir a situações críticas
4. **Redução perdas**: Alertas para produtos perto de vencer
5. **Melhoria decisão**: Dados para planejamento de compras

## 🛠️ TAREFAS ESPECÍFICAS

### TAREFA 4.1: MÓDULO ALERTS (API CORE)
Criar estrutura completa do módulo `alerts` seguindo Clean Architecture:
- **Presentation**: Routes, controllers, schemas para endpoints REST
- **Application**: `AlertService`, DTOs, use cases básicos
- **Infrastructure**: Repositories, WebSocket integration, job scheduling
- **Domain**: Entities (`Alert`, `AlertRule`), value objects, errors

### TAREFA 4.2: ALERTSERVICE BÁSICO
Implementar `AlertService.ts` com funcionalidades core:
- Monitoramento de estoque crítico (regra básica)
- Sistema de severidade simples (baixa, média, alta)
- Integração com polling de estoque (2min interval)
- Notificações via WebSocket em tempo real
- Histórico básico de alertas

### TAREFA 4.3: ENDPOINTS REST DA API CORE
Desenvolver endpoints REST bem definidos:
- **GET /v1/alerts**: Listagem com paginação e filtros (status, severity, type)
- **GET /v1/alerts/{id}**: Detalhes completos de um alerta específico
- **POST /v1/alerts**: Criação manual de alertas (para testes e integração)
- **PUT /v1/alerts/{id}**: Atualização de status (acknowledged, resolved)
- **GET /v1/alerts/rules**: Consulta de regras configuradas
- **POST /v1/alerts/rules**: Criação de novas regras de alerta
- **PUT /v1/alerts/rules/{id}**: Atualização de regras existentes
- **GET /v1/alerts/history**: Histórico com filtros por data e tipo

### TAREFA 4.4: WEBSOCKET PARA TEMPO REAL
Implementar sistema de notificações em tempo real:
- WebSocket server integrado ao Fastify
- Broadcast de novos alertas para todos clientes conectados
- Sistema de reconexão automática com backoff
- Autenticação via JWT token para conexões WebSocket
- Heartbeat (30s) para manter conexões ativas

### TAREFA 4.5: INTEGRAÇÃO COM POLLING
Conectar sistema de alertas com polling inteligente:
- Consumo de dados atualizados de estoque (2min interval)
- Trigger de alertas baseado em mudanças detectadas
- Cache de dados frequentes para performance
- Sistema de debounce para evitar alertas duplicados

## 🧪 TESTES OBRIGATÓRIOS

### TESTES UNITÁRIOS (API CORE)
1. **AlertService**
   - Testar regra básica de estoque crítico
   - Testar cálculo de severidade (baixa, média, alta)
   - Testar criação e atualização de alertas
   - Testar consulta de histórico

2. **Controllers & Routes**
   - Testar validação de schemas para endpoints
   - Testar tratamento de erros HTTP (400, 404, 500)
   - Testar paginação e filtros funcionando
   - Testar autenticação e autorização

3. **WebSocket Server**
   - Testar conexão e desconexão de clientes
   - Testar broadcast de alertas em tempo real
   - Testar reconexão automática com backoff
   - Testar autenticação via JWT token

### TESTES DE INTEGRAÇÃO (API CORE)
1. **Endpoints REST completos**
   - Testar fluxo completo: criação → consulta → atualização → histórico
   - Testar integração com banco de dados (Prisma)
   - Testar cache funcionando para consultas frequentes
   - Testar performance com múltiplas requisições simultâneas

2. **Integração com Polling**
   - Testar consumo de dados atualizados de estoque
   - Testar trigger de alertas baseado em mudanças
   - Testar sistema de debounce para evitar duplicados
   - Testar fallback se polling falhar

3. **WebSocket + REST integração**
   - Testar notificações em tempo real após criação via REST
   - Testar múltiplos clientes recebendo broadcast simultâneo
   - Testar reconexão após falha de rede
   - Testar autenticação consistente entre REST e WebSocket

### TESTES E2E (API CORE)
1. **Cenários de uso real**
   - Simular estoque crítico e ver alerta gerado automaticamente
   - Testar consulta e filtragem de alertas via API
   - Validar notificações WebSocket em tempo real
   - Testar marcação de alertas como resolvidos

2. **Performance e escalabilidade**
   - Testar tempo de resposta < 100ms para endpoints principais
   - Testar suporte a > 50 conexões WebSocket simultâneas
   - Testar uso de memória com muitos alertas ativos
   - Testar recovery após downtime do sistema

## 📈 MÉTRICAS DE SUCESSO

### PERFORMANCE API CORE
- ✅ **Tempo de resposta endpoints**: < 100ms para 95% das requisições
- ✅ **Monitoramento execução**: < 30 segundos para verificação completa
- ✅ **Notificações WebSocket**: < 500ms entre evento e broadcast
- ✅ **Concorrência WebSocket**: Suporta > 50 conexões simultâneas estáveis
- ✅ **Cache hit rate**: > 80% para consultas frequentes de alertas
- ✅ **Uptime API**: > 99.9% durante horário de produção

### QUALIDADE DOS DADOS
- ✅ **Alertas gerados automaticamente**: > 95% dos casos de estoque crítico
- ✅ **Falsos positivos**: < 10% (aceitável para fase inicial)
- ✅ **Dados consistentes**: 100% sincronia entre REST e WebSocket
- ✅ **Histórico completo**: Todos alertas registrados com timestamp e metadata

### USABILIDADE DA API
- ✅ **Documentação OpenAPI**: 100% dos endpoints documentados com exemplos
- ✅ **Schemas de validação**: Todos endpoints com validação TypeScript + JSON Schema
- ✅ **Error handling**: Mensagens de erro claras e códigos HTTP apropriados
- ✅ **Autenticação**: Sistema JWT funcionando para REST e WebSocket
- ✅ **Versionamento**: API versionada (v1/) para compatibilidade futura

### INTEGRAÇÃO E ESCALABILIDADE
- ✅ **Integração com polling**: Dados atualizados consumidos corretamente
- ✅ **Sistema de debounce**: Alertas duplicados prevenidos em > 90% dos casos
- ✅ **Performance sob carga**: < 200ms response time com 100 req/s simultâneas
- ✅ **Recovery após falha**: Sistema recupera automaticamente em < 30 segundos
- ✅ **Logs e monitoramento**: Todos eventos registrados para troubleshooting

## ⚠️ SINAIS DE ALERTA (REJEITAR)

### ARQUITETURA API CORE
- ❌ **Módulo não segue Clean Architecture**: Mistura presentation/application/infrastructure
- ❌ **Endpoints REST mal definidos**: Sem schemas de validação ou documentação
- ❌ **WebSocket sem autenticação**: Conexões aceitas sem verificação JWT
- ❌ **Sem versionamento**: Endpoints diretos sem prefixo de versão (v1/)
- ❌ **Integração pobre com polling**: Dados desatualizados ou inconsistentes

### QUALIDADE DE CÓDIGO
- ❌ **Testes insuficientes**: Cobertura < 80% para endpoints críticos
- ❌ **TypeScript any abuse**: Uso excessivo de `any` em vez de tipos específicos
- ❌ **Error handling pobre**: Erros genéricos sem contexto útil
- ❌ **Logs incompletos**: Sem timestamps, request IDs ou metadata para debugging
- ❌ **Documentação ausente**: Endpoints não documentados em OpenAPI

### PERFORMANCE API
- ❌ **Tempo de resposta lento**: > 500ms para endpoints básicos
- ❌ **WebSocket latência alta**: > 1 segundo para notificações
- ❌ **Cache ineficiente**: Hit rate < 50% para consultas frequentes
- ❌ **Monitoramento lento**: > 1 minuto para verificação completa
- ❌ **Escalabilidade pobre**: Sistema trava com > 20 conexões simultâneas

### USABILIDADE DA API
- ❌ **Schemas de validação ausentes**: Endpoints aceitam dados malformados
- ❌ **Error messages ambíguas**: "Internal server error" sem detalhes
- ❌ **Autenticação inconsistente**: REST e WebSocket com sistemas diferentes
- ❌ **Pagination mal implementada**: Sem limites ou ordenação consistente
- ❌ **Filtros não funcionais**: Parâmetros de filtro ignorados ou mal interpretados

### INTEGRAÇÃO E CONFIABILIDADE
- ❌ **Sem sistema de debounce**: Alertas duplicados frequentes
- ❌ **Falta de fallback**: Sistema quebra completamente se polling falha
- ❌ **Recovery manual necessário**: Não recupera automaticamente após falhas
- ❌ **Dados inconsistentes**: REST e WebSocket mostram informações diferentes
- ❌ **Monitoramento ausente**: Sem métricas ou alertas de saúde do sistema

## 🚀 PRÓXIMOS PASSOS APÓS APROVAÇÃO

### DEPLOY E MONITORAMENTO
1. **Deploy em staging**: Testar integração completa com outros módulos
2. **Testes de carga**: Validar performance com dados reais de produção
3. **Monitoramento contínuo**: Coletar métricas de uso e performance da API
4. **Documentação final**: Atualizar OpenAPI com exemplos reais

### INTEGRAÇÃO COM SISTEMAS EXISTENTES
1. **Polling inteligente**: Conectar com sincronização de estoque (2min interval)
2. **Cache multi-nível**: Integrar com sistema de cache para performance
3. **Dashboard frontend**: Preparar endpoints para consumo pelo React dashboard
4. **Sistemas externos**: Configurar webhooks para integração com outros sistemas

### EVOLUÇÃO E MELHORIAS FUTURAS
1. **Regras avançadas**: Implementar detecção de padrões complexos (Fase 2)
2. **Multi-canal**: Adicionar email e SMS notifications (Fase 3)
3. **Machine learning**: Previsão de estoque baseada em histórico (Fase 4)
4. **APIs customizadas**: Endpoints específicos para integrações empresariais

### TREINAMENTO E ADOÇÃO
1. **Documentação para desenvolvedores**: Guia de integração com a API
2. **Exemplos de código**: SDKs em diferentes linguagens (JavaScript, Python)
3. **Suporte inicial**: Equipe disponível para dúvidas de integração
4. **Feedback contínuo**: Sistema para coletar sugestões de melhorias

## 💬 COMO SOLICITAR REVISÃO
```
@fase-4-alertas: Implementei módulo `alerts` da API Core com endpoints REST:
- GET /v1/alerts - Listagem com paginação e filtros
- POST /v1/alerts - Criação manual de alertas
- GET /v1/alerts/rules - Consulta de regras configuradas
- WebSocket server para notificações em tempo real
- Integração com polling de estoque (2min interval)

Por favor, revise conforme checklist da Fase 4 (API Core).
```

## 🔗 REFERÊNCIAS

### DOCUMENTAÇÃO DA API CORE
- [OpenAPI Specification](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/openapi.yaml) - Documentação completa da API versão 1.0
- [API Core Architecture](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/API_CORE_ARCHITECTURE.md) - Guia arquitetural da API Core
- [Endpoints REST Guidelines](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/REST_GUIDELINES.md) - Padrões para desenvolvimento de endpoints

### MÓDULOS EXISTENTES (REFERÊNCIA)
- [omie-production-orders](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/omie-production-orders) - Estrutura Clean Architecture
- [omie-sales-orders](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/omie-sales-orders) - Controllers e routes
- [orders-enriched](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/orders-enriched) - Integração entre módulos

### INFRAESTRUTURA
- [Fastify Configuration](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/bootstrap/fastify.config.ts) - Configuração do servidor HTTP
- [Prisma Schema](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/prisma/schema.prisma) - Modelos de banco de dados
- [WebSocket Plugin](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/bootstrap/plugins/websocket.plugin.ts) - Configuração WebSocket

### ESPECIFICAÇÕES DE ALERTAS
- [Alert System Requirements](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/ALERT_SYSTEM_REQUIREMENTS.md) - Requisitos funcionais do sistema
- [WebSocket Protocol](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/WEBSOCKET_PROTOCOL.md) - Especificação do protocolo WebSocket
- [API Authentication](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/API_AUTHENTICATION.md) - Sistema de autenticação JWT