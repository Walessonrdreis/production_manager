# Especificação Técnica: Integração Vendas → Planejamento Produção

## Visão Geral
Sistema para utilizar dados de vendas existentes (pedidos stage20 do Omie) como base para planejamento automático de produção. O objetivo é transformar pedidos de venda em planos de produção otimizados.

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                   Pedidos de Venda (Omie)                   │
│                   (omie-sales-orders module)                │
├─────────────────────────────────────────────────────────────┤
│  Stage20 Orders → Análise → Agrupamento → Sequenciamento    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                Planejamento Automático                      │
├─────────────────────────────────────────────────────────────┤
│  Cálculo Lead Time │ Alocação Recursos │ Necessidade Materiais│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Fila de Produção                           │
│                  (production-queue module)                  │
├─────────────────────────────────────────────────────────────┤
│  Ordem 1 │ Ordem 2 │ Ordem 3 │ ... │ Monitoramento │ KPIs  │
└─────────────────────────────────────────────────────────────┘
```

## Modelo de Dados

### 1. Tabela: `sales_production_mapping`
```sql
CREATE TABLE sales_production_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referências
  sales_order_id UUID NOT NULL REFERENCES omie_sales_orders(id),
  sales_order_item_id UUID NOT NULL,
  production_queue_id UUID REFERENCES production_queue(id),
  
  -- Mapeamento
  product_code VARCHAR(50) NOT NULL,
  sales_quantity INTEGER NOT NULL,
  production_quantity INTEGER NOT NULL,
  
  -- Status
  mapping_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (mapping_status IN ('PENDING', 'PLANNED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED')),
  
  -- Datas
  sales_order_date DATE NOT NULL,
  requested_delivery_date DATE,
  planned_production_start DATE,
  planned_production_end DATE,
  actual_production_start DATE,
  actual_production_end DATE,
  
  -- Metadados
  priority_from_sales INTEGER DEFAULT 5,
  customer_priority_tier INTEGER DEFAULT 3,
  notes TEXT,
  
  -- Indexes
  INDEX idx_sales_prod_sales_id (sales_order_id),
  INDEX idx_sales_prod_prod_id (production_queue_id),
  INDEX idx_sales_prod_status (mapping_status),
  INDEX idx_sales_prod_dates (planned_production_start, planned_production_end),
  
  UNIQUE(sales_order_id, sales_order_item_id)
);
```

### 2. Tabela: `production_planning`
```sql
CREATE TABLE production_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Período do plano
  plan_type VARCHAR(20) NOT NULL 
    CHECK (plan_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  plan_period_start DATE NOT NULL,
  plan_period_end DATE NOT NULL,
  
  -- Status do plano
  plan_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    CHECK (plan_status IN ('DRAFT', 'APPROVED', 'IN_EXECUTION', 'COMPLETED', 'CANCELLED')),
  
  -- Metadados do plano
  total_items INTEGER DEFAULT 0,
  total_quantity INTEGER DEFAULT 0,
  estimated_hours DECIMAL(10,2) DEFAULT 0,
  capacity_utilization DECIMAL(5,2) DEFAULT 0, -- porcentagem
  
  -- Recursos alocados
  allocated_workstations JSONB DEFAULT '[]',
  allocated_operators JSONB DEFAULT '[]',
  
  -- Materiais necessários
  material_requirements JSONB DEFAULT '[]',
  
  -- Aprovação
  approved_by UUID,
  approved_at TIMESTAMP,
  
  -- Datas de controle
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  locked_at TIMESTAMP,
  
  -- Indexes
  INDEX idx_prod_plan_period (plan_period_start, plan_period_end),
  INDEX idx_prod_plan_status (plan_status),
  UNIQUE(plan_type, plan_period_start)
);
```

### 3. Tabela: `planning_algorithm_config`
```sql
CREATE TABLE planning_algorithm_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parâmetros do algoritmo
  algorithm_name VARCHAR(100) NOT NULL,
  algorithm_version VARCHAR(20) NOT NULL,
  
  -- Fatores de ponderação
  delivery_date_weight DECIMAL(5,2) DEFAULT 1.0,
  customer_priority_weight DECIMAL(5,2) DEFAULT 1.0,
  product_complexity_weight DECIMAL(5,2) DEFAULT 1.0,
  material_availability_weight DECIMAL(5,2) DEFAULT 1.0,
  
  -- Limites
  max_daily_capacity_hours INTEGER DEFAULT 480, -- 8 horas * 60 minutos
  max_concurrent_orders INTEGER DEFAULT 10,
  min_batch_size INTEGER DEFAULT 5,
  
  -- Lead times padrão por tipo de produto
  lead_time_config JSONB DEFAULT '{
    "SIMPLE": 2,
    "MEDIUM": 5,
    "COMPLEX": 10,
    "CUSTOM": 15
  }',
  
  -- Configuração de setores
  sector_capacity_config JSONB DEFAULT '{
    "CUTTING": {"capacity_per_hour": 10, "operators": 3},
    "ASSEMBLY": {"capacity_per_hour": 8, "operators": 5},
    "PAINTING": {"capacity_per_hour": 6, "operators": 2},
    "PACKING": {"capacity_per_hour": 15, "operators": 2}
  }',
  
  -- Ativação
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMP,
  
  -- Metadados
  description TEXT,
  created_by UUID,
  
  -- Indexes
  INDEX idx_planning_config_active (is_active),
  UNIQUE(algorithm_name, algorithm_version)
);
```

## Algoritmo de Planejamento

### 1. Coleta de Dados de Vendas
```typescript
class SalesDataCollector {
  async collectStage20Orders(period: { start: Date; end: Date }) {
    // 1. Buscar pedidos stage20 do módulo existente
    const stage20Orders = await this.salesRepository.listStage20Orders({
      fromDate: period.start,
      toDate: period.end,
      includeItems: true
    });
    
    // 2. Extrair informações relevantes
    const salesItems = this.extractSalesItems(stage20Orders);
    
    // 3. Agrupar por produto e data de entrega
    const groupedItems = this.groupByProductAndDelivery(salesItems);
    
    return {
      totalOrders: stage20Orders.length,
      totalItems: salesItems.length,
      groupedItems,
      period
    };
  }
  
  private extractSalesItems(orders: any[]) {
    return orders.flatMap(order => 
      order.items.map(item => ({
        salesOrderId: order.id,
        salesOrderNumber: order.orderNumber,
        salesOrderDate: order.orderDate,
        customerCode: order.customerCode,
        customerName: order.customerName,
        customerPriority: this.calculateCustomerPriority(order.customerCode),
        
        productCode: item.productCode,
        productName: item.productName,
        productType: item.productType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        
        requestedDeliveryDate: order.requestedDeliveryDate,
        promisedDeliveryDate: order.promisedDeliveryDate,
        
        // Metadados do produto
        productionComplexity: this.getProductionComplexity(item.productCode),
        standardLeadTime: this.getStandardLeadTime(item.productCode),
        requiredMaterials: this.getRequiredMaterials(item.productCode)
      }))
    );
  }
}
```

### 2. Cálculo de Lead Time
```typescript
class LeadTimeCalculator {
  calculateProductionLeadTime(item: SalesItem, currentWorkload: WorkloadData): number {
    // Lead time base do produto
    const baseLeadTime = item.standardLeadTime; // dias
    
    // Fator de complexidade
    const complexityFactor = this.getComplexityFactor(item.productionComplexity);
    
    // Fator de capacidade atual
    const capacityFactor = this.getCapacityFactor(currentWorkload);
    
    // Fator de disponibilidade de material
    const materialFactor = this.getMaterialAvailabilityFactor(item.requiredMaterials);
    
    // Cálculo final
    const calculatedLeadTime = Math.ceil(
      baseLeadTime * complexityFactor * capacityFactor * materialFactor
    );
    
    // Ajuste mínimo e máximo
    return Math.max(1, Math.min(calculatedLeadTime, 30));
  }
  
  private getComplexityFactor(complexity: string): number {
    const factors = {
      'SIMPLE': 1.0,
      'MEDIUM': 1.5,
      'COMPLEX': 2.0,
      'CUSTOM': 2.5
    };
    
    return factors[complexity] || 1.0;
  }
  
  private getCapacityFactor(workload: WorkloadData): number {
    const utilization = workload.currentUtilization / workload.maxCapacity;
    
    if (utilization < 0.7) return 1.0;
    if (utilization < 0.9) return 1.2;
    if (utilization < 1.0) return 1.5;
    return 2.0; // Sobrecarga
  }
}
```

### 3. Algoritmo de Sequenciamento
```typescript
class ProductionSequencingAlgorithm {
  async generateOptimalSequence(items: PlanningItem[]): Promise<ProductionSequence> {
    // 1. Calcular scores para cada item
    const scoredItems = items.map(item => ({
      ...item,
      score: this.calculateItemScore(item)
    }));
    
    // 2. Ordenar por score (maior primeiro)
    const sortedItems = scoredItems.sort((a, b) => b.score - a.score);
    
    // 3. Aplicar restrições de capacidade
    const sequencedItems = this.applyCapacityConstraints(sortedItems);
    
    // 4. Otimizar para minimizar setup times
    const optimizedSequence = this.optimizeForSetupReduction(sequencedItems);
    
    // 5. Calcular datas de início e término
    const scheduledSequence = this.scheduleProductionDates(optimizedSequence);
    
    return {
      items: scheduledSequence,
      totalDuration: this.calculateTotalDuration(scheduledSequence),
      capacityUtilization: this.calculateUtilization(scheduledSequence),
      estimatedCompletion: this.getEstimatedCompletion(scheduledSequence)
    };
  }
  
  private calculateItemScore(item: PlanningItem): number {
    const weights = this.config.deliveryDateWeight;
    
    // Fator de urgência (dias até entrega)
    const daysToDelivery = this.getDaysToDelivery(item.requestedDeliveryDate);
    const urgencyFactor = Math.max(0.1, 10 / (daysToDelivery + 1));
    
    // Fator de prioridade do cliente
    const customerFactor = item.customerPriority * this.config.customerPriorityWeight;
    
    // Fator de valor (quantidade * preço unitário)
    const valueFactor = (item.quantity * item.unitPrice) / 1000;
    
    // Fator de complexidade (inverso - itens simples primeiro)
    const complexityFactor = 1 / this.getComplexityValue(item.productionComplexity);
    
    return (urgencyFactor * 0.4) + 
           (customerFactor * 0.3) + 
           (valueFactor * 0.2) + 
           (complexityFactor * 0.1);
  }
  
  private applyCapacityConstraints(items: ScoredItem[]): SequencedItem[] {
    const result: SequencedItem[] = [];
    let remainingCapacity = this.config.max_daily_capacity_hours;
    
    for (const item of items) {
      const estimatedHours = this.estimateProductionHours(item);
      
      if (estimatedHours <= remainingCapacity) {
        result.push({
          ...item,
          allocatedHours: estimatedHours,
          sequencePosition: result.length + 1
        });
        
        remainingCapacity -= estimatedHours;
      } else {
        // Item para o próximo dia
        break;
      }
    }
    
    return result;
  }
}
```

### 4. Cálculo de Necessidade de Materiais
```typescript
class MaterialRequirementsCalculator {
  async calculateRequirements(sequence: ProductionSequence): Promise<MaterialRequirements> {
    const requirements = new Map<string, MaterialRequirement>();
    
    for (const item of sequence.items) {
      const itemMaterials = await this.getMaterialsForProduct(item.productCode);
      
      for (const material of itemMaterials) {
        const key = material.code;
        const requiredQty = material.quantityPerUnit * item.quantity;
        
        if (requirements.has(key)) {
          const existing = requirements.get(key)!;
          existing.requiredQuantity += requiredQty;
          existing.items.push({
            productionItemId: item.id,
            quantity: requiredQty
          });
        } else {
          requirements.set(key, {
            materialCode: material.code,
            materialName: material.name,
            unitOfMeasure: material.unit,
            requiredQuantity: requiredQty,
            currentStock: await this.getCurrentStock(material.code),
            items: [{
              productionItemId: item.id,
              quantity: requiredQty
            }]
          });
        }
      }
    }
    
    // Calcular déficit
    const result = Array.from(requirements.values()).map(req => ({
      ...req,
      deficit: Math.max(0, req.requiredQuantity - req.currentStock),
      hasShortage: req.requiredQuantity > req.currentStock
    }));
    
    return {
      materials: result,
      totalMaterials: result.length,
      materialsWithShortage: result.filter(r => r.hasShortage).length,
      totalDeficit: result.reduce((sum, r) => sum + r.deficit, 0)
    };
  }
}
```

## Endpoints da API

### 1. Análise de Pedidos de Venda

#### POST `/v1/planning/analyze-sales`
**Descrição**: Analisar pedidos de venda para planejamento

**Request**:
```json
{
  "period": {
    "start": "2024-01-15",
    "end": "2024-01-21"
  },
  "options": {
    "includeStage20Only": true,
    "groupByProduct": true,
    "calculateLeadTimes": true
  }
}
```

**Resposta**:
```json
{
  "analysisId": "analysis-001",
  "period": {
    "start": "2024-01-15",
    "end": "2024-01-21"
  },
  "summary": {
    "totalOrders": 42,
    "totalItems": 156,
    "totalQuantity": 1250,
    "uniqueProducts": 28
  },
  "byProduct": [
    {
      "productCode": "PROD-001",
      "productName": "Mesa de Madeira",
      "totalQuantity": 120,
      "ordersCount": 8,
      "estimatedLeadTime": 5,
      "requiredMaterials": [
        {
          "code": "MAT-001",
          "name": "Madeira Carvalho",
          "quantity": 300,
          "unit": "m²"
        }
      ]
    }
  ],
  "recommendations": {
    "productionDaysNeeded": 4,
    "priorityProducts": ["PROD-001", "PROD-005"],
    "potentialBottlenecks": ["MAT-001"]
  }
}
```

### 2. Geração de Plano de Produção

#### POST `/v1/planning/generate`
**Descrição**: Gerar plano de produção automático

**Request**:
```json
{
  "analysisId": "analysis-001",
  "planType": "WEEKLY",
  "planPeriod": {
    "start": "2024-01-22",
    "end": "2024-01-26"
  },
  "constraints": {
    "maxDailyHours": 480,
    "availableOperators": 12,
    "workstationAvailability": {
      "CUTTING": 3,
      "ASSEMBLY": 5,
      "PAINTING": 2,
      "PACKING": 2
    }
  }
}
```

**Resposta**:
```json
{
  "planId": "plan-2024-04",
  "planType": "WEEKLY",
  "period": {
    "start": "2024-01-22",
    "end": "2024-01-26"
  },
  "status": "DRAFT",
  "summary": {
    "totalItems": 42,
    "totalQuantity": 1250,
    "estimatedHours": 1920,
    "capacityUtilization": 85.3
  },
  "dailySchedule": {
    "2024-01-22": {
      "items": 8,
      "quantity": 240,
      "hours": 384,
      "utilization": 80.0,
      "products": ["PROD-001", "PROD-002"]
    }
  },
  "resourceAllocation": {
    "workstations": {
      "CUTTING": { "allocated": 2, "utilization": 85 },
      "ASSEMBLY": { "allocated": 4, "utilization": 90 }
    },
    "operators": {
      "total": 10,
      "bySector": {
        "CUTTING": 2,
        "ASSEMBLY": 5,
        "PAINTING": 2,
        "PACKING": 1
      }
    }
  },
  "materialRequirements": {
    "totalMaterials": 15,
    "withShortage": 3,
    "criticalShortages": [
      {
        "materialCode": "MAT-001",
        "materialName": "Madeira Carvalho",
        "required": 300,
        "available": 50,
        "deficit": 250,
        "urgency": "HIGH"
      }
    ]
  }
}
```

### 3. Aprovação e Execução

#### PUT `/v1/planning/:id/approve`
**Descrição**: Aprovar plano de produção

**Request**:
```json
{
  "approvedBy": "manager-001",
  "notes": "Plano aprovado com ajustes na sequência",
  "adjustments": [
    {
      "itemId": "prod-item-001",
      "change": "MOVE_TO_DAY_2",
      "reason": "Aguardar material"
    }
  ]
}
```

**Resposta**:
```json
{
  "success": true,
  "planId": "plan-2024-04",
  "newStatus": "APPROVED",
  "approvedAt": "2024-01-18T14:30:00Z",
  "nextSteps": [
    {
      "action": "GENERATE_PRODUCTION_ORDERS",
      "endpoint": "/v1/planning/plan-2024-04/generate-orders"
    }
  ]
}
```

#### POST `/v1/planning/:id/generate-orders`
**Descrição**: Gerar ordens de produção a partir do plano

**Resposta**:
```json
{
  "success": true,
  "planId": "plan-2024-04",
  "generatedOrders": 42,
  "addedToQueue": 42,
  "queueIds": ["queue-001", "queue-002", "..."],
  "schedule": {
    "firstOrderStart": "2024-01-22T08:00:00Z",
    "lastOrderCompletion": "2024-01-26T18:30:00Z"
  }
}
```

### 4. Monitoramento e Ajustes

#### GET `/v1/planning/current`
**Descrição**: Obter plano de produção atual

**Resposta**:
```json
{
  "planId": "plan-2024-04",
  "status": "IN_EXECUTION",
  "progress": {
    "totalItems": 42,
    "completed": 15,
    "inProgress": 8,
    "pending": 19,
    "completionPercentage": 35.7
  },
  "performance": {
    "actualVsPlanned": 92.5,
    "averageDelay": 2.3, // horas
    "qualityRate": 98.2
  },
  "issues": [
    {
      "type": "MATERIAL_DELAY",
      "severity": "MEDIUM",
      "affectedItems": ["queue-005", "queue-006"],
      "estimatedImpact": 8 // horas
    }
  ]
}
```

#### PUT `/v1/planning/:id/adjust`
**Descrição**: Ajustar plano em execução

**Request**:
```json
{
  "adjustments": [
    {
      "action": "RESCHEDULE",
      "itemId": "queue-005",
      "newStartDate": "2024-01-23T10:00:00Z",
      "reason": "Material chegou com atraso"
    },
    {
      "action": "CHANGE_PRIORITY",
      "itemId": "queue-008",
      "newPriority": "URGENT",
      "reason": "Cliente VIP solicitou antecipação"
    }
  ]
}
```

### 5. Previsões e Simulações

#### POST `/v1/planning/forecast`
**Descrição**: Gerar previsão de produção

**Request**:
```json
{
  "scenario": "OPTIMISTIC",
  "period": {
    "start": "2024-01-22",
    "end": "2024-02-22"
  },
  "assumptions": {
    "capacityIncrease": 10, // porcentagem
    "efficiencyImprovement": 5,
    "newProducts": ["PROD-030", "PROD-031"]
  }
}
```

**Resposta**:
```json
{
  "forecastId": "fc-2024-04",
  "scenario": "OPTIMISTIC",
  "period": {
    "start": "2024-01-22",
    "end": "2024-02-22"
  },
  "predictions": {
    "totalOutput": 5600,
    "averageDaily": 280,
    "peakDay": 320,
    "bottleneckDays": 3
  },
  "recommendations": [
    {
      "type": "CAPACITY",
      "action": "ADD_WORKSTATION",
      "sector": "ASSEMBLY",
      "impact": 15, // porcentagem aumento
      "costEstimate": 25000
    },
    {
      "type": "MATERIAL",
      "action": "INCREASE_SAFETY_STOCK",
      "material": "MAT-001",
      "currentLevel": 50,
      "recommended": 100,
      "reason": "Alta demanda prevista"
    }
  ]
}
```

#### POST `/v1/planning/simulate`
**Descrição**: Simular diferentes cenários de planejamento

**Request**:
```json
{
  "basePlanId": "plan-2024-04",
  "scenarios": [
    {
      "name": "SCENARIO_A",
      "changes": {
        "increaseCapacity": 15,
        "addOperator": 2,
        "priorityShift": ["PROD-005", "PROD-008"]
      }
    },
    {
      "name": "SCENARIO_B",
      "changes": {
        "reduceBatchSize": 30,
        "implementOvertime": true,
        "overtimeHours": 40
      }
    }
  ]
}
```

**Resposta**:
```json
{
  "simulationId": "sim-001",
  "basePlan": "plan-2024-04",
  "results": {
    "SCENARIO_A": {
      "completionDate": "2024-01-25T16:00:00Z",
      "totalHours": 1750,
      "utilization": 91.2,
      "costImpact": 12000
    },
    "SCENARIO_B": {
      "completionDate": "2024-01-24T14:30:00Z",
      "totalHours": 1680,
      "utilization": 87.5,
      "costImpact": 18000
    }
  },
  "comparison": {
    "bestScenario": "SCENARIO_B",
    "timeSavings": 1.5, // dias
    "costDifference": 6000
  }
}
```

## Fluxo de Trabalho Completo

### 1. Coleta Automática (Diária)
```typescript
class DailyPlanningWorkflow {
  async execute() {
    // 1. Coletar pedidos stage20 do dia anterior
    const salesData = await this.collector.collectStage20Orders({
      start: yesterday(),
      end: today()
    });
    
    // 2. Analisar para planejamento
    const analysis = await this.analyzer.analyze(salesData);
    
    // 3. Verificar se há itens críticos
    const criticalItems = this.identifyCriticalItems(analysis);
    
    if (criticalItems.length > 0) {
      // 4. Gerar plano de ajuste para itens críticos
      const adjustmentPlan = await this.generateAdjustmentPlan(criticalItems);
      
      // 5. Notificar gestores
      await this.notificationService.notifyAdjustmentNeeded(adjustmentPlan);
    }
    
    // 6. Atualizar previsões de longo prazo
    await this.updateLongTermForecast(analysis);
    
    return {
      analysisId: analysis.id,
      criticalItems: criticalItems.length,
      adjustmentsGenerated: adjustmentPlan ? adjustmentPlan.items.length : 0
    };
  }
}
```

### 2. Planejamento Semanal (Segunda-feira)
```typescript
class WeeklyPlanningWorkflow {
  async execute() {
    // 1. Coletar pedidos da semana anterior
    const salesData = await this.collector.collectStage20Orders({
      start: lastMonday(),
      end: lastFriday()
    });
    
    // 2. Analisar tendências
    const trendAnalysis = await this.analyzer.analyzeTrends(salesData);
    
    // 3. Gerar plano semanal
    const weeklyPlan = await this.planner.generateWeeklyPlan({
      analysis: trendAnalysis,
      period: {
        start: nextMonday(),
        end: nextFriday()
      },
      constraints: this.getCurrentConstraints()
    });
    
    // 4. Simular cenários
    const scenarios = await this.simulator.runScenarios(weeklyPlan);
    
    // 5. Selecionar melhor cenário
    const selectedScenario = this.selectBestScenario(scenarios);
    
    // 6. Gerar ordens de produção
    const productionOrders = await this.orderGenerator.generateFromPlan(
      selectedScenario.plan
    );
    
    // 7. Notificar setores
    await this.notificationService.notifyPlanApproved({
      plan: selectedScenario.plan,
      orders: productionOrders
    });
    
    return {
      planId: selectedScenario.plan.id,
      ordersGenerated: productionOrders.length,
      estimatedCompletion: selectedScenario.plan.estimatedCompletion
    };
  }
}
```

## Integração com Sistemas Existentes

### 1. Conexão com `omie-sales-orders`
```typescript
class OmieSalesIntegration {
  private readonly STAGE20_STATUS = '20'; // Status stage20 do Omie
  
  async getStage20OrdersForPlanning(period: DateRange) {
    // Usar o use case existente do módulo omie-sales-orders
    const stage20Orders = await this.salesUseCase.listStage20Orders({
      fromDate: period.start,
      toDate: period.end
    });
    
    // Transformar para formato de planejamento
    return stage20Orders.map(order => ({
      id: order.id,
      orderNumber: order.numero_pedido,
      orderDate: order.data_pedido,
      customer: {
        code: order.codigo_cliente,
        name: order.nome_cliente,
        priority: this.calculateCustomerPriority(order.codigo_cliente)
      },
      items: order.itens.map(item => ({
        productCode: item.codigo_item,
        productName: item.descricao_item,
        quantity: item.quantidade,
        unitPrice: item.valor_unitario,
        totalValue: item.valor_total
      })),
      requestedDelivery: order.data_entrega,
      status: order.status
    }));
  }
}
```

### 2. Conexão com `plans` Module
```typescript
class PlansModuleIntegration {
  async createProductionPlanFromPlanning(planningResult: PlanningResult) {
    // Usar o use case existente do módulo plans
    const plan = await this.plansUseCase.createPlan({
      name: `Plano Semanal ${formatDate(planningResult.period.start)}`,
      description: `Gerado automaticamente do planejamento de vendas`,
      periodStart: planningResult.period.start,
      periodEnd: planningResult.period.end
    });
    
    // Adicionar itens ao plano
    for (const item of planningResult.items) {
      await this.plansUseCase.addPlanItem({
        planId: plan.id,
        productCode: item.productCode,
        quantity: item.quantity,
        sector: item.assignedSector,
        sequence: item.sequencePosition
      });
    }
    
    return plan;
  }
}
```

## Dashboard de Planejamento

### 1. Visão Geral
```typescript
interface PlanningDashboard {
  currentPlan: {
    id: string;
    status: string;
    progress: number;
    completionDate: string;
  };
  
  salesBacklog: {
    totalItems: number;
    totalValue: number;
    byPriority: Record<string, number>;
  };
  
  capacity: {
    utilization: number;
    availableSlots: number;
    bottlenecks: string[];
  };
  
  materialStatus: {
    criticalShortages: number;
    upcomingRequirements: MaterialRequirement[];
  };
  
  recommendations: {
    urgentActions: PlanningAction[];
    optimizationSuggestions: string[];
  };
}
```

### 2. Alertas Automáticos
```typescript
class PlanningAlerts {
  async checkAndNotify() {
    const alerts = [];
    
    // 1. Verificar atrasos no plano atual
    const delays = await this.checkPlanDelays();
    if (delays.length > 0) {
      alerts.push({
        type: 'PLAN_DELAY',
        severity: 'WARNING',
        items: delays,
        message: `${delays.length} itens com atraso no plano atual`
      });
    }
    
    // 2. Verificar estoque crítico
    const shortages = await this.checkMaterialShortages();
    if (shortages.length > 0) {
      alerts.push({
        type: 'MATERIAL_SHORTAGE',
        severity: 'CRITICAL',
        items: shortages,
        message: `${shortages.length} materiais com estoque crítico`
      });
    }
    
    // 3. Verificar capacidade excedida
    const overload = await this.checkCapacityOverload();
    if (overload) {
      alerts.push({
        type: 'CAPACITY_OVERLOAD',
        severity: 'WARNING',
        details: overload,
        message: 'Capacidade excedida para a próxima semana'
      });
    }
    
    // Enviar notificações
    if (alerts.length > 0) {
      await this.notificationService.sendPlanningAlerts(alerts);
    }
    
    return alerts;
  }
}
```

## Próximos Passos de Implementação

### Semana 1: Modelos e Coleta
1. [ ] Criar migrations para tabelas de planejamento
2. [ ] Implementar `SalesDataCollector` para integrar com `omie-sales-orders`
3. [ ] Criar repositórios para `sales_production_mapping` e `production_planning`

### Semana 2: Algoritmos Básicos
1. [ ] Implementar `LeadTimeCalculator` com fatores configuráveis
2. [ ] Desenvolver algoritmo básico de sequenciamento
3. [ ] Criar `MaterialRequirementsCalculator`

### Semana 3: API e Integração
1. [ ] Implementar endpoints de análise e planejamento
2. [ ] Integrar com módulo `plans` existente
3. [ ] Criar sistema de aprovação de planos

### Semana 4: Dashboard e Otimização
1. [ ] Desenvolver dashboard de planejamento
2. [ ] Implementar sistema de alertas automáticos
3. [ ] Adicionar simulação de cenários
4. [ ] Escrever testes completos

## Métricas de Sucesso

### 1. Precisão de Planejamento
- Acurácia > 85% nas datas de conclusão estimadas
- Redução de 30% nos atrasos de produção
- Otimização de 20% no uso de capacidade

### 2. Eficiência Operacional
- Redução de 40% no tempo de planejamento manual
- Aumento de 15% na produtividade
- Diminuição de 25% no estoque em processo

### 3. Integração com Vendas
- 100% dos pedidos stage20 considerados no planejamento
- Tempo de resposta < 5 minutos para ajustes de prioridade
- Visibilidade completa do backlog de produção

---

*Este sistema transforma dados de vendas em planos de produção otimizados, criando uma ponte direta entre demanda do mercado e capacidade de produção.*