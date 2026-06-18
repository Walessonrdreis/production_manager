---
alwaysApply: false
scene: development
---
# ARQUITETURA MODULAR - ESTRUTURA ATUAL

## REGRA 1: MANTER ESTRUTURA EXISTENTE
- Usar organização atual de módulos
- Seguir padrão Clean Architecture já implementado
- Não reinventar estrutura sem necessidade

## REGRA 2: ORGANIZAÇÃO DE MÓDULOS
```
modules/
├── omie-production-orders/
│   ├── application/
│   ├── infrastructure/
│   └── presentation/
├── omie-sales-orders/
├── orders-enriched/
├── plans/
└── products/
```

## REGRA 3: REGISTRO DE MÓDULOS
- Cada módulo tem `index.ts` e `register.ts`
- `register.ts` configura dependências do módulo
- `index.ts` exporta componentes públicos

## REGRA 4: DEPENDÊNCIAS ENTRE MÓDULOS
- Módulos independentes quando possível
- Usar ports/interfaces para comunicação
- Evitar acoplamento direto entre módulos

## REGRA 5: INFRAESTRUTURA COMPARTILHADA
- `shared/` contém código comum
- `infra/` configuração de infraestrutura
- `config/` variáveis de ambiente

## REGRA 6: BOOTSTRAP DA APLICAÇÃO
- `bootstrap/` inicializa aplicação
- Configura plugins, middlewares, jobs
- Registra todos os módulos

## REGRA 7: EVOLUÇÃO DA ARQUITETURA
- Melhorar gradualmente, não reescrever
- Manter compatibilidade com código existente
- Documentar mudanças arquiteturais