# Módulo de Alertas de Estoque

Este módulo faz parte da **API Core - Fase 2** e fornece endpoints para gerenciamento de alertas de estoque crítico.

## 📋 Endpoints Disponíveis

### 1. Listar Alertas de Estoque
**GET** `/api/alerts/stock`

Lista alertas de estoque com filtros opcionais.

**Parâmetros de Consulta:**
- `page` (opcional, padrão: 1) - Número da página
- `pageSize` (opcional, padrão: 20, máximo: 100) - Itens por página
- `severity` (opcional) - Severidade do alerta: `critical`, `warning`, `info`
- `resolved` (opcional) - Status de resolução: `true` ou `false`
- `productCode` (opcional) - Código do produto
- `dateFrom` (opcional) - Data inicial (ISO 8601)
- `dateTo` (opcional) - Data final (ISO 8601)

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "productCode": "PROD001",
        "productDescription": "Produto Exemplo",
        "currentStock": 50.5,
        "minimumStock": 100,
        "severity": "critical",
        "status": "active",
        "createdAt": "2024-01-01T12:00:00Z",
        "resolvedAt": null,
        "metadata": {}
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "statistics": {
      "critical": 10,
      "warning": 5,
      "info": 2,
      "active": 15,
      "resolved": 2,
      "acknowledged": 0
    }
  },
  "message": "Alertas de estoque recuperados com sucesso"
}
```

### 2. Listar Alertas Críticos de Estoque
**GET** `/api/alerts/stock/critical`

Lista apenas alertas críticos de estoque não resolvidos.

**Parâmetros de Consulta:**
- `page` (opcional, padrão: 1) - Número da página
- `pageSize` (opcional, padrão: 20, máximo: 100) - Itens por página
- `productCode` (opcional) - Código do produto
- `dateFrom` (opcional) - Data inicial (ISO 8601)
- `dateTo` (opcional) - Data final (ISO 8601)

### 3. Configurar Regras de Alertas
**POST** `/api/alerts/stock/configure`

Configura limites e canais de notificação para alertas de estoque.

**Corpo da Requisição:**
```json
{
  "productCode": "PROD001",
  "criticalThreshold": 10,
  "warningThreshold": 25,
  "notificationChannels": ["email", "dashboard"],
  "autoResolveDays": 7
}
```

**Parâmetros:**
- `productCode` (opcional) - Código do produto (aplica-se a todos se não especificado)
- `criticalThreshold` (opcional) - Limite para alertas críticos
- `warningThreshold` (opcional) - Limite para alertas de aviso
- `notificationChannels` (opcional) - Canais de notificação: `email`, `sms`, `dashboard`
- `autoResolveDays` (opcional) - Dias para auto-resolução de alertas

### 4. Atualizar Status do Alerta
**PATCH** `/api/alerts/stock/{id}/status`

Atualiza o status de um alerta específico.

**Parâmetros do Caminho:**
- `id` (obrigatório) - ID do alerta (UUID)

**Corpo da Requisição:**
```json
{
  "status": "resolved",
  "notes": "Estoque reposto"
}
```

**Parâmetros:**
- `status` (obrigatório) - Novo status: `resolved` ou `acknowledged`
- `notes` (opcional) - Notas sobre a mudança de status

### 5. Obter Estatísticas de Alertas
**GET** `/api/alerts/stock/statistics`

Retorna estatísticas sobre alertas de estoque.

**Parâmetros de Consulta:**
- `severity` (opcional) - Severidade do alerta: `critical`, `warning`, `info`
- `resolved` (opcional) - Status de resolução: `true` ou `false`
- `productCode` (opcional) - Código do produto
- `dateFrom` (opcional) - Data inicial (ISO 8601)
- `dateTo` (opcional) - Data final (ISO 8601)

## 🏗️ Arquitetura

O módulo segue a **Clean Architecture** com separação clara de responsabilidades:

```
alerts/
├── application/
│   ├── dtos/                    # Data Transfer Objects
│   ├── entities/                # Entidades de domínio
│   ├── ports/                   # Interfaces (contratos)
│   └── use-cases/               # Casos de uso
├── infrastructure/
│   └── db/                      # Implementações de repositório
└── presentation/
    └── http/                    # Controllers e rotas
```

## 🔧 Casos de Uso

### 1. ListStockAlertsUseCase
- **Responsabilidade**: Listar alertas de estoque com filtros e paginação
- **Entrada**: `StockAlertsRequest` com parâmetros de filtro
- **Saída**: `StockAlertsResponse` com alertas e estatísticas

### 2. ConfigureAlertsUseCase
- **Responsabilidade**: Configurar regras de alertas
- **Entrada**: `AlertConfigRequest` com configurações
- **Saída**: `AlertConfigResponse` com configuração salva

### 3. UpdateAlertStatusUseCase
- **Responsabilidade**: Atualizar status de um alerta
- **Entrada**: ID do alerta e `AlertStatusRequest`
- **Saída**: `AlertStatusResponse` com alerta atualizado

## 🗄️ Modelos de Dados

### StockAlert
```typescript
interface StockAlert {
  id: string;                    // UUID
  productCode: string;           // Código do produto
  productDescription: string;    // Descrição do produto
  currentStock: number;          // Estoque atual
  minimumStock: number;          // Estoque mínimo
  severity: "critical" | "warning" | "info";
  status: "active" | "resolved" | "acknowledged";
  createdAt: Date;               // Data de criação
  resolvedAt?: Date;            // Data de resolução
  metadata?: Record<string, any>; // Metadados adicionais
}
```

### AlertConfig
```typescript
interface AlertConfig {
  id: string;                    // UUID
  productCode?: string;          // Código do produto (opcional)
  criticalThreshold: number;    // Limite crítico
  warningThreshold: number;     // Limite de aviso
  notificationChannels: string[]; // Canais de notificação
  autoResolveDays: number;       // Dias para auto-resolução
  createdAt: Date;              // Data de criação
  updatedAt: Date;              // Data de atualização
}
```

## 🧪 Testes

O módulo inclui testes unitários para todos os casos de uso:

```bash
# Executar testes do módulo de alertas
npm test -- alerts

# Executar testes com cobertura
npm run test:coverage -- alerts
```

## 🔄 Integração com Sistema de Polling

Os alertas são gerados automaticamente pelo sistema de polling inteligente:

1. **Job de Monitoramento**: Executa a cada 2 minutos
2. **Verificação de Estoque**: Compara estoque atual com limites configurados
3. **Geração de Alertas**: Cria alertas para produtos abaixo dos limites
4. **Notificações**: Envia notificações pelos canais configurados

## 📊 Exemplos de Uso

### 1. Monitorar Estoque Crítico
```bash
# Listar alertas críticos não resolvidos
curl "http://localhost:3000/api/alerts/stock/critical"

# Configurar limites para um produto específico
curl -X POST "http://localhost:3000/api/alerts/stock/configure" \
  -H "Content-Type: application/json" \
  -d '{
    "productCode": "PROD001",
    "criticalThreshold": 10,
    "warningThreshold": 25,
    "notificationChannels": ["email", "dashboard"]
  }'
```

### 2. Dashboard de Monitoramento
```bash
# Obter estatísticas para dashboard
curl "http://localhost:3000/api/alerts/stock/statistics"

# Filtrar por período
curl "http://localhost:3000/api/alerts/stock/statistics?dateFrom=2024-01-01T00:00:00Z&dateTo=2024-01-31T23:59:59Z"
```

## 🚨 Cenários de Alerta

### 1. Estoque Crítico
- **Condição**: `currentStock < criticalThreshold`
- **Severidade**: `critical`
- **Ação**: Notificação imediata por todos os canais configurados

### 2. Estoque de Aviso
- **Condição**: `currentStock < warningThreshold`
- **Severidade**: `warning`
- **Ação**: Notificação por canais configurados

### 3. Informação
- **Condição**: Mudanças significativas no estoque
- **Severidade**: `info`
- **Ação**: Registro para histórico

## 📈 Métricas

O módulo fornece as seguintes métricas:

1. **Total de Alertas**: Número total de alertas gerados
2. **Alertas por Severidade**: Distribuição por criticidade
3. **Taxa de Resolução**: Tempo médio para resolução
4. **Alertas por Produto**: Frequência por produto

## 🔗 Dependências

- **Prisma**: ORM para acesso ao banco de dados
- **Zod**: Validação de schemas
- **Fastify**: Framework HTTP

## 📝 Notas de Implementação

1. **Validação**: Todos os endpoints usam Zod para validação
2. **Paginação**: Suporte a paginação em endpoints de listagem
3. **Filtros**: Filtros flexíveis por severidade, status e período
4. **Estatísticas**: Métricas em tempo real sobre alertas
5. **Auditoria**: Registro completo de alterações