---
alwaysApply: true
scene: development
---

# ETAPA 2 - DIRETRIZES DE IMPLEMENTAÇÃO (API-FIRST)

## OBJETIVOS PRIORITÁRIOS - ESTRATÉGIA API-FIRST
1. **API Core estável**: Dias 1-10 - Endpoints básicos de produção
2. **API Avançada completa**: Dias 11-20 - Funcionalidades avançadas
3. **Frontend dashboard**: Dias 21-40 - React após API estável
4. **Sistema de alertas**: Dias 11-20 - Parte da API Avançada
5. **Compatibilidade mantida**: APIs existentes funcionando

## FASE 1: API CORE (Dias 1-10)

### Tarefa 1.1: Endpoints de Sincronização
```typescript
// modules/sync/routes/stock.routes.ts
export const stockSyncRoutes = {
  method: 'POST',
  url: '/api/sync/stock',
  handler: stockSyncHandler
};

// modules/sync/routes/orders.routes.ts  
export const ordersSyncRoutes = {
  method: 'POST',
  url: '/api/sync/orders',
  handler: ordersSyncHandler
};
```

### Tarefa 1.2: Sistema de Alertas Básico
- `GET /api/alerts/stock/critical`: Listar estoque crítico
- `POST /api/alerts/stock/configure`: Configurar limites
- Integração com polling de estoque (2min interval)

### Tarefa 1.3: Fila de Produção
- `POST /api/production/queue/add`: Adicionar ordem à fila
- Sistema de prioridades básico
- Integração vendas→produção automática

## FASE 2: API AVANÇADA (Dias 11-20)

### Tarefa 2.1: Cache Multi-nível
```typescript
// modules/shared/services/MultiLevelCacheService.ts
class MultiLevelCacheService {
  async getWithCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // 1. Memória → 2. Redis → 3. Banco → 4. Omie
  }
}
```

### Tarefa 2.2: Métricas e Previsão
- `GET /api/metrics/production/efficiency`: KPIs de produção
- `POST /api/forecast/demand`: Previsão de demanda
- Relatórios avançados em PDF

### Tarefa 2.3: Sistema de Alertas Avançado
- Regras complexas com machine learning
- Notificações multi-canal (Email, SMS, WebSocket)
- Dashboard de gestão de alertas

## FASE 3: FRONTEND DASHBOARD (Dias 21-40)

### Tarefa 3.1: WebSocket Server
- Adicionar WebSocket ao Fastify
- Criar `websocket/dashboard.websocket.ts`

### Tarefa 3.2: Componentes React
- Criar projeto React separado
- Componentes: KPI Cards, Charts, Alerts

## FASE 4: SISTEMA DE ALERTAS (Dias 11-14)

### Tarefa 4.1: StockMonitorService
```typescript
// modules/stock-monitor/application/StockMonitorService.ts
class StockMonitorService {
  async checkCriticalStock(): Promise<Alert[]> {
    // Regras: estoque mínimo, consumo anormal, validade
  }
}
```

### Tarefa 4.2: Notificações
- Email: produtos críticos
- SMS: ruptura iminente
- Dashboard: alertas ativos

## REGRAS TÉCNICAS

### 1. **NÃO QUEBRAR EXISTENTE**
- APIs públicas mantidas
- Jobs existentes continuam funcionando
- Compatibilidade com frontend atual

### 2. **TESTES OBRIGATÓRIOS**
- Unitários para nova lógica
- Integração para APIs/database
- E2E para fluxos críticos

### 3. **MONITORAMENTO**
- Logs de polling (sucesso/falha)
- Métricas de cache hit rate
- Alertas de sistema indisponível

### 4. **ROLLBACK PLAN**
- Cada feature tem rollback script
- Testar rollback em staging
- Documentar procedimentos