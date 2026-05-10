---
alwaysApply: true
scene: git_message
---

# FORMATO DE MENSAGENS DE COMMIT

## ESTRUTURA OBRIGATÓRIA
```
tipo(escopo): descrição breve

corpo opcional

rodapé opcional
```

## TIPOS PERMITIDOS
- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Documentação
- **style**: Formatação, ponto-e-vírgula
- **refactor**: Refatoração sem mudança funcional
- **test**: Adição ou correção de testes
- **chore**: Tarefas de manutenção

## ESCOPOS COMUNS
- `production`: Gestão de produção
- `stock`: Controle de estoque
- `orders`: Pedidos de venda
- `dashboard`: Interface de monitoramento
- `api`: Endpoints públicos
- `infra`: Infraestrutura
- `config`: Configurações

## EXEMPLOS

### Nova funcionalidade
```
feat(production): add real-time order queue system
```

### Correção de bug
```
fix(stock): resolve negative stock calculation
```

### Refatoração
```
refactor(api): extract Omie client to separate service
```

### Testes
```
test(production): add unit tests for queue processor
```

### Documentação
```
docs(dashboard): update API reference
```

## REGRAS
1. **Descrição**: Máximo 50 caracteres, imperativo
2. **Corpo**: Explicar o que e porquê, não como
3. **Rodapé**: Referências a issues (ex: `Closes #123`)
4. **Idioma**: Português brasileiro
5. **Consistência**: Usar mesmo escopo para funcionalidades relacionadas

## VALIDAÇÃO
- Pré-commit hook valida formato
- Rejeita commits sem tipo válido
- Garante consistência no histórico