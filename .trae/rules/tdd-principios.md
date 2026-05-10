---
alwaysApply: true
scene: development
---

# PRINCÍPIOS TDD - DESENVOLVIMENTO GUIADO POR TESTES

## REGRA 1: CICLO TDD OBRIGATÓRIO
1. **RED**: Escrever teste que falha
2. **GREEN**: Implementar mínimo para passar
3. **REFACTOR**: Melhorar código mantendo testes verdes

## REGRA 2: TESTES ANTES DO CÓDIGO
- Nunca escrever código sem teste primeiro
- Testes definem comportamento esperado
- Código existe apenas para passar testes

## REGRA 3: TESTES UNITÁRIOS PRIMEIRO
1. Testes unitários para lógica de negócio
2. Testes de integração para APIs/database
3. Testes E2E apenas para fluxos críticos

## REGRA 4: MOCKS MINIMALISTAS
- Se precisa de muitos mocks, arquivo está grande
- Cada mock = responsabilidade extra
- Refatorar quando mocks > 3 por teste

## REGRA 5: COBERTURA DE TESTES
- 80%+ cobertura para código de produção
- 100% para lógica crítica (estoque, produção)
- Testes devem ser rápidos (< 2s cada)

## REGRA 6: REFATORAÇÃO CONTÍNUA
- Refatorar após cada ciclo TDD
- Manter código limpo e testável
- Remover duplicação imediatamente

## REGRA 7: VERIFICAÇÃO DE LOGS
- Verificar logs após cada implementação
- Corrigir erros antes de continuar
- Logs claros para debugging