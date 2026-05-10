# Módulo Sync

Módulo responsável pela sincronização de dados entre sistemas externos (Omie) e a plataforma interna.

## Funcionalidades

### Endpoints de Sincronização

1. **POST /api/sync/stock** - Sincroniza estoque do Omie
   - Busca informações de estoque atualizadas
   - Atualiza banco de dados interno
   - Retorna status da sincronização

2. **POST /api/sync/orders** - Sincroniza pedidos de venda
   - Busca pedidos do Omie
   - Processa e armazena pedidos
   - Retorna status da sincronização

3. **GET /api/sync/status** - Status das sincronizações
   - Última execução de cada job
   - Estatísticas de sucesso/falha
   - Próxima execução agendada

### Características Técnicas

- **Polling inteligente**: Intervalos dinâmicos baseados em criticidade
- **Retry com backoff exponencial**: Tolerância a falhas temporárias
- **Circuit breaker**: Prevenção de cascata de falhas
- **Logs detalhados**: Monitoramento completo das operações
- **Configuração via environment**: Flexibilidade de deployment

## Estrutura do Módulo

```
sync/
├── application/           # Lógica de negócio
│   ├── dtos/             # Data Transfer Objects
│   ├── ports/            # Interfaces/Ports
│   └── use-cases/        # Casos de uso
├── infrastructure/       # Implementações concretas
│   ├── db/              # Repositórios de banco de dados
│   ├── integrations/    # Integrações com sistemas externos
│   └── jobs/            # Jobs de sincronização
└── presentation/        # Camada de apresentação
    └── http/            # Controllers, rotas e schemas HTTP
```

## Configuração

### Variáveis de Ambiente

```bash
# Polling intervals (em milissegundos)
SYNC_STOCK_INTERVAL_MS=120000      # 2 minutos
SYNC_ORDERS_INTERVAL_MS=60000      # 1 minuto
SYNC_PRODUCTION_INTERVAL_MS=30000  # 30 segundos

# Retry configuration
SYNC_MAX_RETRIES=3
SYNC_INITIAL_DELAY_MS=1000
SYNC_MAX_DELAY_MS=10000
SYNC_BACKOFF_FACTOR=2
SYNC_JITTER_FACTOR=0.1

# Circuit breaker
SYNC_CIRCUIT_BREAKER_THRESHOLD=5
SYNC_CIRCUIT_BREAKER_RESET_MS=30000
```

### Registro do Módulo

O módulo é registrado automaticamente no bootstrap da aplicação através do arquivo `register.ts`.

## Jobs de Sincronização

### 1. Stock Monitor Job
- **Intervalo**: 2 minutos (configurável)
- **Responsabilidade**: Monitorar estoque crítico
- **Criticidade**: Alta

### 2. Orders Sync Job
- **Intervalo**: 1 minuto (configurável)
- **Responsabilidade**: Sincronizar pedidos de venda
- **Criticidade**: Média

### 3. Production Orders Sync Job
- **Intervalo**: 30 segundos (configurável)
- **Responsabilidade**: Sincronizar ordens de produção
- **Criticidade**: Alta

## Monitoramento

### Métricas Coletadas

1. **Tempo de execução**: Duração de cada sincronização
2. **Taxa de sucesso**: Porcentagem de execuções bem-sucedidas
3. **Falhas consecutivas**: Número de falhas seguidas
4. **Intervalo atual**: Intervalo de polling atual
5. **Tentativas de retry**: Número de tentativas por operação

### Logs

- **INFO**: Início e conclusão de sincronizações
- **WARN**: Falhas com retry automático
- **ERROR**: Falhas críticas que requerem intervenção
- **DEBUG**: Detalhes de execução para troubleshooting

## Testes

### Testes Unitários
- Testes de casos de uso
- Testes de validação
- Testes de configuração

### Testes de Integração
- Testes de endpoints HTTP
- Testes de integração com banco de dados
- Testes de integração com sistemas externos (mocks)

### Testes de Performance
- Tempo de resposta dos endpoints
- Consumo de recursos durante sincronizações
- Escalabilidade com múltiplas execuções concorrentes

## Segurança

### Autenticação
- Todos os endpoints requerem autenticação
- Tokens JWT para autorização
- Controle de acesso baseado em roles

### Rate Limiting
- Limite de requisições por minuto
- Proteção contra abuso
- Monitoramento de padrões suspeitos

## Troubleshooting

### Problemas Comuns

1. **Falhas de conexão com Omie**
   - Verificar credenciais
   - Verificar status da API Omie
   - Ajustar intervalos de retry

2. **Alta latência nas sincronizações**
   - Otimizar queries de banco de dados
   - Ajustar batch sizes
   - Monitorar recursos do servidor

3. **Falhas consecutivas**
   - Verificar logs de erro
   - Verificar configuração do circuit breaker
   - Verificar integridade dos dados

### Monitoramento Proativo

- Alertas para falhas consecutivas
- Alertas para aumento de latência
- Alertas para consumo excessivo de recursos
- Dashboard de status em tempo real