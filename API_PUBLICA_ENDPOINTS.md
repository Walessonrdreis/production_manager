# Especificação: API Pública para Consumo Externo

## Visão Geral
API simplificada e objetiva para consumo por sistemas externos (ERP, MES, dashboards, aplicativos móveis). Foco em endpoints específicos para necessidades do chão de fábrica.

## Autenticação

### API Key
```
Header: X-API-Key: sk_live_1234567890abcdef
```

### Modelo de Cliente API
```sql
CREATE TABLE api_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(200) NOT NULL,
  api_key VARCHAR(64) NOT NULL UNIQUE,
  secret_key VARCHAR(64) NOT NULL, -- Para webhook signing
  is_active BOOLEAN DEFAULT true,
  
  -- Permissões
  permissions JSONB DEFAULT '[]', -- ["production:read", "production:write", "quality:read"]
  
  -- Rate Limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Webhooks
  webhook_url VARCHAR(500),
  webhook_secret VARCHAR(64),
  
  -- Metadados
  contact_email VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_api_clients_key (api_key),
  INDEX idx_api_clients_active (is_active)
);
```

## Endpoints Públicos

### 1. Status da Produção

#### GET `/v1/public/production/status`
**Descrição**: Status geral da produção em tempo real

**Resposta**:
```json
{
  "timestamp": "2024-01-15T14:30:00Z",
  "overallStatus": "NORMAL", // NORMAL, WARNING, CRITICAL
  "metrics": {
    "queueLength": 15,
    "processingNow": 3,
    "completedToday": 42,
    "averageCycleTime": 45.5, // minutos
    "oee": 85.3 // porcentagem
  },
  "alerts": [
    {
      "id": "alert-001",
      "type": "EQUIPMENT_DOWNTIME",
      "severity": "WARNING",
      "message": "Cortadora CNC em manutenção",
      "since": "2024-01-15T13:45:00Z"
    }
  ],
  "nextOrders": [
    {
      "id": "queue-123",
      "productCode": "PROD-001",
      "productName": "Mesa de Madeira",
      "quantity": 10,
      "priority": "HIGH",
      "estimatedStart": "2024-01-15T15:00:00Z"
    }
  ]
}
```

#### GET `/v1/public/production/status/summary`
**Descrição**: Resumo rápido para dashboards

**Resposta**:
```json
{
  "queue": {
    "pending": 12,
    "processing": 3,
    "completedToday": 42
  },
  "performance": {
    "oee": 85.3,
    "availability": 92.1,
    "performance": 92.8,
    "quality": 98.5
  },
  "throughput": {
    "lastHour": 5,
    "last24Hours": 42,
    "trend": "UP" // UP, DOWN, STABLE
  }
}
```

### 2. Fila de Produção

#### GET `/v1/public/production/queue`
**Descrição**: Lista itens na fila de produção

**Parâmetros**:
- `status` (opcional): Filter por status (PENDING, PROCESSING)
- `limit` (opcional): Número máximo de itens (default: 20)
- `offset` (opcional): Paginação

**Resposta**:
```json
{
  "items": [
    {
      "id": "queue-001",
      "orderCode": "PO-2024-001",
      "productCode": "PROD-001",
      "productName": "Mesa de Madeira",
      "quantity": 10,
      "status": "PROCESSING",
      "priority": "HIGH",
      "progress": 65,
      "currentStage": "ASSEMBLY",
      "estimatedCompletion": "2024-01-15T16:30:00Z",
      "startedAt": "2024-01-15T14:00:00Z"
    }
  ],
  "total": 15,
  "hasMore": false
}
```

#### GET `/v1/public/production/queue/next`
**Descrição**: Próximas ordens a serem processadas

**Parâmetros**:
- `count` (opcional): Número de ordens (default: 5, max: 20)

**Resposta**:
```json
{
  "items": [
    {
      "id": "queue-002",
      "orderCode": "PO-2024-002",
      "productCode": "PROD-002",
      "productName": "Cadeira de Escritório",
      "quantity": 5,
      "priority": "URGENT",
      "estimatedStart": "2024-01-15T16:30:00Z",
      "estimatedDuration": 120, // minutos
      "requiredMaterials": [
        {
          "code": "MAT-001",
          "name": "Madeira Carvalho",
          "quantity": 25,
          "unit": "m²"
        }
      ]
    }
  ]
}
```

### 3. Ordens Específicas

#### GET `/v1/public/production/orders/:id`
**Descrição**: Detalhes de uma ordem específica

**Resposta**:
```json
{
  "id": "queue-001",
  "omieOrderCode": "PO-2024-001",
  "salesOrderReference": "SO-2024-050",
  "product": {
    "code": "PROD-001",
    "name": "Mesa de Madeira",
    "description": "Mesa de jantar 6 lugares"
  },
  "quantity": 10,
  "status": "PROCESSING",
  "priority": "HIGH",
  "timeline": {
    "addedToQueue": "2024-01-15T08:00:00Z",
    "startedProcessing": "2024-01-15T14:00:00Z",
    "estimatedCompletion": "2024-01-15T16:30:00Z"
  },
  "progress": {
    "percentage": 65,
    "currentStage": "ASSEMBLY",
    "nextStage": "PAINTING",
    "stages": [
      {
        "name": "CUTTING",
        "status": "COMPLETED",
        "completedAt": "2024-01-15T10:30:00Z",
        "operator": "OP-001"
      },
      {
        "name": "ASSEMBLY",
        "status": "IN_PROGRESS",
        "startedAt": "2024-01-15T14:00:00Z",
        "operator": "OP-002"
      }
    ]
  },
  "resources": {
    "workstation": "WS-005",
    "operator": "OP-002",
    "tools": ["TOOL-001", "TOOL-002"]
  },
  "qualityChecks": [
    {
      "type": "DIMENSIONAL",
      "status": "PASSED",
      "checkedAt": "2024-01-15T10:45:00Z"
    }
  ]
}
```

#### GET `/v1/public/production/orders/code/:omieCode`
**Descrição**: Busca ordem pelo código Omie

**Resposta**: Mesma estrutura do endpoint anterior

### 4. Controle de Produção (Write Operations)

#### POST `/v1/public/production/orders/:id/start`
**Descrição**: Iniciar processamento de uma ordem (para MES/operadores)

**Autenticação**: API Key com permissão `production:write`

**Request**:
```json
{
  "operatorId": "OP-001",
  "workstationId": "WS-005",
  "notes": "Iniciando produção conforme planejado"
}
```

**Resposta**:
```json
{
  "success": true,
  "orderId": "queue-001",
  "status": "PROCESSING",
  "startedAt": "2024-01-15T14:00:00Z",
  "estimatedCompletion": "2024-01-15T16:30:00Z"
}
```

#### PUT `/v1/public/production/orders/:id/progress`
**Descrição**: Atualizar progresso de uma ordem

**Autenticação**: API Key com permissão `production:write`

**Request**:
```json
{
  "progressPercentage": 75,
  "currentStage": "PAINTING",
  "notes": "Concluída montagem, iniciando pintura",
  "qualityCheck": {
    "passed": true,
    "defects": []
  }
}
```

**Resposta**:
```json
{
  "success": true,
  "updatedFields": ["progressPercentage", "currentStage"],
  "newStatus": "PROCESSING",
  "nextMilestone": "FINAL_INSPECTION"
}
```

#### POST `/v1/public/production/orders/:id/complete`
**Descrição**: Marcar ordem como concluída

**Autenticação**: API Key com permissão `production:write`

**Request**:
```json
{
  "actualQuantity": 10,
  "qualityCheck": {
    "passed": true,
    "inspector": "QC-001",
    "defects": [],
    "notes": "Produto dentro das especificações"
  },
  "notes": "Produção concluída com sucesso"
}
```

**Resposta**:
```json
{
  "success": true,
  "orderId": "queue-001",
  "status": "COMPLETED",
  "completedAt": "2024-01-15T16:25:00Z",
  "productionTime": 145, // minutos
  "inventoryUpdated": true
}
```

#### POST `/v1/public/production/orders/:id/pause`
**Descrição**: Pausar produção de uma ordem

**Autenticação**: API Key com permissão `production:write`

**Request**:
```json
{
  "reason": "AGUARDANDO_MATERIAL",
  "estimatedResume": "2024-01-16T08:00:00Z",
  "notes": "Esperando entrega de madeira"
}
```

**Resposta**:
```json
{
  "success": true,
  "orderId": "queue-001",
  "status": "PAUSED",
  "pausedAt": "2024-01-15T15:30:00Z",
  "reason": "AGUARDANDO_MATERIAL"
}
```

### 5. Alertas e Notificações

#### GET `/v1/public/production/alerts`
**Descrição**: Lista alertas ativos

**Parâmetros**:
- `severity` (opcional): Filter por severidade (INFO, WARNING, CRITICAL)
- `type` (opcional): Filter por tipo (EQUIPMENT, QUALITY, MATERIAL)

**Resposta**:
```json
{
  "alerts": [
    {
      "id": "alert-001",
      "type": "MATERIAL_SHORTAGE",
      "severity": "CRITICAL",
      "title": "Falta de Madeira Carvalho",
      "message": "Estoque crítico: 5m² restantes",
      "affectedResource": "MAT-001",
      "since": "2024-01-15T13:00:00Z",
      "acknowledged": false,
      "actions": [
        {
          "id": "action-001",
          "type": "ORDER_MATERIAL",
          "label": "Solicitar Compra",
          "url": "/api/v1/purchasing/orders"
        }
      ]
    }
  ],
  "summary": {
    "total": 3,
    "bySeverity": {
      "CRITICAL": 1,
      "WARNING": 2,
      "INFO": 0
    }
  }
}
```

#### POST `/v1/public/production/alerts/:id/acknowledge`
**Descrição**: Reconhecer um alerta

**Autenticação**: API Key com permissão `production:write`

**Request**:
```json
{
  "acknowledgedBy": "operator-001",
  "notes": "Material já foi solicitado, entrega prevista para amanhã"
}
```

**Resposta**:
```json
{
  "success": true,
  "alertId": "alert-001",
  "acknowledgedAt": "2024-01-15T14:15:00Z",
  "acknowledgedBy": "operator-001"
}
```

### 6. Recursos e Capacidade

#### GET `/v1/public/production/resources`
**Descrição**: Status dos recursos de produção

**Parâmetros**:
- `type` (opcional): Filter por tipo (WORKSTATION, EQUIPMENT, OPERATOR)

**Resposta**:
```json
{
  "resources": [
    {
      "id": "WS-001",
      "type": "WORKSTATION",
      "name": "Cortadora CNC",
      "status": "AVAILABLE",
      "currentJob": {
        "orderId": "queue-001",
        "product": "Mesa de Madeira",
        "progress": 65
      },
      "utilization": {
        "lastHour": 85,
        "last24Hours": 78
      },
      "nextMaintenance": "2024-01-20T08:00:00Z"
    }
  ],
  "capacity": {
    "availableWorkstations": 8,
    "busyWorkstations": 3,
    "availableOperators": 12,
    "onBreak": 2
  }
}
```

#### GET `/v1/public/production/capacity`
**Descrição**: Capacidade de produção atual

**Resposta**:
```json
{
  "current": {
    "availableCapacity": 85, // porcentagem
    "bottlenecks": [
      {
        "resource": "WS-005",
        "waitTime": 45, // minutos
        "queueLength": 3
      }
    ]
  },
  "forecast": {
    "next8Hours": {
      "expectedOutput": 25,
      "capacityUtilization": 92
    },
    "next24Hours": {
      "expectedOutput": 68,
      "capacityUtilization": 88
    }
  }
}
```

### 7. Qualidade

#### GET `/v1/public/quality/inspections`
**Descrição**: Inspeções de qualidade recentes

**Parâmetros**:
- `orderId` (opcional): Filter por ordem
- `limit` (opcional): Número máximo (default: 20)

**Resposta**:
```json
{
  "inspections": [
    {
      "id": "qc-001",
      "orderId": "queue-001",
      "type": "FINAL_INSPECTION",
      "inspector": "QC-001",
      "result": "PASSED",
      "defects": [],
      "notes": "Produto dentro das especificações",
      "inspectedAt": "2024-01-15T16:20:00Z",
      "metrics": {
        "dimensionalAccuracy": 99.8,
        "surfaceFinish": "EXCELLENT",
        "functionality": "PASS"
      }
    }
  ],
  "stats": {
    "passRate": 98.5,
    "defectsPerMillion": 15000,
    "topDefect": "SCRATCHES"
  }
}
```

#### POST `/v1/public/quality/inspections`
**Descrição**: Registrar nova inspeção

**Autenticação**: API Key com permissão `quality:write`

**Request**:
```json
{
  "orderId": "queue-001",
  "type": "IN_PROCESS",
  "inspector": "QC-002",
  "result": "PASSED",
  "defects": [],
  "metrics": {
    "dimensionalAccuracy": 99.5,
    "weight": 12.3
  },
  "notes": "Peça dentro das tolerâncias"
}
```

**Resposta**:
```json
{
  "success": true,
  "inspectionId": "qc-002",
  "orderStatus": "PROCESSING",
  "nextStep": "CONTINUE_PRODUCTION"
}
```

### 8. Estatísticas e Relatórios

#### GET `/v1/public/production/stats/daily`
**Descrição**: Estatísticas diárias de produção

**Parâmetros**:
- `date` (opcional): Data no formato YYYY-MM-DD (default: hoje)

**Resposta**:
```json
{
  "date": "2024-01-15",
  "summary": {
    "totalOrders": 42,
    "completedOrders": 38,
    "averageCycleTime": 47.3,
    "oee": 85.3
  },
  "byProduct": [
    {
      "productCode": "PROD-001",
      "productName": "Mesa de Madeira",
      "quantity": 120,
      "averageTime": 52.1
    }
  ],
  "byShift": [
    {
      "shift": "MORNING",
      "output": 18,
      "efficiency": 88.2
    }
  ],
  "trends": {
    "weekOverWeek": 5.2, // porcentagem
    "monthOverMonth": 8.7
  }
}
```

#### GET `/v1/public/production/stats/performance`
**Descrição**: Métricas de performance (KPIs)

**Resposta**:
```json
{
  "oee": {
    "current": 85.3,
    "target": 90.0,
    "trend": "UP",
    "breakdown": {
      "availability": 92.1,
      "performance": 92.8,
      "quality": 98.5
    }
  },
  "throughput": {
    "unitsPerHour": 5.8,
    "target": 6.5,
    "efficiency": 89.2
  },
  "quality": {
    "firstPassYield": 96.8,
    "scrapRate": 1.2,
    "reworkRate": 2.0
  },
  "delivery": {
    "onTimeDelivery": 94.3,
    "averageLeadTime": 3.2 // dias
  }
}
```

## Webhooks

### Sistema de Webhooks
```typescript
interface WebhookEvent {
  id: string;
  type: string;
  timestamp: string;
  data: any;
  signature: string; // HMAC-SHA256
}

// Eventos disponíveis
const WEBHOOK_EVENTS = {
  ORDER_ADDED: 'production.order.added',
  ORDER_STARTED: 'production.order.started',
  ORDER_PROGRESS: 'production.order.progress',
  ORDER_COMPLETED: 'production.order.completed',
  ORDER_FAILED: 'production.order.failed',
  ALERT_CREATED: 'production.alert.created',
  ALERT_ACKNOWLEDGED: 'production.alert.acknowledged',
  QUALITY_INSPECTION: 'quality.inspection.recorded',
  MATERIAL_SHORTAGE: 'material.shortage.detected'
};
```

### Endpoints de Webhook

#### POST `/v1/public/webhooks/register`
**Descrição**: Registrar webhook para notificações

**Autenticação**: API Key

**Request**:
```json
{
  "url": "https://erp.company.com/webhooks/production",
  "events": [
    "production.order.completed",
    "production.alert.created"
  ],
  "secret": "your_webhook_secret_here"
}
```

**Resposta**:
```json
{
  "success": true,
  "webhookId": "wh_123456",
  "verificationSent": true
}
```

#### GET `/v1/public/webhooks`
**Descrição**: Listar webhooks registrados

**Resposta**:
```json
{
  "webhooks": [
    {
      "id": "wh_123456",
      "url": "https://erp.company.com/webhooks/production",
      "events": ["production.order.completed"],
      "isActive": true,
      "lastDelivery": "2024-01-15T14:30:00Z",
      "failureCount": 0
    }
  ]
}
```

#### DELETE `/v1/public/webhooks/:id`
**Descrição**: Remover webhook

## Rate Limiting

### Estratégia
```typescript
class RateLimiter {
  private readonly limits = {
    'production:read': {
      perMinute: 60,
      perHour: 1000,
      perDay: 10000
    },
    'production:write': {
      perMinute: 30,
      perHour: 500,
      perDay: 5000
    },
    'quality:write': {
      perMinute: 20,
      perHour: 300,
      perDay: 3000
    }
  };
  
  async checkLimit(apiKey: string, endpoint: string): Promise<boolean> {
    const key = `rate:${apiKey}:${endpoint}:${Math.floor(Date.now() / 60000)}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      await redis.expire(key, 60); // Expira após 1 minuto
    }
    
    const limit = this.getLimitForEndpoint(endpoint);
    return count <= limit.perMinute;
  }
}
```

### Headers de Rate Limit
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705339800
```

## Códigos de Erro

### HTTP Status Codes
- `200 OK`: Sucesso
- `201 Created`: Recurso criado
- `400 Bad Request`: Request inválido
- `401 Unauthorized`: API Key inválida ou ausente
- `403 Forbidden`: Permissões insuficientes
- `404 Not Found`: Recurso não encontrado
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Erro no servidor

### Códigos de Erro Específicos
```json
{
  "error": {
    "code": "PRODUCTION_ORDER_NOT_FOUND",
    "message": "Ordem de produção não encontrada",
    "details": {
      "orderId": "queue-999"
    }
  }
}
```

## Exemplos de Uso

### 1. Dashboard de Produção
```javascript
// Buscar status geral
const response = await fetch('https://api.factory.com/v1/public/production/status', {
  headers: { 'X-API-Key': 'sk_live_123456' }
});

// Atualizar a cada 30 segundos
setInterval(updateDashboard, 30000);
```

### 2. Sistema MES (Manufacturing Execution System)
```javascript
// Operador inicia produção
await fetch('https://api.factory.com/v1/public/production/orders/queue-001/start', {
  method: 'POST',
  headers: { 'X-API-Key': 'sk_live_mes_system' },
  body: JSON.stringify({
    operatorId: 'OP-001',
    workstationId: 'WS-005'
  })
});

// Atualizar progresso a cada 15 minutos
await fetch('https://api.factory.com/v1/public/production/orders/queue-001/progress', {
  method: 'PUT',
  headers: { 'X-API-Key': 'sk_live_mes_system' },
  body: JSON.stringify({
    progressPercentage: 75,
    currentStage: 'PAINTING'
  })
});
```

### 3. ERP Integration
```javascript
// Webhook para ordens concluídas
app.post('/erp/webhooks/production', async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifySignature(req.body, signature, WEBHOOK_SECRET);
  
  if (!isValid) return res.status(401).send('Invalid signature');
  
  const event = req.body;
  
  if (event.type === 'production.order.completed') {
    // Atualizar estoque no ERP
    await erpService.updateInventory(
      event.data.productCode,
      event.data.quantity,
      'PRODUCTION_OUTPUT'
    );
    
    // Faturar pedido de venda relacionado
    await erpService.invoiceSalesOrder(event.data.salesOrderReference);
  }
  
  res.status(200).send('OK');
});
```

## Segurança

### 1. Validação de Input
```typescript
class InputValidator {
  static validateProductionStart(request: any) {
    const schema = z.object({
      operatorId: z.string().min(1).max(50),
      workstationId: z.string().min(1).max(50),
      notes: z.string().max(500).optional()
    });
    
    return schema.parse(request);
  }
}
```

### 2. Sanitização
```typescript
function sanitizeProductionNotes(notes: string): string {
  return notes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}
```

### 3. Logging de Auditoria
```typescript
class AuditLogger {
  async logApiCall(apiKey: string, endpoint: string, request: any, response: any) {
    await db.auditLog.create({
      data: {
        apiKey: this.maskApiKey(apiKey),
        endpoint,
        requestBody: this.sanitizeForLog(request),
        responseCode: response.status,
        timestamp: new Date()
      }
    });
  }
  
  private maskApiKey(key: string): string {
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  }
}
```

## Performance

### 1. Cache Strategy
```typescript
class PublicApiCache {
  private readonly CACHE_TTL = {
    STATUS: 5000, // 5 segundos
    QUEUE: 10000, // 10 segundos
    STATS: 30000  // 30 segundos
  };
  
  async getProductionStatus(): Promise<ProductionStatus> {
    const cacheKey = 'public:production:status';
    const cached = await redis.get(cacheKey);
    
    if (cached) return JSON.parse(cached);
    
    const status = await this.calculateStatus();
    await redis.setex(cacheKey, this.CACHE_TTL.STATUS / 1000, JSON.stringify(status));
    
    return status;
  }
}
```

### 2. Query Optimization
```sql
-- Materialized view para estatísticas públicas
CREATE MATERIALIZED VIEW public_production_stats AS
SELECT 
  DATE(completed_at) as date,
  COUNT(*) as completed_orders,
  AVG(EXTRACT(EPOCH FROM (completed_at - processing_started_at)) / 60) as avg_cycle_time
FROM production_queue
WHERE status = 'COMPLETED'
  AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(completed_at);

-- Refresh a cada 5 minutos
REFRESH MATERIALIZED VIEW CONCURRENTLY public_production_stats;
```

## Versionamento

### URL Versioning
```
/v1/public/production/status
/v2/public/production/status (futuro)
```

### Deprecation Policy
```json
{
  "deprecated": true,
  "sunsetDate": "2024-06-30",
  "replacement": "/v2/public/production/status",
  "message": "Esta versão será descontinuada em 30/06/2024"
}
```

---

*Esta especificação define a API pública para consumo externo. Os endpoints são projetados para serem objetivos, específicos e fáceis de integrar com sistemas existentes.*