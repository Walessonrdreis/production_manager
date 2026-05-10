---
name: "fase-3-dashboard"
description: "Agente de revisão para Fase 3 - Dashboard Tempo Real (Frontend). Invoke quando implementar WebSocket server, criar componentes React ou desenvolver dashboard com atualizações em tempo real como parte do Frontend após API estável."
---

# FASE 3 - AGENTE DE REVISÃO: DASHBOARD TEMPO REAL (FRONTEND)

## 🎯 CONTEXTO DA FASE - ESTRATÉGIA API-FIRST
Você está revisando a **Fase 3 da Etapa 2** com foco **API-FIRST**. Esta fase (Dias 21-40) desenvolve o **Dashboard Frontend** completo, APÓS a API Core e API Avançada estarem estáveis e documentadas.

## 🎯 OBJETIVOS DA FASE 3 (FRONTEND)
1. **WebSocket Server**: Integrado ao Fastify para comunicação em tempo real
2. **Componentes React**: Dashboard com atualizações automáticas via API
3. **Integração dados**: Polling + Cache + WebSocket + API REST
4. **Interface responsiva**: Funciona em tablets da fábrica e desktop
5. **Experiência operador**: Intuitiva para uso diário sem treinamento extensivo

## 📋 CHECKLIST DE REVISÃO

### ✅ 1. WEBSOCKET SERVER (BACKEND PARA FRONTEND)
- [ ] **Integração Fastify**: Plugin WebSocket configurado para frontend
- [ ] **Conexões persistentes**: Heartbeat funcionando para clientes React
- [ ] **Broadcast**: Atualizações para todos clientes dashboard
- [ ] **Reconexão automática**: Clientes React reconectam após falha
- [ ] **Monitoramento**: Métricas de conexões WebSocket para frontend

### ✅ 2. COMPONENTES REACT (FRONTEND)
- [ ] **KPI Cards**: Produção, estoque, pedidos, eficiência via API
- [ ] **Gráficos**: Produção por hora, estoque crítico com dados da API
- [ ] **Listas**: Ordens ativas, alertas, máquinas consumindo endpoints REST
- [ ] **Controles**: Refresh, intervalos, filtros integrados com API
- [ ] **Responsividade**: Funciona em tablets (1024px) e computadores da fábrica

### ✅ 3. INTEGRAÇÃO COM API (FRONTEND + BACKEND)
- [ ] **API REST**: Consumo correto de endpoints da API Core e Avançada
- [ ] **WebSocket**: Notificações em tempo real via WebSocket server
- [ ] **Cache local**: IndexedDB/localStorage para dados frequentes
- [ ] **Fallback**: Polling se WebSocket não disponível
- [ ] **Performance**: Dashboard atualiza em < 1 segundo após mudança na API

### ✅ 4. INTERFACE E USABILIDADE (FRONTEND)
- [ ] **UI intuitiva**: Fácil de usar para operadores sem treinamento extensivo
- [ ] **Status claro**: Conexão API, atualização, erros visíveis para operadores
- [ ] **Alertas visíveis**: Destaque imediato para situações críticas de estoque
- [ ] **Logs**: Ações do operador registradas para auditoria
- [ ] **Acessibilidade**: WCAG 2.1 AA compliance para operadores com deficiência

## 🔍 CRITÉRIOS DE ACEITAÇÃO (FRONTEND)

### 1. PERFORMANCE FRONTEND
- **Tempo de carregamento**: < 3 segundos para First Contentful Paint
- **Latência WebSocket**: < 100ms para atualizações em tempo real
- **Atualização dashboard**: < 1 segundo após mudança na API
- **FPS estável**: > 60 FPS durante animações e interações
- **Uso de memória**: < 200MB RAM com múltiplas conexões ativas

### 2. EXPERIÊNCIA DO OPERADOR
- **Tempo carregamento**: < 2 segundos inicial
- **Atualizações automáticas**: Sem necessidade de refresh
- **Responsividade**: Funciona em mobile e desktop
- **Feedback visual**: Ações do usuário confirmadas

### 3. CONFIABILIDADE
- **Fallback REST**: Se WebSocket falha
- **Dados consistentes**: Mesmo estado para todos clientes
- **Recuperação erro**: Reconecta automaticamente
- **Monitoramento**: Métricas de uso e performance

## 🧪 TESTES OBRIGATÓRIOS

### UNITÁRIOS (FRONTEND)
```typescript
// Componentes React
test('KPI Cards renderizam dados corretamente')
test('Gráficos atualizam com novos dados')
test('WebSocket reconecta após falha')
test('Interface responsiva em diferentes tamanhos')

// Hooks customizados
test('useWebSocket mantém conexão')
test('useDashboardData atualiza automaticamente')
test('useStockAlerts notifica mudanças')
```

### INTEGRAÇÃO
```typescript
// Backend + Frontend
test('WebSocket envia atualizações em tempo real')
test('Dashboard reflete mudanças imediatamente')
test('Fallback REST funciona se WebSocket falha')
test('Dados consistentes entre múltiplos clientes')
```

### PERFORMANCE
```typescript
test('Latência WebSocket < 100ms')
test('Dashboard carrega em < 2s')
test('Atualizações visíveis em < 1s')
test('Uso memória < 100MB')
```

## 📊 MÉTRICAS DE SUCESSO

### OPERACIONAIS
- **Latência WebSocket**: < 100ms
- **Tempo carregamento**: < 2 segundos
- **Uptime conexão**: > 99.5%
- **Clientes simultâneos**: Suporta > 50

### DE NEGÓCIO
- **Decisões mais rápidas**: Dados atualizados em < 1s
- **Redução erros**: Visibilidade completa da produção
- **Aumento eficiência**: Alertas em tempo real
- **Satisfação usuários**: Interface intuitiva

## ⚠️ SINAIS DE ALERTA

### REJEITAR SE:
1. **WebSocket instável**: Conexões caem frequentemente
2. **Latência alta**: Atualizações > 1 segundo
3. **Interface confusa**: Dificuldade para operadores
4. **Sem fallback**: Dashboard quebra sem WebSocket
5. **Performance ruim**: Lento em mobile ou internet lenta

### APROVAR SE:
1. **Atualizações em tempo real**: Dados refletem mudanças imediatamente
2. **Interface intuitiva**: Fácil para operadores usarem
3. **Responsividade**: Funciona bem em todos dispositivos
4. **Confiabilidade**: WebSocket estável com reconexão automática
5. **Performance**: Rápido e responsivo

## 🔄 PRÓXIMOS PASSOS APÓR APROVAÇÃO

### IMEDIATOS
1. **Commit**: `feat(dashboard): implement real-time dashboard with WebSocket`
2. **Deploy**: Frontend + Backend integrados
3. **Treinamento**: Operadores aprendem a usar dashboard

### PREPARAÇÃO FASE 4
1. **Configurar sistema alertas**: Preparar notificações
2. **Planejar integração vendas → produção**: Automatizar fluxo
3. **Documentar**: Transição para Fase 4

## 🛠️ CONFIGURAÇÃO WEBSOCKET

### BACKEND (FASTIFY)
```typescript
// websocket/dashboard.websocket.ts
import { WebSocketServer } from 'ws';

export class DashboardWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  
  constructor(server: http.Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/dashboard' });
    this.setupWebSocket();
  }
  
  public broadcast(event: string, data: any): void {
    const message = JSON.stringify({ type: event, data, timestamp: Date.now() });
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
```

### FRONTEND (REACT)
```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        setIsConnected(true);
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        setLastMessage(JSON.parse(event.data));
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 5000); // Reconectar após 5s
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
    };
    
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);
  
  return { isConnected, lastMessage };
};
```