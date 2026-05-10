---
name: "fase-3-dashboard"
description: "Agente de revisão para Fase 3 - Dashboard Tempo Real. Invoke quando implementar WebSocket server, criar componentes React ou desenvolver dashboard com atualizações em tempo real."
---

# FASE 3 - AGENTE DE REVISÃO: DASHBOARD TEMPO REAL

## 🎯 OBJETIVOS DA FASE 3
1. **WebSocket Server**: Integrado ao Fastify
2. **Componentes React**: Dashboard com atualizações automáticas
3. **Integração dados**: Polling + Cache + WebSocket
4. **Interface responsiva**: Funciona em desktop e mobile

## 📋 CHECKLIST DE REVISÃO

### ✅ 1. WEBSOCKET SERVER
- [ ] **Integração Fastify**: Plugin WebSocket configurado
- [ ] **Conexões persistentes**: Heartbeat funcionando
- [ ] **Broadcast**: Atualizações para todos clientes
- [ ] **Reconexão automática**: Clientes reconectam após falha
- [ ] **Monitoramento**: Métricas de conexões WebSocket

### ✅ 2. COMPONENTES REACT
- [ ] **KPI Cards**: Produção, estoque, pedidos, eficiência
- [ ] **Gráficos**: Produção por hora, estoque crítico
- [ ] **Listas**: Ordens ativas, alertas, máquinas
- [ ] **Controles**: Refresh, intervalos, filtros
- [ ] **Responsividade**: Funciona em diferentes tamanhos de tela

### ✅ 3. INTEGRAÇÃO DADOS
- [ ] **Polling → WebSocket**: Atualizações em tempo real
- [ ] **Cache → Dashboard**: Dados rápidos com fallback
- [ ] **Eventos**: Stock alerts, order status, production updates
- [ ] **Performance**: Dashboard atualiza em < 1 segundo

### ✅ 4. INTERFACE
- [ ] **UI intuitiva**: Fácil de usar para operadores
- [ ] **Status claro**: Conexão, atualização, erros visíveis
- [ ] **Alertas visíveis**: Destaque para situações críticas
- [ ] **Logs**: Ações do usuário registradas

## 🔍 CRITÉRIOS DE ACEITAÇÃO

### 1. PERFORMANCE WEBSOCKET
- **Latência mensagens**: < 100ms
- **Conexões simultâneas**: Suporta > 100 clientes
- **Reconexão**: < 5 segundos após falha
- **Heartbeat**: Mantém conexões ativas

### 2. EXPERIÊNCIA USUÁRIO
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