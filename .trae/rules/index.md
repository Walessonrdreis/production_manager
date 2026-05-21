---
alwaysApply: true
---
# REGRAS DO PROJETO - ÍNDICE

## 📋 REGRAS PRINCIPAIS

### 0. [TRAE AGENT PROTOCOL](./TRAE_AGENT_PROTOCOL.md)
- Segurança e confiabilidade
- Integridade de código
- Comunicação eficiente

### 1. [TDD PRINCÍPIOS](./tdd-principios.md)
- Desenvolvimento guiado por testes
- Ciclo RED-GREEN-REFACTOR obrigatório
- Testes antes do código

### 2. [SRP GRANULARIDADE](./srp-granularidade.md)
- 1 arquivo = 1 intenção
- Padrão Verbo + Objeto para nomes
- Crescimento orgânico com fragmentação

### 3. [ARQUITETURA MODULAR](./arquitetura-modular.md)
- Manter estrutura Clean Architecture atual
- Organização por módulos independentes
- Evolução gradual da arquitetura

### 4. [QUALIDADE CÓDIGO](./qualidade-codigo.md)
- Sem quebras de compilação
- Verificação contínua de logs
- Trabalhos curtos e focados

### 5. [TESTES ESTRATÉGIA](./testes-estrategia.md)
- Pirâmide de testes (70% unitários)
- Mocks minimalistas
- Cobertura inteligente

### 6. [GIT WORKFLOW](./git-workflow.md)
- Mensagens de commit padronizadas
- Branch strategy definida
- Commits atômicos

## 🏗️ ESTRUTURA ATUAL

### 7. [ESTRUTURA ATUAL](./estrutura-atual.md)
- Manter compatibilidade com código existente
- Evoluir gradualmente sem reescritas
- Preservar APIs públicas

## 🚀 ETAPA 2 IMPLEMENTAÇÃO

### 8. [ETAPA 2 DIRETRIZES](./etapa-2-diretrizes.md)
- Polling inteligente (estoque: 2min, pedidos: 1min, produção: 30s)
- Cache multi-nível (memória → Redis → banco)
- Dashboard tempo real com WebSocket
- Sistema de alertas automáticos

## 📝 REGRAS EXISTENTES

### 9. [REGRAS DE RESPOSTAS](./regras-de-respostas.md)
- Não quebrar compilação
- Confirmar antes de mudanças críticas
- Trabalho incremental obrigatório


### 11. [GIT COMMIT MESSAGE](./git-commit-message.md)
- Formato: `tipo(escopo): descrição`
- Tipos: feat, fix, docs, style, refactor, test, chore

## 📊 PRINCÍPIOS GERAIS

### **TDD É PRIMORDIAL**
- Nunca escrever código sem teste
- Ciclos curtos de desenvolvimento
- Refatoração contínua

### **GRANULARIDADE EXTREMA**
- Dividir arquivos ao primeiro sinal de complexidade
- Nomes explícitos e descritivos
- Responsabilidade única por arquivo

### **MANUTENIBILIDADE**
- Código limpo e testável
- Documentação mínima mas eficaz
- Evolução gradual sem reescritas

## 🔄 FLUXO DE TRABALHO

1. **ESCREVER TESTE** que falha (RED)
2. **IMPLEMENTAR MÍNIMO** para passar (GREEN)
3. **REFATORAR** mantendo testes verdes
4. **VERIFICAR LOGS** e corrigir erros
5. **COMMIT PEQUENO** com mensagem clara
6. **REPETIR** para próxima funcionalidade

## ⚠️ SINAIS DE ALERTA
- Teste precisa de muitos mocks → arquivo grande
- Dificuldade para nomear arquivo → responsabilidade confusa
- Compilação quebrada → corrigir imediatamente
- Logs com erros → parar e corrigir

---

**ÚLTIMA ATUALIZAÇÃO**: 2026-05-09  
**VERSÃO**: 1.1  
**PRÓXIMA REVISÃO**: 2026-06-09