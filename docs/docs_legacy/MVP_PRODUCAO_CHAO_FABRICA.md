# MVP - Produção e Chão de Fábrica

## Visão Geral
MVP focado em gestão de produção e chão de fábrica, utilizando os dados existentes de vendas do Omie como base para planejamento. O objetivo é criar uma API melhorada com funcionalidades que a API do Omie não possui, especialmente para gestão de fábrica.

## Módulos Existentes Relevantes

### 1. **omie-sales-orders** (Vendas)
- Endpoints: `/v1/admin/orders`, `/v1/admin/orders/stage20`
- Funcionalidades: Listagem de pedidos, sincronização com Omie, pedidos stage20 (prontos para produção)
- Dados disponíveis: Pedidos de venda, produtos, quantidades, clientes

### 2. **omie-production-orders** (Produção)
- Endpoints: `/v1/admin/omie/production-orders`
- Funcionalidades: Listagem de ordens de produção, sincronização com Omie, estatísticas
- Dados disponíveis: Ordens de produção, status, itens, datas

### 3. **plans** (Planos)
- Endpoints: `/v1/admin/plans`
- Funcionalidades: Criação de planos de produção, itens por setor, exportação CSV
- Dados disponíveis: Planos de produção, setores, sequenciamento

### 4. **orders-enriched** (Pedidos Enriquecidos)
- Endpoints: `/v1/admin/orders/enriched`
- Funcionalidades: Enriquecimento de pedidos com nome do cliente (melhoria que Omie não tem)

## Fases do MVP

### Fase 1: Sistema Básico de Fila para Ordens de Produção (Semanas 1-4)

#### Objetivo
Implementar sistema para executar múltiplas ordens de produção em fila, permitindo processamento em lote.

#### Funcionalidades
1. **Sistema de Fila de Produção**
   - Endpoint para adicionar ordens à fila de produção
   - Endpoint para listar fila atual com status
   - Endpoint para processar próxima ordem na fila
   - Endpoint para cancelar/pausar processamento

2. **Status de Produção**
   - `PENDING`: Aguardando processamento
   - `PROCESSING`: Em produção
   - `COMPLETED`: Produção concluída
   - `FAILED`: Falha na produção
   - `CANCELLED`: Cancelada pelo usuário

3. **Integração com Omie**
   - Sincronização automática de status após conclusão
   - Atualização de estoque após produção concluída

#### Endpoints Fase 1
```
POST   /v1/production/queue/add          # Adicionar ordem à fila
GET    /v1/production/queue              # Listar fila atual
POST   /v1/production/queue/process-next # Processar próxima ordem
PUT    /v1/production/queue/:id/cancel   # Cancelar ordem na fila
GET    /v1/production/queue/stats        # Estatísticas da fila
```

#### Tabelas Banco de Dados
```sql
CREATE TABLE production_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  omie_order_code VARCHAR(50) NOT NULL,
  product_code VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  priority INTEGER DEFAULT 5,
  status VARCHAR(20) DEFAULT 'PENDING',
  scheduled_start TIMESTAMP,
  actual_start TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_production_queue_status ON production_queue(status);
CREATE INDEX idx_production_queue_priority ON production_queue(priority, created_at);
```

### Fase 2: Endpoints Objetivos para Consumo Externo (Semanas 5-8)

#### Objetivo
Criar endpoints simplificados e objetivos para consumo por sistemas externos (ERP, MES, dashboards).

#### Funcionalidades
1. **API Pública Simplificada**
   - Endpoints sem prefixo `/admin`
   - Autenticação por API Key
   - Rate limiting por cliente
   - Documentação OpenAPI/Swagger

2. **Endpoints Específicos para Chão de Fábrica**
   - Status atual da produção
   - Próximas ordens a serem produzidas
   - Alertas de falta de material
   - Tempos de ciclo por produto

3. **Webhooks para Integração**
   - Notificação quando ordem inicia produção
   - Notificação quando ordem é concluída
   - Notificação de falha na produção
   - Notificação de estoque crítico

#### Endpoints Fase 2
```
# API Pública
GET    /v1/public/production/status      # Status geral da produção
GET    /v1/public/production/next-orders # Próximas 10 ordens
GET    /v1/public/production/alerts      # Alertas ativos
POST   /v1/public/production/complete    # Registrar conclusão (MES)

# Webhooks
POST   /v1/webhooks/production/register  # Registrar webhook
DELETE /v1/webhooks/production/:id       # Remover webhook
GET    /v1/webhooks/production           # Listar webhooks
```

#### Configuração API Key
```typescript
// Exemplo de middleware de autenticação
app.addHook('onRequest', async (request, reply) => {
  const apiKey = request.headers['x-api-key'];
  if (!apiKey) throw new Error('API key required');
  
  const client = await db.apiClient.findUnique({ where: { apiKey } });
  if (!client) throw new Error('Invalid API key');
  
  if (!client.active) throw new Error('API key disabled');
  
  // Rate limiting
  const requests = await redis.get(`rate:${client.id}:${Date.now() / 60000}`);
  if (requests > client.rateLimit) throw new Error('Rate limit exceeded');
});
```

### Fase 3: Integração Vendas → Planejamento Produção (Semanas 9-12)

#### Objetivo
Utilizar dados de vendas existentes para gerar planejamento de produção automático.

#### Funcionalidades
1. **Análise de Pedidos Stage20**
   - Agrupamento por produto/semana
   - Cálculo de lead time de produção
   - Sugestão de sequenciamento ótimo

2. **Planejamento Automático**
   - Geração automática de plano de produção semanal
   - Alocação de recursos por setor
   - Cálculo de necessidade de matéria-prima

3. **Dashboard de Planejamento**
   - Visualização de backlog de produção
   - Capacidade vs demanda
   - Previsão de conclusão

#### Endpoints Fase 3
```
POST   /v1/planning/generate             # Gerar plano semanal
GET    /v1/planning/current              # Plano atual
PUT    /v1/planning/:id/adjust          # Ajustar plano
GET    /v1/planning/forecast            # Previsão produção
POST   /v1/planning/optimize            # Otimizar sequenciamento
```

#### Algoritmo de Planejamento
```typescript
interface ProductionPlanning {
  generateWeeklyPlan(salesOrders: SalesOrder[]): ProductionPlan {
    // 1. Agrupar pedidos por produto
    const productGroups = this.groupByProduct(salesOrders);
    
    // 2. Calcular lead time por produto
    const leadTimes = this.calculateLeadTimes(productGroups);
    
    // 3. Sequenciar por prioridade (data entrega, cliente)
    const sequence = this.optimizeSequence(productGroups, leadTimes);
    
    // 4. Alocar por setor considerando capacidade
    const allocation = this.allocateBySector(sequence);
    
    return {
      weeklyPlan: allocation,
      materialRequirements: this.calculateMaterials(allocation),
      estimatedCompletion: this.estimateCompletion(allocation)
    };
  }
}
```

### Fase 4: Funcionalidades Completas de Chão de Fábrica (Semanas 13-16)

#### Objetivo
Implementar todas as funcionalidades necessárias para gestão completa do chão de fábrica.

#### Funcionalidades
1. **Controle de Qualidade**
   - Registro de inspeções
   - Não conformidades
   - Retrabalho
   - Estatísticas de qualidade

2. **Manutenção de Equipamentos**
   - Agendamento de manutenção
   - Histórico de intervenções
   - Alertas de manutenção preventiva
   - Downtime tracking

3. **Controle de Pessoal**
   - Turnos de trabalho
   - Produtividade por operador
   - Habilidades/certificações
   - Absenteísmo

4. **Indicadores de Performance (KPI)**
   - OEE (Overall Equipment Effectiveness)
   - Takt time
   - Cycle time
   - Scrap rate
   - On-time delivery

#### Endpoints Fase 4
```
# Qualidade
POST   /v1/quality/inspections           # Registrar inspeção
GET    /v1/quality/metrics               # Métricas de qualidade
POST   /v1/quality/non-conformities      # Registrar não conformidade

# Manutenção
POST   /v1/maintenance/schedule          # Agendar manutenção
GET    /v1/maintenance/upcoming          # Próximas manutenções
POST   /v1/maintenance/complete          # Registrar conclusão

# Pessoal
GET    /v1/personnel/shifts              # Turnos atuais
POST   /v1/personnel/attendance          # Registrar presença
GET    /v1/personnel/productivity        # Produtividade

# KPIs
GET    /v1/kpis/oee                      # OEE por equipamento
GET    /v1/kpis/takt-time                # Takt time atual
GET    /v1/kpis/delivery-performance     # Performance entrega
```

#### Modelo de Dados Completo
```sql
-- Controle de Qualidade
CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY,
  production_order_id UUID REFERENCES production_queue(id),
  inspector_id UUID,
  inspection_type VARCHAR(50),
  result VARCHAR(20), -- PASS, FAIL, REWORK
  defects JSONB,
  created_at TIMESTAMP
);

-- Manutenção
CREATE TABLE maintenance_schedule (
  id UUID PRIMARY KEY,
  equipment_id VARCHAR(50),
  maintenance_type VARCHAR(50), -- PREVENTIVE, CORRECTIVE
  scheduled_date DATE,
  completed_date DATE,
  technician_id UUID,
  notes TEXT
);

-- KPIs
CREATE TABLE production_kpis (
  id UUID PRIMARY KEY,
  date DATE,
  equipment_id VARCHAR(50),
  oee DECIMAL(5,2),
  availability DECIMAL(5,2),
  performance DECIMAL(5,2),
  quality DECIMAL(5,2),
  takt_time DECIMAL(10,2),
  cycle_time DECIMAL(10,2)
);
```

## Roadmap de Implementação

### Semana 1-2: Infraestrutura Base
- [ ] Criar módulo `production-queue` com estrutura Clean Architecture
- [ ] Definir modelos Prisma para fila de produção
- [ ] Implementar repositórios básicos (create, read, update)
- [ ] Criar endpoints básicos da Fase 1

### Semana 3-4: Lógica de Fila
- [ ] Implementar sistema de prioridades
- [ ] Criar worker para processamento automático
- [ ] Integrar com Omie para atualização de status
- [ ] Testes unitários e de integração

### Semana 5-6: API Pública
- [ ] Implementar autenticação por API Key
- [ ] Criar middleware de rate limiting
- [ ] Desenvolver endpoints públicos simplificados
- [ ] Documentação OpenAPI

### Semana 7-8: Webhooks e Notificações
- [ ] Sistema de webhooks com retry logic
- [ ] Notificações em tempo real (WebSocket opcional)
- [ ] Dashboard de status para chão de fábrica
- [ ] Integração com sistemas externos

### Semana 9-10: Planejamento Automático
- [ ] Algoritmo de análise de pedidos stage20
- [ ] Geração automática de planos semanais
- [ ] Cálculo de necessidade de materiais
- [ ] Interface de ajuste manual

### Semana 11-12: Otimização
- [ ] Algoritmo de sequenciamento ótimo
- [ ] Simulação de cenários
- [ ] Dashboard de capacidade vs demanda
- [ ] Relatórios de previsão

### Semana 13-14: Controle de Qualidade
- [ ] Sistema de inspeções
- [ ] Gestão de não conformidades
- [ ] Estatísticas de qualidade
- [ ] Integração com produção

### Semana 15-16: KPIs e Analytics
- [ ] Cálculo de OEE
- [ ] Tracking de performance
- [ ] Dashboard executivo
- [ ] Relatórios automáticos

## Melhorias em Relação à API Omie

### 1. **Processamento em Fila**
- **Omie**: Processamento individual de ordens
- **Nossa API**: Sistema de fila com prioridades e processamento em lote

### 2. **Endpoints Objetivos**
- **Omie**: Endpoints genéricos com resposta complexa
- **Nossa API**: Endpoints específicos para cada necessidade do chão de fábrica

### 3. **Integração Vendas→Produção**
- **Omie**: Sistemas separados sem integração automática
- **Nossa API**: Planejamento automático baseado em pedidos de venda

### 4. **Controle de Qualidade**
- **Omie**: Não possui funcionalidades de qualidade
- **Nossa API**: Sistema completo de inspeções e não conformidades

### 5. **KPIs em Tempo Real**
- **Omie**: Relatórios básicos sem atualização em tempo real
- **Nossa API**: Dashboard com KPIs atualizados automaticamente

### 6. **API para Sistemas Externos**
- **Omie**: API complexa para desenvolvedores
- **Nossa API**: API simplificada com autenticação por API Key

## Próximos Passos Imediatos

1. **Iniciar Fase 1**: Implementar sistema básico de fila
2. **Definir Prioridades**: Estabelecer critérios de prioridade para ordens
3. **Criar Dashboard**: Interface simples para visualização da fila
4. **Testar Integração**: Validar sincronização com Omie após conclusão

## Métricas de Sucesso

### Fase 1
- [ ] Processamento de 10+ ordens em fila simultaneamente
- [ ] Tempo de setup < 5 minutos por ordem
- [ ] 99% de sucesso na sincronização com Omie

### Fase 2
- [ ] 3+ sistemas externos integrados via API
- [ ] Latência < 100ms para endpoints públicos
- [ ] 0 incidents de rate limiting excessivo

### Fase 3
- [ ] Redução de 30% no lead time de produção
- [ ] Acurácia > 85% no planejamento automático
- [ ] Redução de 20% no estoque em processo

### Fase 4
- [ ] OEE > 85% em equipamentos monitorados
- [ ] Redução de 50% em não conformidades
- [ ] On-time delivery > 95%

---

*Este documento será atualizado conforme o desenvolvimento avança. As fases podem ser ajustadas com base no feedback e nas necessidades identificadas durante a implementação.*