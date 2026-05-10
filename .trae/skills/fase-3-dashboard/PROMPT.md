# PROMPT PARA FASE 3 - DASHBOARD TEMPO REAL

## 🎯 CONTEXTO DA FASE
Você está implementando a **Fase 3 da Etapa 2** do projeto Production Manager. O foco é criar um dashboard em tempo real para monitoramento da produção, integrando WebSocket com os sistemas de polling e cache já implementados.

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
- **Fase 1 aprovada**: Polling inteligente funcionando
- **Fase 2 aprovada**: Cache multi-nível configurado
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

1. **Máximo por ação**: Implemente **UMA** tarefa por vez
2. **Mostre progresso**: Após cada tarefa, mostre o que foi feito
3. **Teste incremental**: Teste cada parte antes de continuar
4. **Evite créditos excessivos**: Faça pouco a pouco para não esgotar créditos
5. **Facilite revisão**: Mostre progresso claro para eu revisar facilmente

**EXEMPLO DE FLUXO CORRETO PARA FASE 3:**
1. Crie WebSocket server (apenas estrutura com heartbeat)
2. Mostre o server implementado
3. Configure projeto React (Vite + TypeScript + Tailwind)
4. Mostre a configuração
5. Desenvolva UM componente (ex: ProductionQueue)
6. Mostre o componente
7. Escreva testes para o componente
8. Integre componente com WebSocket
9. Teste e corrija incrementalmente

**NUNCA FAÇA**: Criar WebSocket + configurar React + desenvolver todos componentes + escrever todos testes + integrar tudo de uma vez!

**DIVISÃO RECOMENDADA PARA FASE 3:**
- **Ação 1**: WebSocket server básico
- **Ação 2**: Configuração projeto React
- **Ação 3**: Componente ProductionQueue
- **Ação 4**: Componente StockMonitor  
- **Ação 5**: Componente OrderStatus
- **Ação 6**: Integração WebSocket
- **Ação 7**: Testes E2E

## 📊 OBJETIVOS DE NEGÓCIO
1. **Monitoramento tempo real**: Atualizações < 1 segundo
2. **Visibilidade completa**: Produção, estoque, pedidos em um lugar
3. **Interface operacional**: Fácil para operadores de chão de fábrica
4. **Alertas visuais**: Destaque imediato para situações críticas
5. **Responsividade**: Funciona em tablets e computadores da fábrica

## 🛠️ TAREFAS ESPECÍFICAS

### TAREFA 3.1: WEBSOCKET SERVER
Implementar WebSocket integrado ao Fastify:
- Criar `websocket/dashboard.websocket.ts`
- Configurar heartbeat para manter conexões
- Implementar broadcast de atualizações
- Sistema de reconexão automática
- Monitoramento de métricas de conexão

### TAREFA 3.2: PROJETO REACT
Criar projeto React separado para dashboard:
- Configurar Vite + TypeScript + Tailwind
- Componentes principais: KPI Cards, Charts, Alerts
- Integração WebSocket com reconexão
- Cache local para performance offline

### TAREFA 3.3: INTEGRAÇÃO DADOS
Conectar dashboard com backend:
- WebSocket para atualizações em tempo real
- REST API para dados históricos
- Cache local para dados frequentes
- Fallback para polling se WebSocket falhar

### TAREFA 3.4: COMPONENTES PRINCIPAIS
Desenvolver componentes específicos:
- **ProductionQueue**: Fila de ordens de produção
- **StockMonitor**: Níveis de estoque crítico
- **OrderStatus**: Status de pedidos vendidos
- **MachineEfficiency**: Eficiência por máquina
- **AlertsPanel**: Painel de alertas ativos

## 🧪 TESTES OBRIGATÓRIOS

### TESTES UNITÁRIOS
1. **WebSocket Server**
   - Testar conexão e desconexão
   - Testar heartbeat funcionando
   - Testar broadcast de mensagens
   - Testar reconexão automática

2. **React Components**
   - Testar renderização de dados
   - Testar atualizações via WebSocket
   - Testar responsividade
   - Testar interações do usuário

### TESTES DE INTEGRAÇÃO
1. **Fluxo completo**
   - Testar polling → cache → WebSocket → dashboard
   - Testar fallback se WebSocket falha
   - Testar performance com múltiplos clientes
   - Testar recovery após downtime

### TESTES E2E
1. **Experiência usuário**
   - Testar uso real por operador
   - Testar em diferentes dispositivos
   - Testar cenários de falha de rede
   - Testar tempo de carregamento inicial

## 📈 MÉTRICAS DE SUCESSO

### OPERACIONAIS
- ✅ Latência WebSocket < 100ms
- ✅ Dashboard atualiza em < 1 segundo
- ✅ Suporta > 50 conexões simultâneas
- ✅ Reconexão automática < 5 segundos

### DE NEGÓCIO
- ✅ Operadores conseguem monitorar produção em tempo real
- ✅ Alertas visíveis imediatamente
- ✅ Interface intuitiva sem treinamento extensivo
- ✅ Funciona em tablets da fábrica

### EXPERIÊNCIA USUÁRIO
- ✅ Tempo de carregamento inicial < 3 segundos
- ✅ Zero erros de interface para operadores
- ✅ Navegação intuitiva entre seções
- ✅ Status de conexão sempre visível

## ⚠️ SINAIS DE ALERTA (REJEITAR)

### ARQUITETURA
- ❌ WebSocket sem heartbeat ou reconexão
- ❌ Dashboard sem cache local
- ❌ Sem fallback para polling
- ❌ Componentes React não responsivos

### QUALIDADE
- ❌ Testes não cobrem cenários de falha de rede
- ❌ Sem testes de performance WebSocket
- ❌ Interface não testada em dispositivos móveis
- ❌ Logs incompletos para debugging

### PERFORMANCE
- ❌ Latência WebSocket > 500ms
- ❌ Dashboard atualiza > 5 segundos
- ❌ Consumo excessivo de memória no cliente
- ❌ Tempo de carregamento > 10 segundos

### USABILIDADE
- ❌ Interface confusa para operadores
- ❌ Alertas não visíveis o suficiente
- ❌ Sem indicação clara de status de conexão
- ❌ Navegação complexa entre seções

## 🚀 PRÓXIMOS PASSOS APÓS APROVAÇÃO

1. **Treinar**: Operadores no uso do dashboard
2. **Monitorar**: Uso real e feedback dos operadores
3. **Otimizar**: Baseado em uso real na fábrica
4. **Preparar**: Ambiente para Fase 4 (Sistema de Alertas)

## 💬 COMO SOLICITAR REVISÃO
```
@fase-3-dashboard: Implementei WebSocket server e dashboard React. 
Por favor, revise conforme checklist da Fase 3.
```

## 🔗 REFERÊNCIAS
- [DASHBOARD_PRODUCAO_TEMPO_REAL.md](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/DASHBOARD_PRODUCAO_TEMPO_REAL.md)
- [websocket/dashboard.websocket.ts](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/websocket/dashboard.websocket.ts)
- [React Dashboard Project](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/dashboard)
- [Fastify WebSocket Plugin](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/bootstrap/plugins/websocket.plugin.ts)