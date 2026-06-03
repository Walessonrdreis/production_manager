# Especificação Técnica: Sistema de Fila para Produção

## Visão Arquitetural

### Componentes Principais
```
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Fastify)                      │
├─────────────────────────────────────────────────────────────┤
│  POST /queue/add    │ GET /queue    │ POST /queue/process   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                Application Layer (Use Cases)                │
├─────────────────────────────────────────────────────────────┤
│  AddToQueueUseCase  │ ProcessQueueUseCase │ QueueStatsUseCase│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Domain Layer (Entities)                     │
├─────────────────────────────────────────────────────────────┤
│  ProductionQueue │ ProductionOrder │ QueuePriorityStrategy │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│              Infrastructure Layer (Repositories)            │
├─────────────────────────────────────────────────────────────┤
│  QueueRepository │ OmieGateway │ NotificationService       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                         │
├─────────────────────────────────────────────────────────────┤
│     PostgreSQL     │     Redis     │     Omie API          │
└─────────────────────────────────────────────────────────────┘
```

## Modelo de Dados Detalhado

### 1. Tabela Principal: `production_queue`
```sql
CREATE TABLE production_queue (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(100), -- ID do sistema externo (opcional)
  
  -- Referências
  omie_order_code VARCHAR(50) NOT NULL,
  omie_product_code VARCHAR(50) NOT NULL,
  sales_order_id UUID REFERENCES omie_sales_orders(id),
  
  -- Dados da Ordem
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_of_measure VARCHAR(20) DEFAULT 'UN',
  
  -- Prioridade e Agendamento
  priority_level INTEGER NOT NULL DEFAULT 5 CHECK (priority_level BETWEEN 1 AND 10),
  priority_reason VARCHAR(100), -- 'URGENT_CLIENT', 'LOW_STOCK', etc
  scheduled_start_date DATE,
  scheduled_end_date DATE,
  estimated_duration_minutes INTEGER,
  
  -- Status e Progresso
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
    CHECK (status IN ('PENDING', 'PROCESSING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED')),
  current_stage VARCHAR(50), -- 'CUTTING', 'ASSEMBLY', 'PAINTING', 'PACKING'
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  
  -- Datas de Controle
  added_to_queue_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processing_started_at TIMESTAMP,
  last_updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Controle de Erros
  error_count INTEGER DEFAULT 0,
  last_error_message TEXT,
  last_error_at TIMESTAMP,
  
  -- Metadados
  assigned_to_operator_id UUID,
  workstation_id VARCHAR(50),
  batch_number VARCHAR(50),
  notes TEXT,
  
  -- Indexes
  INDEX idx_production_queue_status (status),
  INDEX idx_production_queue_priority (priority_level, added_to_queue_at),
  INDEX idx_production_queue_dates (scheduled_start_date, scheduled_end_date),
  INDEX idx_production_queue_omie_code (omie_order_code)
);
```

### 2. Tabela: `queue_processing_log`
```sql
CREATE TABLE queue_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_item_id UUID NOT NULL REFERENCES production_queue(id),
  
  event_type VARCHAR(50) NOT NULL 
    CHECK (event_type IN ('ADDED', 'STARTED', 'PROGRESS', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED')),
  
  from_status VARCHAR(20),
  to_status VARCHAR(20),
  
  details JSONB, -- Detalhes específicos do evento
  performed_by VARCHAR(100), -- 'SYSTEM', 'OPERATOR:123', 'API:client-x'
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_queue_log_item (queue_item_id),
  INDEX idx_queue_log_created (created_at)
);
```

### 3. Tabela: `production_resources`
```sql
CREATE TABLE production_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(50) NOT NULL 
    CHECK (resource_type IN ('WORKSTATION', 'EQUIPMENT', 'OPERATOR', 'TOOL')),
  
  resource_code VARCHAR(50) NOT NULL UNIQUE,
  resource_name VARCHAR(200) NOT NULL,
  
  -- Capacidade
  capacity_per_hour INTEGER,
  available_from TIME DEFAULT '08:00',
  available_to TIME DEFAULT '18:00',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  current_status VARCHAR(20) DEFAULT 'AVAILABLE'
    CHECK (current_status IN ('AVAILABLE', 'BUSY', 'MAINTENANCE', 'UNAVAILABLE')),
  
  -- Localização
  sector_id UUID REFERENCES sectors(id),
  location_code VARCHAR(50),
  
  -- Metadados
  specifications JSONB,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  
  INDEX idx_resources_type (resource_type),
  INDEX idx_resources_sector (sector_id)
);
```

## Estratégia de Prioridades

### Níveis de Prioridade (1-10)
```
1: CRITICAL    - Parada de linha, cliente VIP, multa contratual
2: URGENT      - Entrega hoje, estoque zerado
3: HIGH        - Cliente importante, atraso significativo
4: ELEVATED    - Prazo curto, cliente recorrente
5: NORMAL      - Pedido padrão, prazo normal
6: LOW         - Pedido pequeno, cliente novo
7: PLANNED     - Produção planejada, estoque futuro
8: MAINTENANCE - Produção para manutenção
9: TEST        - Produção para testes
10: BACKGROUND - Produção em segundo plano
```

### Algoritmo de Ordenação
```typescript
interface QueueItem {
  priorityLevel: number;          // 1-10
  addedToQueueAt: Date;          // Data de entrada
  scheduledStartDate?: Date;     // Data agendada
  clientPriority: number;        // Prioridade do cliente (1-5)
  estimatedDuration: number;     // Minutos estimados
  isUrgent: boolean;            // Flag de urgência
}

class QueuePriorityStrategy {
  calculateScore(item: QueueItem): number {
    const baseScore = (11 - item.priorityLevel) * 1000; // Inverte: prioridade 1 = 10000, 10 = 1000
    
    // Penalidade por atraso (se já passou da data agendada)
    const delayPenalty = this.calculateDelayPenalty(item);
    
    // Bônus por cliente prioritário
    const clientBonus = item.clientPriority * 50;
    
    // Penalidade por longa duração (favorece itens curtos)
    const durationPenalty = Math.min(item.estimatedDuration / 10, 100);
    
    // Bônus de urgência
    const urgencyBonus = item.isUrgent ? 500 : 0;
    
    // Penalidade por tempo na fila (evita starvation)
    const queueTime = Date.now() - item.addedToQueueAt.getTime();
    const queueTimePenalty = Math.min(queueTime / (1000 * 60 * 60), 200); // Máximo 200 pontos
    
    return baseScore - delayPenalty + clientBonus - durationPenalty + urgencyBonus - queueTimePenalty;
  }
  
  private calculateDelayPenalty(item: QueueItem): number {
    if (!item.scheduledStartDate) return 0;
    
    const now = new Date();
    const scheduled = new Date(item.scheduledStartDate);
    
    if (now > scheduled) {
      const hoursLate = (now.getTime() - scheduled.getTime()) / (1000 * 60 * 60);
      return Math.min(hoursLate * 10, 300); // Máximo 300 pontos de penalidade
    }
    
    return 0;
  }
}
```

## Sistema de Processamento em Fila

### 1. Worker Principal
```typescript
class ProductionQueueWorker {
  private isProcessing = false;
  private currentBatch: QueueItem[] = [];
  private readonly BATCH_SIZE = 5;
  private readonly PROCESSING_INTERVAL = 30000; // 30 segundos
  
  async start() {
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.processNextBatch();
      }
    }, this.PROCESSING_INTERVAL);
  }
  
  private async processNextBatch() {
    try {
      this.isProcessing = true;
      
      // 1. Buscar próximos itens da fila
      this.currentBatch = await this.queueRepository.getNextItems(this.BATCH_SIZE);
      
      if (this.currentBatch.length === 0) {
        this.isProcessing = false;
        return;
      }
      
      // 2. Processar em paralelo com limite de concorrência
      await Promise.allSettled(
        this.currentBatch.map(item => this.processItem(item))
      );
      
      // 3. Atualizar status e notificar
      await this.updateBatchStatus();
      await this.sendNotifications();
      
    } catch (error) {
      this.logger.error('Error processing batch', { error });
    } finally {
      this.isProcessing = false;
      this.currentBatch = [];
    }
  }
  
  private async processItem(item: QueueItem) {
    try {
      // 1. Atualizar status para PROCESSING
      await this.queueRepository.updateStatus(item.id, 'PROCESSING', {
        processingStartedAt: new Date()
      });
      
      // 2. Executar produção (integração com Omie)
      const result = await this.omieGateway.executeProductionOrder(
        item.omieOrderCode,
        item.quantity
      );
      
      // 3. Atualizar status para COMPLETED
      await this.queueRepository.updateStatus(item.id, 'COMPLETED', {
        completedAt: new Date(),
        progressPercentage: 100
      });
      
      // 4. Registrar log
      await this.logRepository.create({
        queueItemId: item.id,
        eventType: 'COMPLETED',
        details: { result }
      });
      
    } catch (error) {
      // 5. Em caso de erro, incrementar contador e possivelmente reagendar
      await this.handleProcessingError(item, error);
    }
  }
}
```

### 2. Sistema de Retry com Backoff Exponencial
```typescript
class QueueRetryManager {
  private readonly MAX_RETRIES = 3;
  private readonly BACKOFF_MULTIPLIER = 2;
  private readonly INITIAL_DELAY = 60000; // 1 minuto
  
  async scheduleRetry(itemId: string, error: Error) {
    const item = await this.queueRepository.findById(itemId);
    
    if (!item || item.errorCount >= this.MAX_RETRIES) {
      await this.markAsFailed(itemId, error);
      return;
    }
    
    // Calcula delay exponencial
    const delay = this.INITIAL_DELAY * Math.pow(this.BACKOFF_MULTIPLIER, item.errorCount);
    
    // Agenda retry
    await this.retryQueue.add(
      `retry:${itemId}:${item.errorCount + 1}`,
      { itemId },
      { delay }
    );
    
    // Incrementa contador de erros
    await this.queueRepository.incrementErrorCount(itemId, error.message);
  }
  
  private async markAsFailed(itemId: string, error: Error) {
    await this.queueRepository.updateStatus(itemId, 'FAILED', {
      lastErrorMessage: error.message,
      lastErrorAt: new Date()
    });
    
    // Notificar administrador
    await this.notificationService.sendAlert({
      type: 'QUEUE_ITEM_FAILED',
      itemId,
      error: error.message,
      retryCount: this.MAX_RETRIES
    });
  }
}
```

## Endpoints da API

### 1. Gestão da Fila
```typescript
// POST /v1/production/queue/add
interface AddToQueueRequest {
  omieOrderCode: string;
  quantity: number;
  priorityLevel?: number; // 1-10
  scheduledStartDate?: string; // ISO date
  notes?: string;
}

// GET /v1/production/queue
interface GetQueueResponse {
  items: Array<{
    id: string;
    omieOrderCode: string;
    productName: string;
    quantity: number;
    priorityLevel: number;
    status: string;
    progressPercentage: number;
    estimatedCompletion?: string;
    addedToQueueAt: string;
  }>;
  stats: {
    total: number;
    pending: number;
    processing: number;
    completedToday: number;
    averageProcessingTime: number; // minutos
  };
}

// POST /v1/production/queue/process-next
interface ProcessNextResponse {
  processedItem: {
    id: string;
    omieOrderCode: string;
    status: string;
    startedAt: string;
  };
  nextInQueue?: {
    id: string;
    omieOrderCode: string;
    priorityLevel: number;
  };
}

// PUT /v1/production/queue/:id/priority
interface UpdatePriorityRequest {
  priorityLevel: number;
  priorityReason?: string;
}

// POST /v1/production/queue/batch-add
interface BatchAddRequest {
  items: Array<{
    omieOrderCode: string;
    quantity: number;
    priorityLevel?: number;
  }>;
}
```

### 2. Controle de Produção
```typescript
// POST /v1/production/orders/:id/start
interface StartProductionRequest {
  operatorId?: string;
  workstationId?: string;
}

// PUT /v1/production/orders/:id/progress
interface UpdateProgressRequest {
  progressPercentage: number;
  currentStage?: string;
  notes?: string;
}

// POST /v1/production/orders/:id/pause
interface PauseProductionRequest {
  reason: string;
  estimatedResume?: string; // ISO date
}

// POST /v1/production/orders/:id/complete
interface CompleteProductionRequest {
  actualQuantity?: number;
  qualityCheck?: boolean;
  notes?: string;
}
```

### 3. Monitoramento e Estatísticas
```typescript
// GET /v1/production/queue/stats
interface QueueStatsResponse {
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  bySector: Record<string, number>;
  processingTimes: {
    average: number;
    min: number;
    max: number;
    percentile95: number;
  };
  throughput: {
    today: number;
    last7Days: number;
    averageDaily: number;
  };
}

// GET /v1/production/queue/forecast
interface QueueForecastResponse {
  estimatedCompletion: {
    byPriority: Record<string, string>; // ISO date
    overall: string;
  };
  capacityUtilization: {
    current: number; // porcentagem
    projected: number;
  };
  bottlenecks: Array<{
    resource: string;
    waitTime: number; // minutos
    queueLength: number;
  }>;
}
```

## Integração com Sistemas Existentes

### 1. Integração com Omie
```typescript
class OmieProductionIntegration {
  async syncProductionStatus(queueItem: QueueItem) {
    // 1. Buscar status atual no Omie
    const omieStatus = await this.omieClient.getProductionOrderStatus(
      queueItem.omieOrderCode
    );
    
    // 2. Sincronizar se necessário
    if (omieStatus !== queueItem.status) {
      await this.queueRepository.updateFromOmie(
        queueItem.id,
        omieStatus,
        omieStatus === 'COMPLETED' ? new Date() : undefined
      );
    }
    
    // 3. Atualizar estoque quando concluído
    if (omieStatus === 'COMPLETED' && queueItem.status !== 'COMPLETED') {
      await this.updateInventory(queueItem);
    }
  }
  
  private async updateInventory(queueItem: QueueItem) {
    // Diminuir estoque de matéria-prima
    await this.inventoryService.decreaseStock(
      queueItem.productCode,
      queueItem.quantity,
      'PRODUCTION_CONSUMPTION',
      { queueItemId: queueItem.id }
    );
    
    // Aumentar estoque de produto acabado
    await this.inventoryService.increaseStock(
      queueItem.productCode,
      queueItem.quantity,
      'PRODUCTION_OUTPUT',
      { queueItemId: queueItem.id }
    );
  }
}
```

### 2. Integração com Pedidos de Venda
```typescript
class SalesToProductionIntegration {
  async generateProductionFromSales(salesOrderId: string) {
    // 1. Buscar pedido de venda
    const salesOrder = await this.salesRepository.findById(salesOrderId);
    
    // 2. Extrair itens para produção
    const productionItems = this.extractProductionItems(salesOrder);
    
    // 3. Calcular prioridade baseada no pedido
    const priority = this.calculatePriorityFromSalesOrder(salesOrder);
    
    // 4. Adicionar à fila de produção
    for (const item of productionItems) {
      await this.queueService.addToQueue({
        omieOrderCode: this.generateProductionOrderCode(salesOrder, item),
        salesOrderId: salesOrder.id,
        productCode: item.productCode,
        quantity: item.quantity,
        priorityLevel: priority,
        scheduledStartDate: this.calculateStartDate(salesOrder.deliveryDate),
        notes: `Gerado do pedido de venda: ${salesOrder.orderNumber}`
      });
    }
    
    // 5. Atualizar status do pedido de venda
    await this.salesRepository.markAsScheduledForProduction(salesOrderId);
  }
}
```

## Configuração e Deployment

### 1. Variáveis de Ambiente
```env
# Fila de Produção
PRODUCTION_QUEUE_BATCH_SIZE=5
PRODUCTION_QUEUE_PROCESSING_INTERVAL=30000
PRODUCTION_QUEUE_MAX_RETRIES=3
PRODUCTION_QUEUE_RETRY_INITIAL_DELAY=60000

# Prioridades
PRODUCTION_PRIORITY_URGENT_THRESHOLD=3
PRODUCTION_PRIORITY_CLIENT_WEIGHT=50
PRODUCTION_PRIORITY_DELAY_PENALTY_PER_HOUR=10

# Integração
OMIE_PRODUCTION_SYNC_ENABLED=true
OMIE_PRODUCTION_SYNC_INTERVAL=300000  # 5 minutos

# Notificações
PRODUCTION_NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/...
PRODUCTION_ALERT_EMAIL=production-alerts@company.com
```

### 2. Script de Inicialização
```typescript
// apps/api/src/modules/production-queue/bootstrap.ts
export async function bootstrapProductionQueue() {
  // 1. Inicializar repositórios
  const queueRepo = new ProductionQueueRepository(prisma);
  const logRepo = new QueueProcessingLogRepository(prisma);
  
  // 2. Inicializar serviços
  const omieGateway = new OmieProductionGateway();
  const notificationService = new ProductionNotificationService();
  
  // 3. Inicializar worker
  const worker = new ProductionQueueWorker({
    queueRepository: queueRepo,
    logRepository: logRepo,
    omieGateway,
    notificationService,
    batchSize: env.PRODUCTION_QUEUE_BATCH_SIZE,
    processingInterval: env.PRODUCTION_QUEUE_PROCESSING_INTERVAL
  });
  
  // 4. Iniciar worker
  await worker.start();
  
  // 5. Inicializar sincronização com Omie
  if (env.OMIE_PRODUCTION_SYNC_ENABLED) {
    const syncService = new OmieProductionSyncService({
      queueRepository: queueRepo,
      omieGateway,
      interval: env.OMIE_PRODUCTION_SYNC_INTERVAL
    });
    
    await syncService.start();
  }
  
  return {
    worker,
    queueRepo,
    logRepo
  };
}
```

## Próximos Passos de Implementação

### Semana 1
1. [ ] Criar migration para tabelas `production_queue`, `queue_processing_log`, `production_resources`
2. [ ] Implementar repositórios básicos (CRUD)
3. [ ] Criar entidades de domínio `ProductionQueueItem`, `QueuePriority`

### Semana 2
1. [ ] Implementar `AddToQueueUseCase` com validações
2. [ ] Implementar `ProcessQueueUseCase` com lógica de prioridade
3. [ ] Criar endpoints básicos da API

### Semana 3
1. [ ] Implementar worker de processamento em batch
2. [ ] Adicionar sistema de retry com backoff exponencial
3. [ ] Criar integração com Omie para sincronização de status

### Semana 4
1. [ ] Implementar dashboard de monitoramento
2. [ ] Adicionar notificações (email, webhook)
3. [ ] Escrever testes unitários e de integração

## Considerações de Performance

### 1. Indexação
```sql
-- Indexes para queries frequentes
CREATE INDEX idx_queue_status_priority ON production_queue(status, priority_level);
CREATE INDEX idx_queue_dates ON production_queue(scheduled_start_date, scheduled_end_date);
CREATE INDEX idx_queue_processing ON production_queue(processing_started_at) WHERE status = 'PROCESSING';

-- Index para busca por código Omie
CREATE INDEX idx_queue_omie_code ON production_queue(omie_order_code);
```

### 2. Cache Strategy
```typescript
class QueueCacheManager {
  private readonly CACHE_TTL = 30000; // 30 segundos
  private readonly CACHE_KEY_PREFIX = 'queue:';
  
  async getQueueStats(): Promise<QueueStats> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}stats`;
    
    // Tentar cache primeiro
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    // Calcular se não estiver em cache
    const stats = await this.calculateStats();
    
    // Armazenar em cache
    await this.redis.setex(cacheKey, this.CACHE_TTL / 1000, JSON.stringify(stats));
    
    return stats;
  }
  
  async invalidateCache(queueItemId?: string) {
    if (queueItemId) {
      await this.redis.del(`${this.CACHE_KEY_PREFIX}item:${queueItemId}`);
    }
    
    // Invalidar cache de stats
    await this.redis.del(`${this.CACHE_KEY_PREFIX}stats`);
  }
}
```

### 3. Limites de Concorrência
```typescript
class ConcurrencyLimiter {
  private readonly MAX_CONCURRENT_PROCESSING = 10;
  private activeCount = 0;
  
  async acquire(): Promise<boolean> {
    if (this.activeCount >= this.MAX_CONCURRENT_PROCESSING) {
      return false;
    }
    
    this.activeCount++;
    return true;
  }
  
  release() {
    this.activeCount = Math.max(0, this.activeCount - 1);
  }
  
  getAvailableSlots(): number {
    return this.MAX_CONCURRENT_PROCESSING - this.activeCount;
  }
}
```

---

*Esta especificação técnica serve como guia para implementação do sistema de fila de produção. As decisões técnicas podem ser ajustadas durante a implementação com base em testes de performance e feedback.*