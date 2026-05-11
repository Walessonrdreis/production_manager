# Sales → Production Integration Module

Este módulo implementa a integração automática entre vendas e produção, permitindo que pedidos de venda sejam automaticamente adicionados à fila de produção.

## Funcionalidades

1. **Integração Automática**: Adiciona automaticamente pedidos de venda à fila de produção
2. **Regras de Negócio**: Aplica regras de prioridade baseadas no tipo de cliente e valor do pedido
3. **Validação**: Verifica se o pedido já está na fila antes de adicionar
4. **Logs Detalhados**: Registra todas as operações de integração

## Endpoints

### POST /api/integration/sales-to-production
Adiciona um pedido de venda à fila de produção.

**Request Body:**
```json
{
  "orderId": "string (UUID)",
  "customerType": "regular | vip | corporate",
  "orderValue": "number",
  "notes": "string (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string (UUID)",
    "orderId": "string (UUID)",
    "priority": "high | medium | low",
    "status": "pending",
    "position": "number",
    "estimatedStartDate": "string (ISO date)",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)"
  },
  "message": "string"
}
```

## Regras de Prioridade

1. **Alta Prioridade (high)**:
   - Clientes VIP
   - Pedidos com valor > R$ 10.000
   - Pedidos com prazo de entrega < 48h

2. **Média Prioridade (medium)**:
   - Clientes corporativos
   - Pedidos com valor entre R$ 1.000 e R$ 10.000
   - Pedidos com prazo de entrega entre 48h e 7 dias

3. **Baixa Prioridade (low)**:
   - Clientes regulares
   - Pedidos com valor < R$ 1.000
   - Pedidos com prazo de entrega > 7 dias

## Dependências

- `production-queue`: Para adicionar itens à fila de produção
- `omie-sales-orders`: Para validar se o pedido existe
- `shared/services/IntelligentPollingService`: Para polling de novos pedidos

## Jobs

### sales-to-production-integration.job.ts
Job que executa periodicamente para:
1. Buscar novos pedidos de venda
2. Aplicar regras de prioridade
3. Adicionar à fila de produção
4. Registrar logs de integração

## Configuração

```typescript
// polling.config.ts
export const SALES_PRODUCTION_INTEGRATION_POLLING_INTERVAL = 30000; // 30 segundos
export const SALES_PRODUCTION_INTEGRATION_MAX_RETRIES = 3;
```

## Testes

- **Unitários**: Testes para regras de prioridade e validações
- **Integração**: Testes para endpoints e integração com outros módulos
- **E2E**: Testes completos do fluxo vendas→produção