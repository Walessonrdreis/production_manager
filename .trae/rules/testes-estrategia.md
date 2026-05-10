---
alwaysApply: true
scene: development
---

# ESTRATÉGIA DE TESTES - PIRÂMIDE TDD

## REGRA 1: PIRÂMIDE DE TESTES
```
       E2E (10%)
      /         \
  Integração (20%)
 /                 \
Unitários (70%)   ← BASE
```

## REGRA 2: TESTES UNITÁRIOS
- Testam lógica de negócio isolada
- Rápidos (< 100ms cada)
- Sem I/O, banco ou rede
- Mock apenas interfaces externas

## REGRA 3: TESTES DE INTEGRAÇÃO
- Testam integração entre componentes
- Banco de dados, APIs externas
- Mais lentos, mas necessários
- Test containers para isolamento

## REGRA 4: TESTES E2E
- Apenas fluxos críticos de negócio
- Simulam usuário real
- Mais lentos e frágeis
- Usar com moderação

## REGRA 5: MOCKS E STUBS
- Mock apenas ports/interfaces
- Stub para dados de teste
- Factory functions para criar objetos
- Evitar mocks complexos

## REGRA 6: COBERTURA INTELIGENTE
- Focar em lógica complexa
- Testar casos de borda
- Ignorar getters/setters simples
- Cobertura funcional > numérica

## REGRA 7: TESTES DE PERFORMANCE
- Testar latência de endpoints
- Verificar consumo de memória
- Monitorar tempo de resposta
- Alertas para degradação

## REGRA 8: TESTES DE REGRESSÃO
- Testes existentes devem sempre passar
- Refatorar testes ao refatorar código
- Manter suite de testes rápida
- Automatizar execução de testes