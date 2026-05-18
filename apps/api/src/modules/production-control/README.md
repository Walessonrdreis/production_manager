# Módulo `production-control`

## 🎯 Objetivo do módulo

Criar uma **camada de acompanhamento** sobre o endpoint legado `/v1/admin/orders/stage20/totals/detailed` para:

- Acompanhar o que está sendo produzido
- Permitir controle manual via checklists
- Registrar datas e histórico
- **Não interferir** nas regras de negócio das ordens

## 🧱 Padrão arquitetural

Seguindo a estrutura modular Clean Architecture já estabelecida no projeto:

```
production-control/
├── application/          # Regras de negócio
│   ├── dtos/            # Data Transfer Objects
│   ├── entities/        # Entidades de domínio
│   ├── ports/           # Interfaces/contratos
│   ├── services/        # Serviços de aplicação
│   └── use-cases/       # Casos de uso
├── infrastructure/      # Implementações concretas
│   ├── db/             # Repositórios Prisma
│   ├── integrations/   # Integrações externas
│   └── jobs/           # Jobs agendados
└── presentation/       # Interface com usuário/externo
    └── http/           # Controllers, routes, schemas
```

## ✅ Status da estrutura (template)

- [x] Diretórios criados
- [ ] Entidades de domínio
- [ ] DTOs
- [ ] Ports/interfaces
- [ ] Serviços
- [ ] Use Cases
- [ ] Repositórios Prisma
- [ ] Integrações
- [ ] Jobs
- [ ] Controller
- [ ] Routes
- [ ] Schemas

## 📋 Funcionalidades

### 1. Listagem de Produtos
- Consumir endpoint legado `/v1/admin/orders/stage20/totals/detailed`
- Exibir `description` e `totalQuantity` (quantidade pendente)

### 2. Detalhes do Produto
- Listar pedidos: `orderNumber`, `clientName`, `quantity`

### 3. Controle Manual (Checks)
- **Pedido**: Check marca como totalmente produzido, subtrai do pendente
- **Produto**: Check marca todos os pedidos, permite marcar/desmarcar

### 4. Estados de Produção
- Pendente
- Em produção
- Concluído

### 5. Datas de Produção
- Data programada (opcional, editável)
- Data realizada (opcional, editável)

### 6. Snapshots
- Cada ciclo de leitura relevante gera um Snapshot com ID único
- Produtos com mesma `description` em snapshots diferentes são controles distintos

### 7. Conclusão Automática
- Se pedido estava no snapshot anterior e não aparece mais no endpoint → CONCLUÍDO
- Registrar data/hora do servidor
- Salvar evento no histórico

### 8. Histórico
- Registrar todas as ações (marcar/desmarcar, alterações de datas, conclusões automáticas)
- Consultável posteriormente

## 🔗 Dependências

- `omie-sales-orders`: Para consumir endpoint legado
- `@prisma/client`: Para acesso ao banco de dados
- `fastify`: Para rotas HTTP

## 🚀 Integração

O módulo será integrado com o job existente `omie-orders-stage20.job.ts` para criar snapshots quando detectar mudanças no endpoint legado.

## ⚠️ Limitações (MVP)

- Não altera regras de negócio das ordens
- Endpoint legado é soberano
- Controle apenas de acompanhamento
- Sem validações complexas de datas