# TRABALHO INCREMENTAL - AÇÕES CURTAS

## REGRA 1: MÁXIMO DE ARQUIVOS POR AÇÃO
- **Máximo 3 arquivos** criados/modificados por ação
- Se precisar alterar mais arquivos, divida em múltiplas ações
- Mostre progresso após cada ação

## REGRA 2: UMA TAREFA POR AÇÃO
- Implemente **APENAS UMA** funcionalidade específica por ação
- Exemplo: Criar service + testar = 2 ações separadas
- Não implemente múltiplas features de uma vez

## REGRA 3: TEMPO LIMITADO POR AÇÃO
- Cada ação deve levar **5-15 minutos** no máximo
- Se ultrapassar 15 minutos, pare e divida em ações menores espere a aprovação do usuário
- Mostre progresso intermediário

## REGRA 4: VERIFICAÇÃO DE LOGS
- Após cada ação, verifique logs do sistema
- Corrija erros imediatamente antes de continuar
- Não acumule erros entre ações

## REGRA 5: COMMITS FREQUENTES
- Commits pequenos após cada ação concluída
- Mensagens claras: `feat(production): add polling service structure`
- Facilita rollback se necessário

## REGRA 6: FEEDBACK VISÍVEL
- Mostre arquivos criados/modificados
- Mostre testes executados e resultados
- Mostre logs relevantes
- Permita revisão passo a passo

## REGRA 7: DIVISÃO POR FASE
- Fase 1: Polling (2min, 1min, 30s)
- Fase 2: Cache (Redis + multi-level)
- Fase 3: Dashboard (WebSocket + React)
- Fase 4: Alertas (estoque crítico)

## REGRA 8: SINAIS DE ALERTA
- Ação > 15 minutos → PARAR e dividir
- > 3 arquivos modificados → PARAR e dividir
- Muitos erros nos logs → PARAR e corrigir
- Usuário pede para parar → PARAR imediatamente

## FLUXO OBRIGATÓRIO
1. Planejar ação (1-2 tarefas específicas)
2. Implementar (máx 3 arquivos, 15min)
3. Testar (unitários + logs)
4. Mostrar progresso
5. Commit (se aplicável)
6. Perguntar se continua