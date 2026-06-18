---
alwaysApply: false
scene: git_message
---
# GIT WORKFLOW - COMMITS E BRANCHES

## REGRA 1: MENSAGENS DE COMMIT
- Formato: `tipo(escopo): descrição`
- Tipos: feat, fix, docs, style, refactor, test, chore
- Exemplo: `feat(production): add real-time stock monitoring`

## REGRA 2: BRANCH STRATEGY
- `main`: produção estável
- `develop`: integração contínua
- `feature/*`: novas funcionalidades
- `fix/*`: correções de bugs
- `hotfix/*`: correções urgentes

## REGRA 3: COMMITS ATOMICO
- Cada commit implementa uma mudança única
- Commits pequenos e focados
- Fácil de reverter se necessário

## REGRA 4: PULL REQUESTS
- Revisão de código obrigatória
- Todos os testes devem passar
- Code coverage mantido ou melhorado
- Documentação atualizada

## REGRA 5: MERGE STRATEGY
- Squash commits em feature branches
- Rebase antes de merge para main
- Manter histórico limpo e linear

## REGRA 6: VERSIONAMENTO SEMÂNTICO
- `MAJOR`: breaking changes
- `MINOR`: novas funcionalidades compatíveis
- `PATCH`: correções de bugs

## REGRA 7: GIT HOOKS
- Pre-commit: lint e formatação
- Pre-push: testes unitários
- Commit-msg: validação de formato

## REGRA 8: DEPLOY AUTOMÁTICO
- CI/CD integrado com Git
- Deploy automático após merge em main
- Rollback automático em caso de falha