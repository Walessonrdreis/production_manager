# PROMPT PARA FASE 1 - POLLING INTELIGENTE

## 🎯 CONTEXTO DA FASE
Você está implementando a **Fase 1 da Etapa 2** do projeto Production Manager. O foco é otimizar o polling de dados do Omie para garantir atualização em tempo real dos dados críticos para produção.

## 📋 INSTRUÇÕES PARA O CHAT BUILDER

### O QUE VOCÊ PRECISA FAZER:
1. **Implementar o `IntelligentPollingService`** com polling dinâmico baseado em criticidade
2. **Modificar os jobs existentes** para usar intervalos otimizados
3. **Criar novo job** para monitoramento de estoque
4. **Implementar sistema de retry** inteligente com backoff exponencial
5. **Escrever testes unitários e de integração** completos

### PASSO A PASSO:
1. **Comece criando** `modules/shared/services/IntelligentPollingService.ts`
2. **Atualize os jobs** em seus respectivos módulos
3. **Crie o novo job** `stock-monitor.job.ts`
4. **Implemente o sistema de retry** integrado ao polling
5. **Escreva todos os testes** obrigatórios
6. **Execute os testes** e corrija qualquer erro
7. **Solicite revisão** com `@fase-1-polling`

### REGRAS IMPORTANTES:
- **Siga TDD**: Teste primeiro, implemente depois
- **Granularidade extrema**: 1 arquivo = 1 intenção
- **Configuração via environment**: Nada hardcoded
- **Logs detalhados**: Registre sucessos e falhas

### 🚫 REGRA CRÍTICA: AÇÕES CURTAS E INCREMENTAIS
**NÃO FAÇA TUDO DE UMA VEZ!** Siga estas regras rigorosamente:

#### 📋 REGRAS DE TRABALHO INCREMENTAL (OBRIGATÓRIAS)
1. **Máximo 3 arquivos** criados/modificados por ação
2. **Máximo 15 minutos** por ação
3. **Apenas UMA** funcionalidade específica por ação
4. **Mostre progresso** após cada ação (arquivos, testes, logs)
5. **Pergunte se continua** após cada ação concluída

#### 🔗 REFERÊNCIA COMPLETA
- [Regras de Trabalho Incremental](file:///C:/Users/walll/OneDrive/projects_git/production_manager/.trae/skills/REGRAS_TRABALHO_INCREMENTAL.md)
- [Regras do Projeto](file:///C:/Users/walll/OneDrive/projects_git/production_manager/.trae/rules/index.md)

#### ✅ EXEMPLO DE FLUXO CORRETO (1 ação):
1. **Planejar**: "Vou criar estrutura básica do IntelligentPollingService"
2. **Implementar**: Criar `IntelligentPollingService.ts` (apenas estrutura)
3. **Testar**: Escrever testes unitários básicos
4. **Mostrar**: Mostrar arquivo criado e testes
5. **Perguntar**: "Arquivo criado com sucesso. Devo continuar implementando a lógica?"

#### ❌ EXEMPLO DE FLUXO ERRADO (múltiplas ações juntas):
- Criar service + modificar jobs + configurar Redis + testar tudo de uma vez
- Implementar múltiplas features sem mostrar progresso intermediário
- Trabalhar por mais de 15 minutos sem parar para mostrar progresso

#### 🎯 METAS POR AÇÃO
- **Ideal**: 1-2 arquivos, 1 funcionalidade, 5-15 minutos
- **Aceitável**: 3 arquivos, 1 funcionalidade, até 15 minutos  
- **Proibido**: >3 arquivos, >1 funcionalidade, >15 minutos

## 📊 OBJETIVOS DE NEGÓCIO
1. **Estoque atualizado**: Máximo 2 minutos de atraso
2. **Pedidos vendidos**: Máximo 1 minuto de atraso  
3. **Ordens produção**: Máximo 30 segundos de atraso
4. **Reduzir latência**: Tempo total de polling < 5 segundos
5. **Aumentar confiabilidade**: Sistema de retry inteligente

## 🛠️ TAREFAS ESPECÍFICAS

### TAREFA 1.1: INTELLIGENTPOLLINGSERVICE
Criar `modules/shared/services/IntelligentPollingService.ts` com:
- Polling dinâmico baseado em criticidade
- Configuração de intervalos base e máximo
- Sistema de backoff exponencial
- Circuit breaker para evitar sobrecarga

### TAREFA 1.2: MODIFICAR JOBS EXISTENTES
Atualizar jobs para usar intervalos otimizados:
- `omie-production-orders-sync.job.ts`: 30 segundos
- `omie-orders-stage20.job.ts`: 1 minuto
- Criar `stock-monitor.job.ts`: 2 minutos

### TAREFA 1.3: SISTEMA DE RETRY
Implementar retry inteligente com:
- Backoff baseado em tipo de erro
- Limite configurável de tentativas
- Fallback para dados cacheados
- Logs detalhados de tentativas

## 🧪 TESTES OBRIGATÓRIOS

### TESTES UNITÁRIOS
1. **IntelligentPollingService**
   - Testar ajuste dinâmico de intervalos
   - Testar backoff exponencial
   - Testar circuit breaker

2. **Jobs modificados**
   - Testar execução com novos intervalos
   - Testar compatibilidade com jobs antigos
   - Testar configuração via environment

### TESTES DE INTEGRAÇÃO
1. **Polling completo**
   - Testar fluxo completo de polling
   - Testar retry em falhas
   - Testar fallback para cache

## 📈 MÉTRICAS DE SUCESSO

### OPERACIONAIS
- ✅ Polling completo < 5 segundos
- ✅ 99% de sucesso nas requisições
- ✅ Retry automático para falhas transitórias
- ✅ Logs claros de sucesso/falha

### DE NEGÓCIO
- ✅ Estoque atualizado a cada 2 minutos
- ✅ Pedidos atualizados a cada 1 minuto
- ✅ Produção atualizada a cada 30 segundos
- ✅ Zero downtime durante atualizações

## ⚠️ SINAIS DE ALERTA (REJEITAR)

### ARQUITETURA
- ❌ PollingService faz cache ou notificações
- ❌ Jobs com intervalos hardcoded
- ❌ Sem sistema de retry
- ❌ Circuit breaker não implementado

### QUALIDADE
- ❌ Testes unitários < 80% cobertura
- ❌ Sem testes de integração
- ❌ Logs incompletos ou confusos
- ❌ Configuração não via environment

### PERFORMANCE
- ❌ Polling > 10 segundos
- ❌ Sem fallback para cache
- ❌ Sobrecarga da API Omie
- ❌ Sem monitoramento de métricas

## 🚀 PRÓXIMOS PASSOS APÓS APROVAÇÃO

1. **Documentar**: Atualizar docs/ETAPA_2_PRODUCAO.md
2. **Monitorar**: Verificar logs por 24h
3. **Otimizar**: Ajustar intervalos baseado em uso real
4. **Preparar**: Configurar ambiente para Fase 2 (Redis)

## 💬 COMO SOLICITAR REVISÃO
```
@fase-1-polling: Implementei o IntelligentPollingService e modifiquei os jobs. 
Por favor, revise conforme checklist da Fase 1.
```

## 🔗 REFERÊNCIAS
- [ETAPA_2_PRODUCAO.md](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/ETAPA_2_PRODUCAO.md)
- [IntelligentPollingService.ts](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/shared/services/IntelligentPollingService.ts)
- [omie-production-orders-sync.job.ts](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/omie-production-orders/infrastructure/jobs/omie-production-orders-sync.job.ts)