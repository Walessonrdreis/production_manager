# Módulo: customer-sync

Sincronização de clientes entre Omie ERP e o banco local (`omie_customer`).

## Arquitetura

```
HTTP (Fastify) → UseCase → Gateway (real/fake) → Omie API
                                    ↓
                             OmieCustomerStore (omie_customer)
                             CustomerCommandStore (customer_command)
```

## Rotas

### Comandos

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/v1/integration/customer-sync/commands/sync` | Sincroniza 1 cliente (customerCode no body) |
| POST | `/v1/integration/customer-sync/commands/sync-global` | Sincroniza todos os clientes |

### Leitura (Admin/API2)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/admin/read/customers` | Lista/busca clientes (paginado) |
| GET | `/v1/admin/read/customers/:customerCode` | Busca 1 cliente por código |
| GET | `/v1/admin/read/customers/stats` | Estatísticas (total, ativos, inativos) |
| GET | `/v1/integration/customer-sync/read/summary` | Sumário de clientes ativos |

#### Query params — GET /v1/admin/read/customers

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `q` | string | Busca por nome, código, CNPJ/CPF ou fantasia |
| `activeOnly` | boolean | `true` = apenas clientes ativos |
| `limit` | number | Máx. itens (default: 100) |
| `offset` | number | Deslocamento |

### Sync (integração)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/v1/integration/customer-sync/commands/:externalRequestId` | Status de um comando |
| GET | `/v1/integration/customer-sync/read/sync-history` | Histórico de comandos |
| GET | `/v1/integration/customer-sync/read/sync-failures` | Falhas de sincronização |
| GET | `/v1/integration/customer-sync/read/last-sync` | Último sync global |

## Variáveis de Ambiente

```env
CUSTOMER_SYNC_GATEWAY=fake|real        # fake = não escreve dados reais
ENABLE_OMIE_CUSTOMER_SYNC_JOB=true|false # habilita job cron
OMIE_CUSTOMER_SYNC_CRON=0 */12 * * *     # cron schedule
```

## Estrutura de Diretórios

```
customer-sync/
├── index.ts
├── customer-sync-integration-register.ts
├── README.md
├── application/
│   ├── dto/
│   │   ├── sync-customer.dto.ts
│   │   ├── sync-all-customers.dto.ts
│   │   ├── get-customer-read-model.dto.ts
│   │   └── get-customer-stats.dto.ts
│   ├── mappers/
│   │   └── map-omie-customer-to-summary.ts
│   ├── ports/
│   │   ├── customer-fetch.gateway.ts
│   │   └── customer-fetch-page.gateway.ts
│   ├── use-cases/
│   │   ├── sync-customer.usecase.ts
│   │   ├── sync-all-customers.usecase.ts
│   │   ├── get-customer-read-model.usecase.ts
│   │   ├── get-customer-summary.usecase.ts
│   │   └── get-customer-stats.usecase.ts
│   └── utils/
│       └── query.utils.ts
├── infrastructure/
│   ├── db/
│   │   ├── index.ts
│   │   ├── omie-customer.store.ts
│   │   └── customer-command.store.ts
│   ├── gateways/
│   │   ├── customer-fetch/
│   │   │   ├── real-customer-fetch.gateway.ts
│   │   │   └── fake-customer-fetch.gateway.ts
│   │   └── customer-fetch-page/
│   │       ├── real-customer-fetch-page.gateway.ts
│   │       └── fake-customer-fetch-page.gateway.ts
│   └── jobs/
│       └── customer-jobs.register.ts
└── presentation/
    └── http/
        ├── index.ts
        ├── routes.ts
        └── routes/
            ├── commands/
            │   ├── sync-customer.route.ts
            │   └── sync-all-customers.route.ts
            └── read/
                ├── get-customer-read-model.route.ts
                ├── get-customer-sync-status.route.ts
                ├── get-customer-sync-history.route.ts
                ├── get-customer-sync-failures.route.ts
                ├── get-customer-stats.route.ts
                ├── get-customer-last-sync.route.ts
                └── get-customer-summary.route.ts
```

## Modelos Prisma

- `OmieCustomer` (`omie_customer`) — espelho local dos clientes
- `CustomerCommand` (`customer_command`) — command store com idempotência
- `CustomerSyncState` (`customer_sync_state`) — estado do último sync global

## 🚀 Exemplos práticos (curl)

### Sync de 1 cliente

```bash
curl -X POST "http://localhost:3333/v1/integration/customer-sync/commands/sync" \
  -H "Content-Type: application/json" \
  -d '{"externalRequestId": "manual-cliente-001", "customerCode": "9428243340"}'
```

### Sync global de clientes

```bash
curl -X POST "http://localhost:3333/v1/integration/customer-sync/commands/sync-global" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Listar/buscar clientes

```bash
curl "http://localhost:3333/v1/admin/read/customers?q=chocolate&activeOnly=true&limit=5"
```

### Cliente específico

```bash
curl "http://localhost:3333/v1/admin/read/customers/9428243340"
```

### Estatísticas

```bash
curl "http://localhost:3333/v1/admin/read/customers/stats"
```

### Sumário para API2

```bash
curl "http://localhost:3333/v1/integration/customer-sync/read/summary"
```

### Status de um comando

```bash
curl "http://localhost:3333/v1/integration/customer-sync/commands/meu-request-id-123"
```

### Último sync global

```bash
curl "http://localhost:3333/v1/integration/customer-sync/read/last-sync"
```
