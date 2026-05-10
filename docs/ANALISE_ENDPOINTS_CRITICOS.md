# ANÁLISE DE ENDPOINTS CRÍTICOS PARA ATUALIZAÇÃO EM TEMPO REAL

## 🎯 TOP 3 ENDPOINTS COM MAIOR IMPACTO NA PRODUÇÃO

### 1. 🥇 **ListarOrdemProducao** - Status da Produção
**Impacto:** ALTO (CRÍTICO)
**Frequência ideal:** 30 segundos
**Justificativa:** O status das ordens de produção muda constantemente durante o dia. Saber em tempo real se uma ordem está:
- Pendente (status "0")
- Em andamento (status "1") 🚨
- Concluída (status "2")
- Cancelada (status "3")

**Dados críticos para monitoramento:**
```typescript
interface ProductionOrderStatus {
  nCodOrdem: string;          // Código da ordem
  cNumero: string;           // Número da ordem
  cStatus: string;           // Status atual
  produtos: Array<{
    nCodProd: string;        // Código do produto
    nQuant: number;          // Quantidade total
    nQuantProduzida: number; // Quantidade já produzida
    nQuantRestante: number;  // Quantidade restante
  }>;
  dDtEmissao: string;        // Data de emissão
  cObservacao: string;       // Observações (urgências)
}
```

**Estratégia de polling inteligente:**
```typescript
class ProductionOrderPollingService {
  private pollingConfig = {
    baseInterval: 30000,     // 30 segundos
    maxInterval: 180000,     // 3 minutos (em caso de erro)
    backoffFactor: 1.5,
    maxRetries: 3,
    
    // Filtros otimizados
    filters: {
      status: ['0', '1'],    // Apenas pendentes e em andamento
      data_de: 'today',      // Apenas ordens de hoje
      apenas_importado_api: 'N'
    }
  };
  
  async pollProductionOrders(): Promise<void> {
    try {
      const activeOrders = await this.omieClient.listarOrdemProducao({
        pagina: 1,
        registros_por_pagina: 50,
        ...this.pollingConfig.filters
      });
      
      // Processar apenas mudanças de status
      const statusChanges = this.detectStatusChanges(activeOrders);
      if (statusChanges.length > 0) {
        await this.notifyStatusChanges(statusChanges);
        await this.updateDashboard(statusChanges);
      }
      
      // Reset interval em caso de sucesso
      this.currentInterval = this.pollingConfig.baseInterval;
      
    } catch (error) {
      // Backoff exponencial
      this.currentInterval = Math.min(
        this.currentInterval * this.pollingConfig.backoffFactor,
        this.pollingConfig.maxInterval
      );
      this.errorCount++;
      
      if (this.errorCount >= this.pollingConfig.maxRetries) {
        await this.triggerEmergencyAlert(error);
      }
    }
  }
}
```

### 2. 🥈 **ListarPedidos (status=20)** - Novos Pedidos para Produção
**Impacto:** ALTO (CRÍTICO)
**Frequência ideal:** 1 minuto
**Justificativa:** Pedidos com status "20" estão prontos para produção. Detectar rapidamente novos pedidos permite:
- Planejamento imediato da produção
- Alocação de recursos (máquinas, operadores)
- Priorização baseada em urgência/cliente

**Otimização de filtros:**
```json
{
  "call": "ListarPedidos",
  "param": [
    {
      "pagina": 1,
      "registros_por_pagina": 30,
      "apenas_importado_api": "N",
      "filtrar_por_data_de": "2026-05-09",  // Data atual
      "filtrar_por_data_ate": "2026-05-09",
      "filtrar_por_situacao": "20",         // Apenas em produção
      "ordenar_por": "dDtPed",              // Mais recentes primeiro
      "ordenar_decrescente": "S"
    }
  ]
}
```

**Sistema de detecção de novos pedidos:**
```typescript
class NewOrderDetectionService {
  private lastKnownOrders: Set<string> = new Set();
  private lastSyncTime: Date | null = null;
  
  async detectNewOrders(): Promise<NewOrder[]> {
    const currentOrders = await this.fetchCurrentOrders();
    const newOrders: NewOrder[] = [];
    
    for (const order of currentOrders) {
      if (!this.lastKnownOrders.has(order.nCodPed)) {
        newOrders.push(order);
        this.lastKnownOrders.add(order.nCodPed);
        
        // Processamento imediato
        await this.processNewOrder(order);
      }
    }
    
    // Limpar cache de ordens antigas (mais de 24h)
    this.cleanOldOrders();
    this.lastSyncTime = new Date();
    
    return newOrders;
  }
  
  private async processNewOrder(order: Order): Promise<void> {
    // 1. Verificar estoque disponível
    const stockCheck = await this.checkStockForOrder(order);
    
    // 2. Criar ordem de produção automática (se estoque OK)
    if (stockCheck.hasEnoughStock) {
      await this.createProductionOrder(order);
      
      // 3. Atualizar status do pedido para "em produção"
      await this.updateOrderStatus(order.nCodPed, '20');
      
      // 4. Notificar equipe de produção
      await this.notifyProductionTeam(order);
    } else {
      // 5. Alertar sobre falta de estoque
      await this.triggerStockShortageAlert(order, stockCheck);
    }
  }
}
```

### 3. 🥉 **ListarPosEstoque** - Monitoramento de Estoque
**Impacto:** ALTO (CRÍTICO)
**Frequência ideal:** 2 minutos
**Justificativa:** Estoque atualizado é fundamental para:
- Decisões de produção (o que pode ser produzido)
- Alertas de estoque crítico
- Planejamento de compras de matérias-primas

**Estratégia de cache multi-nível:**
```typescript
class StockCacheService {
  private cacheLevels = {
    // Nível 1: Memória (ultra rápido)
    memory: {
      ttl: 30000,           // 30 segundos
      maxItems: 1000,
      cache: new Map<string, { data: any, timestamp: number }>()
    },
    
    // Nível 2: Redis (rápido, persistente)
    redis: {
      ttl: 300000,          // 5 minutos
      prefix: 'stock:'
    },
    
    // Nível 3: Banco de dados (completo, histórico)
    database: {
      table: 'stock_snapshots',
      retentionDays: 30
    }
  };
  
  async getStockWithCache(productCode: string): Promise<StockData> {
    // 1. Tentar memória primeiro
    const memoryData = this.getFromMemory(productCode);
    if (memoryData && !this.isExpired(memoryData.timestamp, 30000)) {
      return memoryData.data;
    }
    
    // 2. Tentar Redis
    const redisData = await this.getFromRedis(productCode);
    if (redisData && !this.isExpired(redisData.timestamp, 300000)) {
      // Atualizar cache de memória
      this.setInMemory(productCode, redisData.data);
      return redisData.data;
    }
    
    // 3. Buscar do Omie (cache miss)
    const freshData = await this.fetchFromOmie(productCode);
    
    // 4. Atualizar todos os níveis de cache
    await this.updateAllCaches(productCode, freshData);
    
    return freshData;
  }
}
```

## ⚡ SISTEMA DE POLLING INTELIGENTE

### Arquitetura de Polling

```typescript
class IntelligentPollingOrchestrator {
  private endpoints: PollingEndpoint[] = [
    {
      name: 'ListarOrdemProducao',
      interval: 30000,
      priority: 1,
      lastExecution: null,
      errorCount: 0,
      isActive: true,
      
      // Configuração específica
      config: {
        filters: { status: ['0', '1'] },
        pageSize: 50,
        processOnlyChanges: true
      }
    },
    {
      name: 'ListarPedidos',
      interval: 60000,
      priority: 2,
      lastExecution: null,
      errorCount: 0,
      isActive: true,
      
      config: {
        filters: { situacao: '20' },
        pageSize: 30,
        detectNewOrders: true
      }
    },
    {
      name: 'ListarPosEstoque',
      interval: 120000,
      priority: 3,
      lastExecution: null,
      errorCount: 0,
      isActive: true,
      
      config: {
        pageSize: 100,
        monitorCriticalProducts: true,
        alertThreshold: 0.2 // 20% acima do mínimo
      }
    }
  ];
  
  async startPolling(): Promise<void> {
    // Ordenar por prioridade
    this.endpoints.sort((a, b) => a.priority - b.priority);
    
    // Executar polling em paralelo com intervalos diferentes
    for (const endpoint of this.endpoints) {
      if (endpoint.isActive) {
        this.scheduleEndpointPolling(endpoint);
      }
    }
  }
  
  private scheduleEndpointPolling(endpoint: PollingEndpoint): void {
    setInterval(async () => {
      try {
        const startTime = Date.now();
        
        // Executar polling
        const data = await this.executePolling(endpoint);
        
        // Processar dados
        await this.processPollingData(endpoint, data);
        
        // Atualizar métricas
        const duration = Date.now() - startTime;
        this.updateMetrics(endpoint.name, duration, true);
        
        // Reset error count em caso de sucesso
        endpoint.errorCount = 0;
        
      } catch (error) {
        endpoint.errorCount++;
        this.updateMetrics(endpoint.name, 0, false);
        
        // Backoff inteligente
        if (endpoint.errorCount >= 3) {
          await this.handlePollingFailure(endpoint, error);
        }
      }
    }, endpoint.interval);
  }
}
```

### Sistema de Alertas em Tempo Real

```typescript
class RealTimeAlertSystem {
  private alertRules = {
    // Alertas de produção
    productionStatusChange: {
      condition: (oldStatus: string, newStatus: string) => 
        oldStatus !== newStatus,
      priority: 'HIGH',
      channels: ['dashboard', 'email', 'push'],
      template: 'Status da ordem {orderNumber} mudou de {oldStatus} para {newStatus}'
    },
    
    // Alertas de estoque crítico
    stockCritical: {
      condition: (product: StockProduct) => 
        product.nSaldoDisponivel < product.nEstoqueMinimo * 1.2,
      priority: 'CRITICAL',
      channels: ['dashboard', 'email', 'push', 'sms'],
      template: 'Estoque crítico: {productCode} - {productName}. Disponível: {available}, Mínimo: {minimum}'
    },
    
    // Alertas de atraso na produção
    productionDelay: {
      condition: (order: ProductionOrder) => {
        const hoursSinceStart = this.getHoursSince(order.dDtEmissao);
        return hoursSinceStart > 24 && order.cStatus === '1';
      },
      priority: 'MEDIUM',
      channels: ['dashboard', 'email'],
      template: 'Atraso na produção: Ordem {orderNumber} está em andamento há {hours} horas'
    },
    
    // Alertas de qualidade
    qualityIssue: {
      condition: (order: ProductionOrder) => 
        order.nQuantRejeitada > order.nQuant * 0.05,
      priority: 'HIGH',
      channels: ['dashboard', 'email', 'push'],
      template: 'Problema de qualidade: Ordem {orderNumber} tem {rejected}% de rejeição'
    }
  };
  
  async monitorAndAlert(): Promise<void> {
    // Monitorar mudanças em tempo real
    const changes = await this.detectChanges();
    
    for (const change of changes) {
      // Verificar regras de alerta
      const triggeredAlerts = this.checkAlertRules(change);
      
      if (triggeredAlerts.length > 0) {
        // Processar alertas
        await this.processAlerts(triggeredAlerts, change);
        
        // Atualizar dashboard
        await this.updateDashboardWithAlerts(triggeredAlerts);
        
        // Registrar no histórico
        await this.logAlerts(triggeredAlerts);
      }
    }
  }
}
```

## 📊 OTIMIZAÇÃO DE PERFORMANCE

### 1. **Batch Processing**
```typescript
class BatchProcessor {
  async processInBatches<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      // Pequena pausa para evitar rate limiting
      if (i + batchSize < items.length) {
        await this.sleep(100);
      }
    }
    
    return results;
  }
}
```

### 2. **Cache Stale-While-Revalidate**
```typescript
class SWRCacheService {
  async getWithSWR(key: string, fetcher: () => Promise<any>): Promise<any> {
    const cached = await this.getFromCache(key);
    
    if (cached) {
      // Retornar dados cacheados imediatamente
      // Atualizar em background se necessário
      if (this.isStale(cached.timestamp)) {
        this.refreshInBackground(key, fetcher);
      }
      return cached.data;
    }
    
    // Cache miss: buscar e cachear
    const freshData = await fetcher();
    await this.setInCache(key, freshData);
    return freshData;
  }
}
```

### 3. **Priorização Dinâmica**
```typescript
class DynamicPriorityScheduler {
  private adjustPriorityBasedOnTime(): void {
    const hour = new Date().getHours();
    
    // Alta prioridade durante horário comercial
    if (hour >= 8 && hour <= 18) {
      this.setHighPriority('ListarOrdemProducao');
      this.setHighPriority('ListarPedidos');
    } else {
      // Baixa prioridade fora do horário
      this.setLowPriority('ListarOrdemProducao');
      this.setLowPriority('ListarPedidos');
    }
    
    // Estoque sempre médio-alta prioridade
    this.setMediumPriority('ListarPosEstoque');
  }
}
```

## 🚨 PLANOS DE CONTINGÊNCIA

### 1. **Falha no Polling**
```typescript
class PollingContingencyPlan {
  async handlePollingFailure(endpoint: string, error: Error): Promise<void> {
    // 1. Registrar falha
    await this.logFailure(endpoint, error);
    
    // 2. Aumentar intervalo (backoff)
    this.increasePollingInterval(endpoint);
    
    // 3. Notificar administradores
    if (this.getErrorCount(endpoint) >= 3) {
      await this.notifyAdmins(`Falha crítica no polling: ${endpoint}`);
    }
    
    // 4. Tentar fallback (dados cacheados)
    if (this.getErrorCount(endpoint) >= 5) {
      await this.switchToCachedData(endpoint);
      await this.notifyAdmins(`Usando dados cacheados para: ${endpoint}`);
    }
  }
}
```

### 2. **API Omie Indisponível**
```typescript
class OmieAPIContingency {
  async handleAPIDowntime(): Promise<void> {
    // 1. Usar dados cacheados
    const cachedData = await this.getCachedData();
    
    // 2. Marcar dados como "potencialmente desatualizados"
    await this.markDataAsStale();
    
    // 3. Notificar usuários
    await this.showWarning('Dados podem estar desatualizados devido a problemas técnicos');
    
    // 4. Tentar reconexão periódica
    this.scheduleReconnectionAttempt();
  }
}
```

## 📈 MÉTRICAS DE MONITORAMENTO

### Métricas por Endpoint:
```typescript
interface EndpointMetrics {
  name: string;
  lastSuccess: Date;
  lastFailure: Date | null;
  successRate: number;        // % de sucesso (últimas 24h)
  avgResponseTime: number;    // ms
  errorCount: number;         // últimas 24h
  cacheHitRate: number;       % de cache hits
  dataFreshness: number;      // segundos desde última atualização
}
```

### Alertas Automáticos:
1. **Success rate < 95%**: Investigar problemas de conexão
2. **Response time > 5s**: Otimizar queries/cache
3. **Error count > 10 em 1h**: Possível problema na API Omie
4. **Data freshness > 10min**: Polling pode estar falhando

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### FASE 1 (24-48h):
1. **Implementar polling básico** para os 3 endpoints críticos
2. **Configurar Redis** para cache nível 2
3. **Criar dashboard mínimo** com status em tempo real
4. **Implementar sistema de alertas** para estoque crítico

### FASE 2 (1 semana):
1. **Otimizar polling** com backoff inteligente
2. **Implementar cache multi-nível** (memória → Redis → DB)
3. **Desenvolver sistema de fila** para processamento em lote
4. **Criar integração automática** vendas → produção

### FASE 3 (2 semanas):
1. **Adicionar métricas avançadas** de performance
2. **Implementar planos de contingência** completos
3. **Desenvolver dashboard avançado** com análises
4. **Criar sistema de previsão** de demanda

**NOTA:** O foco absoluto deve ser na **detecção em tempo real** de mudanças que afetam a produção. Qualquer atraso na detecção de novos pedidos ou mudanças no status da produção impacta diretamente a eficiência da fábrica.