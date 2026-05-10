---
alwaysApply: true
scene: development
---

# ETAPA 2 - DIRETRIZES DE IMPLEMENTAÇÃO

## OBJETIVOS PRIORITÁRIOS
1. **Estoque atualizado**: 2 minutos
2. **Pedidos vendidos**: 1 minuto
3. **Ordens produção**: 30 segundos
4. **Dashboard tempo real**: WebSocket
5. **Alertas automáticos**: Estoque crítico

## FASE 1: POLLING INTELIGENTE (Dias 1-3)

### Tarefa 1.1: IntelligentPollingService
```typescript
// modules/shared/services/IntelligentPollingService.ts
class IntelligentPollingService {
  private config = {
    'estoque': { base: 120000, max: 600000 },
    'pedidos': { base: 60000, max: 300000 },
    'producao': { base: 30000, max: 120000 }
  };
}
```

### Tarefa 1.2: Modificar jobs existentes
- `omie-production-orders-sync.job.ts`: 30s interval
- `omie-orders-stage20.job.ts`: 1min interval
- Criar `stock-monitor.job.ts`: 2min interval

## FASE 2: CACHE MULTI-NÍVEL (Dias 4-6)

### Tarefa 2.1: Configurar Redis
- Adicionar `REDIS_URL` ao env
- Criar `infra/redis.ts` com client configurado

### Tarefa 2.2: MultiLevelCacheService
```typescript
// modules/shared/services/MultiLevelCacheService.ts
class MultiLevelCacheService {
  async getWithCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // 1. Memória → 2. Redis → 3. Banco → 4. Omie
  }
}
```

## FASE 3: DASHBOARD TEMPO REAL (Dias 7-10)

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