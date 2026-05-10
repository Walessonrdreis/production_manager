# PROMPT PARA FASE 3 - FRONTEND DASHBOARD (APÓS API ESTÁVEL)

## 🎯 CONTEXTO DA FASE - ESTRATÉGIA API-FIRST
Você está implementando a **FASE 3 da Etapa 2** com foco **API-FIRST**. Esta fase (Dias 21-40) desenvolve o **Frontend Dashboard** completo, APÓS a API estar estável e documentada.

**PRINCÍPIO FUNDAMENTAL:** Frontend desenvolvido apenas quando API versão 1.0 está pronta para consumo.

## 📋 INSTRUÇÕES PARA O CHAT BUILDER - FASE FRONTEND

### O QUE VOCÊ PRECISA FAZER (DIAS 21-40):
1. **Criar projeto React separado** para dashboard de produção
2. **Desenvolver componentes principais**: KPI Cards, Charts, Alerts, Tables
3. **Integrar com API estável** via REST endpoints e WebSocket
4. **Implementar sistema de notificações** em tempo real no frontend
5. **Garantir responsividade completa** para mobile, tablet e desktop
6. **Escrever testes E2E** com Cypress para fluxos de usuário

### PASSO A PASSO PARA FRONTEND (DIAS 21-40):
1. **Dia 21-22**: Configurar projeto React + TypeScript + Tailwind CSS
2. **Dia 23-24**: Desenvolver layout base e sistema de navegação
3. **Dia 25**: Dashboard mínimo funcional com integração API
4. **Dia 26-27**: Componentes de gráficos e visualizações em tempo real
5. **Dia 28-29**: Sistema de notificações e alertas frontend
6. **Dia 30**: Otimização de performance e bundle size
7. **Dia 31-32**: Testes E2E com Cypress para fluxos críticos
8. **Dia 33-34**: Responsividade mobile/tablet e cross-browser testing
9. **Dia 35**: Performance tuning final e SEO optimization
10. **Dia 36-40**: Deploy, monitoramento e ajustes finais

### ✅ REGRA CRÍTICA: API DEVE ESTAR ESTÁVEL
**PERMITIDO APENAS SE:** API versão 1.0 está documentada em OpenAPI e todos os endpoints estão testados e funcionando.
**PROIBIDO:** Desenvolver frontend se API ainda está em mudança constante.

## 📋 INSTRUÇÕES PARA O CHAT BUILDER

### O QUE VOCÊ PRECISA FAZER:
1. **Implementar WebSocket server** integrado ao Fastify
2. **Criar projeto React separado** para o dashboard
3. **Desenvolver componentes principais**: KPI Cards, Charts, Alerts
4. **Integrar dados em tempo real** via WebSocket
5. **Garantir responsividade** para tablets e computadores

### PASSO A PASSO:
1. **WebSocket Server**: Crie `websocket/dashboard.websocket.ts` com heartbeat
2. **React Project**: Configure Vite + TypeScript + Tailwind em novo diretório
3. **Componentes**: Desenvolva ProductionQueue, StockMonitor, OrderStatus, etc.
4. **Integração**: Conecte React com WebSocket e REST API
5. **Testes**: Escreva testes unitários, integração e E2E
6. **Responsividade**: Teste em diferentes tamanhos de tela
7. **Solicite revisão**: Use `@fase-3-dashboard`

### REGRAS IMPORTANTES:
- **Latência WebSocket**: < 100ms para mensagens
- **Atualização dashboard**: < 1 segundo após mudança
- **Reconexão automática**: Clientes reconectam após falha
- **Cache local**: Dados cacheados no cliente para offline
- **Fallback**: Polling se WebSocket não disponível

### PRÉ-REQUISITOS:
- **Fase 1 aprovada**: API Core estável e documentada
- **Fase 2 aprovada**: API Avançada estável e documentada
- **OpenAPI disponível**: Documentação completa da API
- **Node.js 18+**: Para desenvolvimento React
- **Navegadores modernos**: Chrome, Firefox, Edge suportados

### ARQUITETURA DO DASHBOARD:
```
apps/dashboard/
├── src/
│   ├── components/     # Componentes React
│   ├── hooks/         # Custom hooks (useWebSocket)
│   ├── services/      # API clients
│   ├── types/         # TypeScript types
│   └── utils/         # Utilitários
├── public/            # Assets estáticos
└── package.json       # Dependências
```

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
1. **Planejar**: "Vou criar estrutura básica do WebSocket server"
2. **Implementar**: Criar `websocket/dashboard.websocket.ts` (apenas estrutura com heartbeat)
3. **Testar**: Escrever testes básicos para conexão WebSocket
4. **Mostrar**: Mostrar arquivo criado e testes
5. **Perguntar**: "WebSocket server criado com sucesso. Devo continuar configurando o projeto React?"

#### ❌ EXEMPLO DE FLUXO ERRADO (múltiplas ações juntas):
- Criar WebSocket + configurar React + desenvolver todos componentes + testar tudo
- Implementar múltiplos componentes sem mostrar progresso intermediário
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

#### 🗂️ DIVISÃO RECOMENDADA PARA FASE 3:
- **Ação 1**: WebSocket server básico (estrutura + heartbeat)
- **Ação 2**: Configuração projeto React (Vite + TypeScript + Tailwind)
- **Ação 3**: Componente ProductionQueue (estrutura básica)
- **Ação 4**: Componente StockMonitor (estrutura básica)
- **Ação 5**: Componente OrderStatus (estrutura básica)
- **Ação 6**: Integração WebSocket (conexão básica)
- **Ação 7**: Testes unitários para componentes
- **Ação 8**: Responsividade básica
- **Ação 9**: Testes E2E básicos

## 📊 OBJETIVOS DE NEGÓCIO
1. **Monitoramento tempo real**: Atualizações < 1 segundo
2. **Visibilidade completa**: Produção, estoque, pedidos em um lugar
3. **Interface operacional**: Fácil para operadores de chão de fábrica
4. **Alertas visuais**: Destaque imediato para situações críticas
5. **Responsividade**: Funciona em tablets e computadores da fábrica

## 🛠️ TAREFAS ESPECÍFICAS

### TAREFA 3.1: WEBSOCKET SERVER (BACKEND)
Implementar WebSocket integrado ao Fastify para comunicação em tempo real:
- Criar `websocket/dashboard.websocket.ts` com sistema de broadcast
- Configurar heartbeat (30s) para manter conexões ativas
- Implementar autenticação via token JWT para conexões WebSocket
- Sistema de reconexão automática com backoff exponencial
- Monitoramento de métricas: conexões ativas, mensagens por segundo
- Integração com eventos do sistema: estoque crítico, ordens concluídas

### TAREFA 3.2: PROJETO REACT (FRONTEND)
Criar projeto React separado para dashboard de produção:
- Configurar Vite + TypeScript + Tailwind CSS + ESLint
- Setup de desenvolvimento: hot reload, source maps, dev server
- Estrutura de pastas modular baseada em funcionalidades
- Sistema de temas (light/dark) para diferentes ambientes da fábrica
- Internacionalização básica (pt-BR) para operadores

### TAREFA 3.3: COMPONENTES PRINCIPAIS (FRONTEND)
Desenvolver componentes específicos para monitoramento de produção:
- **ProductionQueue**: Fila visual de ordens de produção com drag & drop
- **StockMonitor**: Dashboard de níveis de estoque com alertas visuais
- **OrderStatus**: Timeline interativo de status de pedidos vendidos
- **MachineEfficiency**: Gráficos de eficiência por máquina/operador
- **AlertsPanel**: Sistema de notificações em tempo real com prioridades
- **KPI Dashboard**: Cards com métricas críticas atualizadas em tempo real

### TAREFA 3.4: INTEGRAÇÃO API (FRONTEND)
Conectar dashboard com API estável via REST + WebSocket:
- Service layer para comunicação com endpoints REST da API
- WebSocket client com reconexão automática e cache local
- Sistema de polling fallback (5s) se WebSocket não disponível
- Cache local (IndexedDB) para dados frequentes e offline mode
- Error handling com retry automático para falhas temporárias

## 🧪 TESTES OBRIGATÓRIOS

### TESTES UNITÁRIOS (FRONTEND)
1. **React Components**
   - Testar renderização de dados da API
   - Testar atualizações via WebSocket em tempo real
   - Testar responsividade em diferentes breakpoints
   - Testar interações do usuário (clicks, drag & drop)
   - Testar estado de loading e error handling

2. **Custom Hooks**
   - Testar `useWebSocket` com reconexão automática
   - Testar `useApiService` com cache e retry
   - Testar `useProductionQueue` com operações de fila
   - Testar `useStockMonitor` com alertas de estoque

3. **Services & Utils**
   - Testar formatação de dados para visualização
   - Testar cálculos de métricas (KPI, eficiência)
   - Testar validação de dados da API
   - Testar transformação de dados para gráficos

### TESTES DE INTEGRAÇÃO (FRONTEND + BACKEND)
1. **Fluxo completo API → Dashboard**
   - Testar integração REST API com componentes React
   - Testar comunicação WebSocket em tempo real
   - Testar fallback para polling quando WebSocket falha
   - Testar cache local e sincronização com backend

2. **Autenticação e Segurança**
   - Testar fluxo de login e token refresh
   - Testar autorização baseada em roles (operador, supervisor)
   - Testar proteção de rotas no frontend
   - Testar expiração de sessão e logout automático

### TESTES E2E COM CYPRESS
1. **Experiência do Operador**
   - Testar fluxo completo de monitoramento de produção
   - Testar visualização de alertas em tempo real
   - Testar interação com fila de ordens de produção
   - Testar responsividade em tablets e computadores

2. **Cenários de Falha**
   - Testar comportamento com perda de conexão
   - Testar recovery após downtime do servidor
   - Testar offline mode com cache local
   - Testar error handling de API indisponível

3. **Performance Frontend**
   - Testar tempo de carregamento inicial (< 3s)
   - Testar FPS (frames per second) durante animações
   - Testar uso de memória com múltiplas conexões
   - Testar bundle size otimizado (< 2MB gzipped)

## 📈 MÉTRICAS DE SUCESSO

### PERFORMANCE FRONTEND
- ✅ **Tempo de carregamento inicial**: < 3 segundos (First Contentful Paint)
- ✅ **Latência WebSocket**: < 100ms para atualizações em tempo real
- ✅ **Atualização dashboard**: < 1 segundo após mudança no backend
- ✅ **Bundle size otimizado**: < 2MB gzipped (incluindo todas dependências)
- ✅ **FPS estável**: > 60 FPS durante animações e interações
- ✅ **Uso de memória**: < 200MB RAM com múltiplas conexões ativas

### USABILIDADE E EXPERIÊNCIA DO USUÁRIO
- ✅ **Intuitividade**: Operadores conseguem usar sem treinamento extensivo
- ✅ **Responsividade**: Funciona perfeitamente em tablets (1024px) e computadores
- ✅ **Acessibilidade**: WCAG 2.1 AA compliance para operadores com deficiência visual
- ✅ **Navegação**: Tempo < 2 segundos para alternar entre seções principais
- ✅ **Feedback visual**: Alertas visíveis dentro de 500ms após evento
- ✅ **Offline mode**: Funcionalidade básica disponível sem conexão por até 5 minutos

### INTEGRAÇÃO COM API
- ✅ **Conectividade**: Reconexão automática < 5 segundos após falha de rede
- ✅ **Cache eficiente**: Hit rate > 80% para dados frequentes
- ✅ **Error handling**: Zero crashes por erros de API malformada
- ✅ **Autenticação**: Token refresh automático sem interrupção do usuário
- ✅ **Sincronização**: Dados consistentes entre múltiplos dispositivos

### METRICS DE NEGÓCIO
- ✅ **Adoção**: > 90% dos operadores usando dashboard diariamente
- ✅ **Eficiência**: Redução de tempo de resposta a alertas em > 50%
- ✅ **Disponibilidade**: Uptime > 99.9% durante horário de produção
- ✅ **Satisfação**: NPS > 70 entre operadores e supervisores
- ✅ **Produtividade**: Aumento de throughput em > 15% com monitoramento em tempo real

## ⚠️ SINAIS DE ALERTA (REJEITAR)

### ARQUITETURA FRONTEND
- ❌ **Sem WebSocket fallback**: Dashboard depende 100% de WebSocket sem polling backup
- ❌ **Cache local ausente**: Sem IndexedDB ou localStorage para dados frequentes
- ❌ **Componentes monolíticos**: Componentes React com > 500 linhas ou múltiplas responsabilidades
- ❌ **Estado global excessivo**: Uso abusivo de context/Redux para dados locais
- ❌ **Dependências desnecessárias**: Bundle inchado com libs que poderiam ser substituídas

### QUALIDADE DE CÓDIGO
- ❌ **Testes insuficientes**: Cobertura < 80% para componentes críticos
- ❌ **Sem testes de responsividade**: Não testado em tablets (1024px) ou mobile
- ❌ **TypeScript any abuse**: Uso excessivo de `any` em vez de tipos específicos
- ❌ **Error handling pobre**: Falta de tratamento para erros de API/network
- ❌ **Logs de debug ausentes**: Sem console.log ou sistema de logging para troubleshooting

### PERFORMANCE FRONTEND
- ❌ **Bundle size grande**: > 2MB gzipped para aplicação de dashboard
- ❌ **Tempo de carregamento lento**: > 5 segundos para First Contentful Paint
- ❌ **Memory leaks**: Uso de memória crescente com uso prolongado
- ❌ **Re-renders excessivos**: Componentes renderizando sem necessidade
- ❌ **WebSocket latência alta**: > 500ms para atualizações em tempo real

### USABILIDADE E UX
- ❌ **Interface complexa**: Operadores precisam de treinamento extensivo
- ❌ **Feedback visual pobre**: Alertas não destacados ou difíceis de identificar
- ❌ **Navegação confusa**: Muitos cliques para acessar informações críticas
- ❌ **Sem offline mode**: Aplicação quebra completamente sem conexão
- ❌ **Acessibilidade ignorada**: Não segue WCAG 2.1 para operadores com deficiência

### INTEGRAÇÃO COM API
- ❌ **Hardcoded endpoints**: URLs da API hardcoded em vez de configuração
- ❌ **Sem retry automático**: Falhas de rede não tentam reconectar automaticamente
- ❌ **Token handling pobre**: Sem refresh automático ou tratamento de expiração
- ❌ **Cache invalidation ausente**: Dados stale mostrados por tempo indefinido
- ❌ **Version locking**: Frontend trava em versão específica da API sem fallback

## 🚀 PRÓXIMOS PASSOS APÓS APROVAÇÃO

### DEPLOY E ROLLOUT
1. **Deploy em staging**: Testar integração completa com API estável
2. **Testes de aceitação**: Validar com supervisores e operadores chave
3. **Deploy em produção**: Rollout gradual para diferentes setores da fábrica
4. **Monitoramento contínuo**: Coletar métricas de uso e performance

### TREINAMENTO E ADOÇÃO
1. **Treinamento operadores**: Sessões práticas de 30 minutos por turno
2. **Documentação rápida**: Guia visual de 1 página para referência rápida
3. **Suporte inicial**: Equipe de suporte disponível nas primeiras 2 semanas
4. **Coleta de feedback**: Sistema simples para sugestões e problemas

### OTIMIZAÇÃO CONTÍNUA
1. **Análise de métricas**: Identificar pontos de atrito na interface
2. **Performance tuning**: Otimizar componentes com maior impacto
3. **Novos recursos**: Priorizar baseado em feedback dos operadores
4. **Manutenção proativa**: Atualizações de segurança e dependências

### INTEGRAÇÃO COM SISTEMAS EXISTENTES
1. **SSO (Single Sign-On)**: Integrar com sistema de autenticação da empresa
2. **Notificações push**: Enviar alertas para dispositivos móveis dos supervisores
3. **Exportação de dados**: Permitir exportar relatórios para Excel/PDF
4. **APIs customizadas**: Criar endpoints específicos para integrações futuras

## 💬 COMO SOLICITAR REVISÃO
```
@fase-3-dashboard: Implementei WebSocket server e dashboard React. 
Por favor, revise conforme checklist da Fase 3.
```

## 🔗 REFERÊNCIAS

### DOCUMENTAÇÃO DA API (PRÉ-REQUISITO)
- [OpenAPI Specification](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/openapi.yaml) - Documentação completa da API versão 1.0
- [API Core Endpoints](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/API_CORE_ENDPOINTS.md) - Lista de endpoints básicos
- [API Advanced Endpoints](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/API_ADVANCED_ENDPOINTS.md) - Endpoints avançados e relatórios

### ESPECIFICAÇÕES DO DASHBOARD
- [DASHBOARD_PRODUCAO_TEMPO_REAL.md](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/DASHBOARD_PRODUCAO_TEMPO_REAL.md) - Especificação técnica completa
- [UI/UX Guidelines](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/UI_UX_GUIDELINES.md) - Padrões de interface para operadores
- [Component Library](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/dashboard/src/components/README.md) - Documentação dos componentes React

### INFRAESTRUTURA BACKEND
- [websocket/dashboard.websocket.ts](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/websocket/dashboard.websocket.ts) - Servidor WebSocket
- [Fastify WebSocket Plugin](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/bootstrap/plugins/websocket.plugin.ts) - Plugin de configuração
- [API Authentication](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/API_AUTHENTICATION.md) - Sistema de autenticação JWT

### PROJETO FRONTEND
- [React Dashboard Project](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/dashboard) - Estrutura do projeto React
- [Build Configuration](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/dashboard/vite.config.ts) - Configuração Vite
- [Testing Setup](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/dashboard/cypress.config.ts) - Configuração Cypress E2E