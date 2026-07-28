# SISTEMA DE MONITORAMENTO DE ESTOQUE EM TEMPO REAL

## 🎯 OBJETIVO PRINCIPAL

**Monitorar o estoque de produtos críticos para produção com atualizações a cada 2 minutos e alertas automáticos quando o estoque atinge níveis perigosos.**

## 📊 NÍVEIS DE ALERTA DE ESTOQUE

### 🟢 **NÍVEL 1: NORMAL** (80-100% do estoque mínimo)
- **Condição:** `saldo_disponivel >= estoque_minimo * 1.2`
- **Ação:** Apenas monitoramento
- **Notificação:** Nenhuma

### 🟡 **NÍVEL 2: ATENÇÃO** (60-80% do estoque mínimo)
- **Condição:** `estoque_minimo * 1.0 <= saldo_disponivel < estoque_minimo * 1.2`
- **Ação:** Alertar supervisor de produção
- **Notificação:** Dashboard (amarelo), Email diário

### 🟠 **NÍVEL 3: ALERTA** (40-60% do estoque mínimo)
- **Condição:** `estoque_minimo * 0.8 <= saldo_disponivel < estoque_minimo * 1.0`
- **Ação:** Alertar gerente de produção
- **Notificação:** Dashboard (laranja), Email imediato, Push notification

### 🔴 **NÍVEL 4: CRÍTICO** (abaixo de 40% do estoque mínimo)
- **Condição:** `saldo_disponivel < estoque_minimo * 0.8`
- **Ação:** Parar produção do produto, Alertar diretoria
- **Notificação:** Dashboard (vermelho), Email urgente, Push notification, SMS

## 🏗️ ARQUITETURA DO SISTEMA

### Componentes Principais:

```typescript
interface StockMonitoringSystem {
  // 1. Coletor de dados
  dataCollector: StockDataCollector;
  
  // 2. Processador de alertas
  alertProcessor: StockAlertProcessor;
  
  // 3. Sistema de notificações
  notificationSystem: NotificationSystem;
  
  // 4. Dashboard em tempo real
  realtimeDashboard: DashboardService;
  
  // 5. Banco de dados de histórico
  historyDatabase: StockHistoryDB;
}
```

### Fluxo de Dados:

```
API Omie (ListarPosEstoque)
        ↓ (a cada 2 minutos)
   Coletor de Dados
        ↓
   Processador de Alertas
        ↓
   Sistema de Notificações → Dashboard em Tempo Real
        ↓
   Banco de Histórico
```

## ⚙️ IMPLEMENTAÇÃO TÉCNICA

### 1. Serviço de Coleta de Dados

```typescript
class StockDataCollector {
  private pollingInterval: NodeJS.Timeout | null = null;
  private isCollecting = false;
  private lastCollectionTime: Date | null = null;
  
  async startCollection(): Promise<void> {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    console.log('🚀 Iniciando coleta de dados de estoque...');
    
    // Primeira coleta imediata
    await this.collectStockData();
    
    // Configurar polling a cada 2 minutos
    this.pollingInterval = setInterval(async () => {
      await this.collectStockData();
    }, 120000); // 2 minutos
  }
  
  async collectStockData(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Buscar dados do Omie
      const stockData = await this.fetchFromOmie();
      
      // Processar dados
      const processedData = this.processStockData(stockData);
      
      // Detectar mudanças críticas
      const criticalChanges = this.detectCriticalChanges(processedData);
      
      if (criticalChanges.length > 0) {
        // Enviar para processamento de alertas
        await this.alertProcessor.process(criticalChanges);
      }
      
      // Atualizar cache
      await this.updateCache(processedData);
      
      // Registrar no histórico
      await this.saveToHistory(processedData);
      
      this.lastCollectionTime = new Date();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Coleta concluída em ${duration}ms. ${processedData.length} produtos processados.`);
      
    } catch (error) {
      console.error('❌ Erro na coleta de dados:', error);
      await this.handleCollectionError(error);
    }
  }
  
  private async fetchFromOmie(): Promise<OmieStockResponse> {
    const params = {
      pagina: 1,
      registros_por_pagina: 500,
      apenas_importado_api: 'N',
      filtrar_por_data_de: this.getTodayDate(),
      filtrar_por_data_ate: this.getTodayDate()
    };
    
    return await this.omieClient.listarPosEstoque(params);
  }
}
```

### 2. Processador de Alertas

```typescript
class StockAlertProcessor {
  private alertRules: AlertRule[] = [
    {
      name: 'estoque_critico',
      condition: (product: StockProduct) => 
        product.nSaldoDisponivel < product.nEstoqueMinimo * 0.8,
      priority: 'CRITICAL',
      channels: ['dashboard', 'email', 'push', 'sms'],
      template: '🚨 ESTOQUE CRÍTICO: {productCode} - {productName}. Disponível: {available}, Mínimo: {minimum}'
    },
    {
      name: 'estoque_alerta',
      condition: (product: StockProduct) => 
        product.nSaldoDisponivel < product.nEstoqueMinimo * 1.0,
      priority: 'HIGH',
      channels: ['dashboard', 'email', 'push'],
      template: '⚠️ ALERTA DE ESTOQUE: {productCode} - {productName}. Disponível: {available}, Mínimo: {minimum}'
    },
    {
      name: 'estoque_atencao',
      condition: (product: StockProduct) => 
        product.nSaldoDisponivel < product.nEstoqueMinimo * 1.2,
      priority: 'MEDIUM',
      channels: ['dashboard', 'email'],
      template: '📢 ATENÇÃO: {productCode} - {productName}. Disponível: {available}, Mínimo: {minimum}'
    },
    {
      name: 'consumo_anormal',
      condition: (product: StockProduct, history: StockHistory[]) => {
        const avgDailyConsumption = this.calculateAverageConsumption(history);
        const currentConsumption = this.calculateCurrentConsumption(product, history);
        return currentConsumption > avgDailyConsumption * 1.5;
      },
      priority: 'HIGH',
      channels: ['dashboard', 'email'],
      template: '📈 CONSUMO ANORMAL: {productCode} - {productName}. Consumo atual: {current}, Média: {average}'
    },
    {
      name: 'validade_proxima',
      condition: (product: StockProduct) => {
        if (!product.data_validade) return false;
        const daysToExpire = this.getDaysToExpire(product.data_validade);
        return daysToExpire <= 7; // 7 dias ou menos
      },
      priority: 'MEDIUM',
      channels: ['dashboard', 'email'],
      template: '📅 VALIDADE PRÓXIMA: {productCode} - {productName}. Expira em {days} dias'
    }
  ];
  
  async process(changes: StockChange[]): Promise<void> {
    for (const change of changes) {
      // Verificar todas as regras de alerta
      const triggeredAlerts = this.checkAlertRules(change);
      
      if (triggeredAlerts.length > 0) {
        // Processar cada alerta
        for (const alert of triggeredAlerts) {
          await this.processAlert(alert, change);
        }
      }
    }
  }
  
  private checkAlertRules(change: StockChange): Alert[] {
    const alerts: Alert[] = [];
    
    for (const rule of this.alertRules) {
      if (rule.condition(change.product, change.history)) {
        alerts.push({
          rule: rule.name,
          priority: rule.priority,
          product: change.product,
          timestamp: new Date(),
          message: this.generateAlertMessage(rule.template, change.product)
        });
      }
    }
    
    return alerts;
  }
}
```

### 3. Sistema de Notificações

```typescript
class StockNotificationSystem {
  private notificationChannels = {
    dashboard: new DashboardChannel(),
    email: new EmailChannel(),
    push: new PushNotificationChannel(),
    sms: new SMSChannel()
  };
  
  async sendAlert(alert: Alert): Promise<void> {
    const channels = this.getChannelsForPriority(alert.priority);
    
    // Enviar para todos os canais configurados
    for (const channelName of channels) {
      const channel = this.notificationChannels[channelName];
      if (channel) {
        try {
          await channel.send(alert);
          console.log(`✅ Notificação enviada via ${channelName}: ${alert.message}`);
        } catch (error) {
          console.error(`❌ Erro ao enviar notificação via ${channelName}:`, error);
        }
      }
    }
    
    // Registrar no histórico de alertas
    await this.logAlert(alert);
  }
  
  private getChannelsForPriority(priority: AlertPriority): NotificationChannel[] {
    switch (priority) {
      case 'CRITICAL':
        return ['dashboard', 'email', 'push', 'sms'];
      case 'HIGH':
        return ['dashboard', 'email', 'push'];
      case 'MEDIUM':
        return ['dashboard', 'email'];
      case 'LOW':
        return ['dashboard'];
      default:
        return ['dashboard'];
    }
  }
}
```

### 4. Dashboard em Tempo Real

```typescript
class StockDashboardService {
  private activeAlerts: Map<string, Alert> = new Map();
  private stockHistory: StockHistory[] = [];
  private websocketConnections: Set<WebSocket> = new Set();
  
  async updateDashboard(alert: Alert): Promise<void> {
    // Adicionar alerta ativo
    this.activeAlerts.set(alert.product.nCodProd, alert);
    
    // Notificar todos os clientes conectados via WebSocket
    this.broadcastAlert(alert);
    
    // Atualizar interface do dashboard
    await this.updateUI(alert);
    
    // Registrar no histórico do dashboard
    await this.logDashboardEvent(alert);
  }
  
  private broadcastAlert(alert: Alert): void {
    const message = JSON.stringify({
      type: 'stock_alert',
      data: alert,
      timestamp: new Date().toISOString()
    });
    
    for (const ws of this.websocketConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }
  
  async getDashboardData(): Promise<DashboardData> {
    return {
      activeAlerts: Array.from(this.activeAlerts.values()),
      stockSummary: await this.getStockSummary(),
      criticalProducts: await this.getCriticalProducts(),
      consumptionTrends: await this.getConsumptionTrends(),
      lastUpdate: this.lastCollectionTime
    };
  }
}
```

## 📊 REGRAS DE NEGÓCIO

### 1. **Cálculo de Estoque Mínimo Dinâmico**

```typescript
class DynamicStockMinimumCalculator {
  async calculateMinimumStock(productCode: string): Promise<number> {
    // 1. Obter histórico de vendas (últimos 30 dias)
    const salesHistory = await this.getSalesHistory(productCode, 30);
    
    // 2. Calcular consumo médio diário
    const avgDailyConsumption = this.calculateAverageConsumption(salesHistory);
    
    // 3. Considerar lead time de produção
    const productionLeadTime = await this.getProductionLeadTime(productCode);
    
    // 4. Adicionar margem de segurança (20%)
    const safetyMargin = 1.2;
    
    // 5. Calcular estoque mínimo
    const minimumStock = avgDailyConsumption * productionLeadTime * safetyMargin;
    
    return Math.max(minimumStock, 10); // Mínimo de 10 unidades
  }
}
```

### 2. **Detecção de Consumo Anormal**

```typescript
class AbnormalConsumptionDetector {
  async detectAbnormalConsumption(product: StockProduct): Promise<boolean> {
    // 1. Obter histórico dos últimos 7 dias
    const history = await this.getStockHistory(product.nCodProd, 7);
    
    if (history.length < 3) return false; // Dados insuficientes
    
    // 2. Calcular consumo médio
    const avgConsumption = this.calculateAverageConsumption(history);
    
    // 3. Calcular desvio padrão
    const stdDev = this.calculateStandardDeviation(history, avgConsumption);
    
    // 4. Verificar se consumo atual está fora de 2 desvios padrão
    const currentConsumption = this.calculateCurrentConsumption(product, history);
    const threshold = avgConsumption + (2 * stdDev);
    
    return currentConsumption > threshold;
  }
}
```

### 3. **Previsão de Ruptura de Estoque**

```typescript
class StockOutagePredictor {
  async predictStockOutage(product: StockProduct): Promise<Date | null> {
    // 1. Calcular consumo médio diário
    const avgDailyConsumption = await this.getAverageDailyConsumption(product.nCodProd);
    
    if (avgDailyConsumption <= 0) return null;
    
    // 2. Calcular dias até ruptura
    const daysToOutage = product.nSaldoDisponivel / avgDailyConsumption;
    
    // 3. Considerar lead time de reposição
    const replenishmentLeadTime = await this.getReplenishmentLeadTime(product.nCodProd);
    
    // 4. Verificar se ruptura ocorrerá antes da reposição
    if (daysToOutage <= replenishmentLeadTime) {
      const outageDate = new Date();
      outageDate.setDate(outageDate.getDate() + Math.floor(daysToOutage));
      return outageDate;
    }
    
    return null;
  }
}
```

## 🚨 SISTEMA DE ALERTAS INTELIGENTE

### Tipos de Alertas:

```typescript
interface StockAlert {
  id: string;
  type: AlertType;
  product: StockProduct;
  priority: AlertPriority;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolutionTime?: Date;
  assignedTo?: string;
}

type AlertType = 
  | 'STOCK_CRITICAL'      // Estoque abaixo do mínimo
  | 'CONSUMPTION_ABNORMAL' // Consumo acima do normal
  | 'EXPIRY_WARNING'      // Produto próximo do vencimento
  | 'QUALITY_ISSUE'       // Problema de qualidade detectado
  | 'SUPPLY_CHAIN_DELAY'  // Atraso na cadeia de suprimentos

type AlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
```

### Fluxo de Resolução de Alertas:

```
Alerta Gerado
    ↓
Notificação Enviada
    ↓
Atribuição Automática
    ↓
Acompanhamento em Tempo Real
    ↓
Resolução Manual/Automática
    ↓
Registro no Histórico
    ↓
Análise de Causa Raiz
```

## 📈 MÉTRICAS E RELATÓRIOS

### Métricas Principais:

1. **Disponibilidade de Estoque**
   - % de produtos com estoque acima do mínimo
   - Tempo médio de ruptura de estoque
   - Custo de ruptura de estoque

2. **Eficiência de Monitoramento**
   - Tempo de detecção de estoque crítico
   - Taxa de falsos positivos/negativos
   - Tempo médio de resolução de alertas

3. **Performance do Sistema**
   - Latência de atualização de dados
   - Taxa de sucesso das chamadas à API
   - Utilização de cache

### Relatórios Automáticos:

```typescript
interface StockReport {
  daily: {
    criticalAlerts: Alert[];
    stockMovements: StockMovement[];
    consumptionAnalysis: ConsumptionAnalysis;
  };
  
  weekly: {
    stockTurnover: number;
    carryingCost: number;
    serviceLevel: number;
  };
  
  monthly: {
    forecastAccuracy: number;
    stockoutCost: number;
    improvementRecommendations: string[];
  };
}
```

## 🔧 CONFIGURAÇÃO DO SISTEMA

### Variáveis de Ambiente:

```env
# Frequência de polling
STOCK_POLLING_INTERVAL=120000  # 2 minutos em ms

# Limites de alerta
STOCK_CRITICAL_THRESHOLD=0.8    # 80% do estoque mínimo
STOCK_ALERT_THRESHOLD=1.0       # 100% do estoque mínimo  
STOCK_WARNING_THRESHOLD=1.2     # 120% do estoque mínimo

# Configuração de notificações
ALERT_EMAIL_RECIPIENTS=production@empresa.com,manager@empresa.com
ALERT_SMS_NUMBERS=+5511999999999
PUSH_NOTIFICATION_ENABLED=true

# Configuração de cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=300000  # 5 minutos
```

### Configuração de Produtos Críticos:

```typescript
const CRITICAL_PRODUCTS = [
  {
    code: 'PROD-001',
    name: 'Produto A',
    minimumStock: 50,
    alertThreshold: 60,  // Alerta quando chegar a 60
    criticalThreshold: 40 // Crítico quando chegar a 40
  },
  {
    code: 'PROD-002', 
    name: 'Produto B',
    minimumStock: 100,
    alertThreshold: 120,
    criticalThreshold: 80
  }
];
```

## 🚀 PLANO DE IMPLEMENTAÇÃO

### FASE 1 (Dias 1-2): Coleta Básica
- [ ] Implementar polling básico do Omie
- [ ] Configurar cache Redis
- [ ] Criar tabelas de histórico no banco de dados

### FASE 2 (Dias 3-4): Sistema de Alertas
- [ ] Implementar regras de alerta básicas
- [ ] Configurar notificações por email
- [ ] Criar dashboard mínimo

### FASE 3 (Dias 5-7): Otimização
- [ ] Adicionar cache multi-nível
- [ ] Implementar detecção de consumo anormal
- [ ] Adicionar notificações push/SMS

### FASE 4 (Dias 8-10): Avançado
- [ ] Implementar previsão de ruptura
- [ ] Adicionar análise de causa raiz
- [ ] Criar relatórios automáticos

## ⚠️ PLANOS DE CONTINGÊNCIA

### 1. **Falha na API Omie**
```typescript
class OmieAPIFallback {
  async handleAPIFailure(error: Error): Promise<void> {
    // 1. Usar dados cacheados
    const cachedData = await this.getCachedStockData();
    
    // 2. Marcar dados como "potencialmente desatualizados"
    await this.markDataAsStale();
    
    // 3. Notificar administradores
    await this.notifyAdmins(`API Omie indisponível: ${error.message}`);
    
    // 4. Tentar reconexão periódica
    this.scheduleReconnectionAttempt();
  }
}
```

### 2. **Alta Carga do Sistema**
```typescript
class LoadBalancer {
  async handleHighLoad(): Promise<void> {
    // 1. Reduzir frequência de polling
    this.increasePollingInterval();
    
    // 2. Priorizar produtos críticos
    await this.prioritizeCriticalProducts();
    
    // 3. Limpar cache de dados não críticos
    await this.clearNonCriticalCache();
    
    // 4. Notificar sobre degradação de serviço
    await this.notifyServiceDegradation();
  }
}
```

---

**PRÓXIMOS PASSOS IMEDIATOS:**
1. Configurar ambiente com Redis
2. Implementar polling básico do endpoint `ListarPosEstoque`
3. Criar sistema de alertas para estoque crítico
4. Desenvolver dashboard mínimo com status em tempo real

**OBJETIVO:** Ter o sistema básico de monitoramento de estoque funcionando em **48 horas** com alertas automáticos para produtos críticos.