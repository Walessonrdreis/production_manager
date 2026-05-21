---
alwaysApply: true
scene: development
---
# QUALIDADE DE CÓDIGO - PADRÕES ESSENCIAIS

## REGRA 1: SEM QUEBRAS DE COMPILAÇÃO
- Nunca commitar código que não compila
- Verificar TypeScript antes de cada commit
- Corrigir erros imediatamente

## REGRA 2: VERIFICAÇÃO DE LOGS
- Monitorar logs após cada mudança
- Logs claros e informativos
- Corrigir warnings e erros antes de continuar

## REGRA 3: TAMANHO DE TRABALHO
- Trabalhos curtos e focados
- Máximo 2-3 horas por tarefa
- Commits pequenos e frequentes

## REGRA 4: PADRÕES DE CÓDIGO
- TypeScript estrito (noImplicitAny, strictNullChecks)
- ESLint configurado e aplicado
- Prettier para formatação consistente

## REGRA 5: DOCUMENTAÇÃO MÍNIMA
- Documentar APIs públicas
- README por módulo explicando responsabilidade
- Comentários apenas para lógica complexa

## REGRA 6: REVIEW DE CÓDIGO
- Auto-review antes de commitar
- Verificar acoplamento e coesão
- Garantir que testes cobrem casos de borda

## REGRA 7: DEPLOY CONTÍNUO
- CI/CD configurado e funcionando
- Testes automatizados em pipeline
- Deploy apenas após todos os testes passarem

## REGRA 8: MONITORAMENTO
- Métricas de performance coletadas
- Alertas para problemas críticos
- Dashboard com status do sistema