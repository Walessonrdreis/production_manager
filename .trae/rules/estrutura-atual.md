---
alwaysApply: false
scene: development
---
# ESTRUTURA ATUAL - DIRETRIZES

## ORGANIZAÇÃO EXISTENTE
```
apps/api/src/
├── bootstrap/          # Inicialização da aplicação
├── config/            # Configurações de ambiente
├── contracts/         # Contratos de API pública
├── infra/             # Infraestrutura compartilhada
├── legacy/            # Código legado (manter compatibilidade)
├── lib/               # Utilitários compartilhados
├── modules/           # Módulos de negócio
└── shared/            # Código comum entre módulos
```

## REGRA 1: MANTER COMPATIBILIDADE
- Não quebrar APIs existentes sem necessidade
- Manter backward compatibility
- Usar versionamento para mudanças breaking

## REGRA 2: EVOLUÇÃO DOS MÓDULOS
- Expandir módulos existentes, não criar novos sem necessidade
- Seguir padrão Clean Architecture já implementado
- Manter separação de camadas (presentation/application/infrastructure)

## REGRA 3: LEGACY CODE
- `legacy/` contém código antigo
- Refatorar gradualmente quando necessário
- Manter funcionamento durante transições

## REGRA 4: SHARED CODE
- `shared/` para código comum entre módulos
- Evitar duplicação
- Manter interfaces limpas e documentadas

## REGRA 5: INFRAESTRUTURA
- `infra/` configura serviços externos
- Prisma, Redis, WebSocket configurados aqui
- Manter configurações centralizadas

## REGRA 6: BOOTSTRAP
- `bootstrap/` inicializa aplicação
- Configura plugins, middlewares, jobs
- Não modificar sem entender impacto

## REGRA 7: MIGRAÇÕES
- Usar Prisma migrations para schema changes
- Testar migrations em ambiente de staging
- Manter rollback scripts

## REGRA 8: DEPLOY
- Seguir processo de deploy existente
- Manter compatibilidade com infraestrutura atual
- Testar em staging antes de produção

## MELHORIAS PERMITIDAS
1. **Otimizar polling intervals** (estoque: 2min, pedidos: 1min, produção: 30s)
2. **Adicionar Redis cache** multi-nível
3. **Implementar WebSocket** para tempo real
4. **Criar dashboard** React com atualizações automáticas
5. **Adicionar sistema de alertas** para estoque crítico

## RESTRIÇÕES
- Não reescrever arquitetura sem discussão
- Manter testes existentes funcionando
- Preservar APIs públicas existentes
- Seguir padrões de nomenclatura estabelecidos