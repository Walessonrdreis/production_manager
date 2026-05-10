# Módulo de Monitoramento de Estoque

Este módulo é responsável pelo monitoramento inteligente de estoque com polling dinâmico baseado em criticidade.

## Funcionalidades

- **Monitoramento de estoque crítico**: Detecção automática de produtos com estoque abaixo do limite mínimo
- **Polling adaptativo**: Intervalos de polling ajustados dinamicamente baseado em sucessos/falhas
- **Alertas automáticos**: Notificações para estoque crítico
- **Métricas em tempo real**: KPIs de estoque e disponibilidade

## Configuração

### Variáveis de Ambiente

```bash
# Habilitar monitoramento de estoque
STOCK_MONITOR_ENABLED=true

# Intervalo base de polling (em milissegundos)
STOCK_MONITOR_BASE_INTERVAL_MS=120000  # 2 minutos

# Intervalo máximo de polling (em milissegundos)
STOCK_MONITOR_MAX_INTERVAL_MS=1800000  # 30 minutos
```

### Configurações Padrão

- **Intervalo base**: 2 minutos
- **Intervalo máximo**: 30 minutos
- **Criticidade**: Média
- **Polling adaptativo**: Habilitado

## Uso

### Inicialização

```typescript
import { startStockMonitorJob } from "@/modules/stock-monitor/infrastructure/jobs/stock-monitor.job";

// Iniciar job de monitoramento de estoque
const stopJob = startStockMonitorJob(app);
```

### Métricas

O serviço fornece métricas em tempo real:

```typescript
import { getStockMonitorService } from "@/modules/stock-monitor";

const service = getStockMonitorService();
const metrics = service.getServiceMetrics();
const statuses = service.getAllJobStatuses();
```

## Integração

Este módulo se integra com:

1. **Módulo de Produtos**: Para obter informações de estoque
2. **Sistema de Alertas**: Para notificações de estoque crítico
3. **Dashboard**: Para visualização em tempo real

## Testes

```bash
# Executar testes unitários
pnpm test -- stock-monitor

# Executar testes de integração
pnpm test -- stock-monitor.integration
```