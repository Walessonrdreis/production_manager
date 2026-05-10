# PROMPT PARA FASE 4 - SISTEMA DE ALERTAS

## 🎯 CONTEXTO DA FASE
Você está implementando a **Fase 4 da Etapa 2** do projeto Production Manager. O foco é criar um sistema completo de alertas para monitoramento proativo do estoque, integrando com todos os sistemas já implementados (polling, cache, dashboard).

## 📋 INSTRUÇÕES PARA O CHAT BUILDER

### O QUE VOCÊ PRECISA FAZER:
1. **Implementar `StockMonitorService`** com monitoramento contínuo de estoque
2. **Criar regras de negócio configuráveis** para diferentes tipos de alertas
3. **Desenvolver sistema de notificações** multi-canal (email, SMS, dashboard)
4. **Integrar completamente** com polling, cache e dashboard existentes
5. **Implementar histórico e relatórios** de efetividade dos alertas

### PASSO A PASSO:
1. **Crie StockMonitorService**: `modules/stock-monitor/application/StockMonitorService.ts`
2. **Implemente regras**: Estoque mínimo, consumo anormal, validade, ruptura iminente
3. **Configure notificações**: Email para críticos, SMS para urgente, WebSocket para dashboard
4. **Integre sistemas**: Conecte com polling (dados), cache (performance), dashboard (UI)
5. **Desenvolva histórico**: Banco de dados de alertas com resolução e análise
6. **Escreva testes**: Unitários para regras, integração para fluxo completo
7. **Solicite revisão**: Use `@fase-4-alertas`

### REGRAS IMPORTANTES:
- **Configurável**: Regras ajustáveis via environment ou interface
- **Multi-canal**: Notificações por email, SMS e dashboard
- **Escalonamento**: Alertas não resolvidos escalam em severidade
- **Histórico**: Todos alertas registrados para análise
- **Efetividade**: Métricas de falsos positivos/negativos

### PRÉ-REQUISITOS:
- **Fase 1 aprovada**: Polling inteligente funcionando
- **Fase 2 aprovada**: Cache multi-nível configurado
- **Fase 3 aprovada**: Dashboard tempo real implementado
- **Serviços externos**: Email (SMTP), SMS (API) configurados

### TIPOS DE ALERTAS A IMPLEMENTAR:
1. **Estoque mínimo**: Produto abaixo do nível configurado
2. **Consumo anormal**: Desvio > 2σ do histórico
3. **Validade próxima**: 30, 15, 7 dias antes do vencimento
4. **Ruptura iminente**: Lead time + consumo atual > estoque atual
5. **Tendência negativa**: Consumo caindo consistentemente

### SEVERIDADE DOS ALERTAS:
- **Baixa**: Situação monitorar (ex: estoque 20% acima mínimo)
- **Média**: Ação recomendada (ex: estoque próximo do mínimo)
- **Alta**: Ação necessária (ex: estoque abaixo do mínimo)
- **Crítica**: Ação urgente (ex: ruptura iminente em < 24h)

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
1. **Planejar**: "Vou criar estrutura básica do módulo stock-monitor"
2. **Implementar**: Criar diretório `modules/stock-monitor/` + arquivos básicos (index.ts, register.ts)
3. **Testar**: Escrever testes básicos para estrutura do módulo
4. **Mostrar**: Mostrar estrutura criada e testes
5. **Perguntar**: "Módulo stock-monitor criado com sucesso. Devo continuar implementando o StockMonitorService?"

#### ❌ EXEMPLO DE FLUXO ERRADO (múltiplas ações juntas):
- Criar todo módulo + implementar todas regras + configurar todos canais + testar tudo
- Implementar múltiplas regras de negócio sem mostrar progresso intermediário
- Trabalhar por mais de 15 minutos sem parar para mostrar progresso

#### 🎯 METAS POR AÇÃO
- **Ideal**: 1-2 arquivos, 1 funcionalidade, 5-15 minutos
- **Aceitável**: 3 arquivos, 1 funcionalidade, até 15 minutos  
- **Proibido**: >3 arquivos, >1 funcionalidade, >15 minutos

#### 📋 CHECKLIST APÓS CADA AÇÃO
- [ ] Mostrei quais arquivos foram criados/modificados?
- [ ] Mostrei testes executados e resultados?
- [ ] Verifiquei logs do sistema?
- [ ] Corrigi erros imediatamente?
- [ ] A ação levou menos de 15 minutos?
- [ ] Modifiquei no máximo 3 arquivos?
- [ ] Implementei apenas UMA funcionalidade?
- [ ] Perguntei se devo continuar?

#### 🗂️ DIVISÃO RECOMENDADA PARA FASE 4:
- **Ação 1**: Estrutura do módulo stock-monitor (diretório + arquivos básicos)
- **Ação 2**: StockMonitorService básico (estrutura + interface)
- **Ação 3**: Regra de estoque mínimo (implementação + testes)
- **Ação 4**: Notificações por email (configuração + envio básico)
- **Ação 5**: Regra de consumo anormal (implementação + testes)
- **Ação 6**: Notificações por SMS (configuração + envio básico)
- **Ação 7**: Integração com dashboard (WebSocket + UI alerts)
- **Ação 8**: Sistema de histórico (banco + queries básicas)
- **Ação 9**: Testes completos (unitários + integração)

#### 💡 DICA IMPORTANTE:
**Economize créditos**: Cada ação curta usa menos créditos. Se você fizer tudo de uma vez, pode esgotar os créditos antes de terminar e ficar difícil revisar. Faça pouco a pouco!

## 📊 OBJETIVOS DE NEGÓCIO
1. **Prevenção ruptura**: Alertas antes do estoque zerar
2. **Otimização estoque**: Evitar excesso ou falta
3. **Ação proativa**: Tempo para reagir a situações críticas
4. **Redução perdas**: Alertas para produtos perto de vencer
5. **Melhoria decisão**: Dados para planejamento de compras

## 🛠️ TAREFAS ESPECÍFICAS

### TAREFA 4.1: STOCKMONITORSERVICE
Criar `modules/stock-monitor/application/StockMonitorService.ts` com:
- Monitoramento contínuo de níveis de estoque
- Regras de negócio configuráveis
- Detecção de padrões anormais de consumo
- Sistema de severidade de alertas (baixa, média, alta, crítica)

### TAREFA 4.2: REGRAS DE NEGÓCIO
Implementar regras específicas:
- **Estoque mínimo**: Por produto, categoria, fornecedor
- **Consumo anormal**: Baseado em histórico e sazonalidade
- **Validade**: Alertas 30, 15, 7 dias antes do vencimento
- **Ruptura iminente**: Cálculo baseado em lead time + consumo
- **Tendências**: Aumento/diminuição súbita de consumo

### TAREFA 4.3: SISTEMA DE NOTIFICAÇÕES
Implementar múltiplos canais:
- **Email**: Relatórios diários, alertas críticos
- **SMS**: Apenas para ruptura iminente (urgente)
- **Dashboard**: Alertas em tempo real via WebSocket
- **Escalonamento**: Alertas não resolvidos em X horas
- **Histórico**: Banco de dados de todos alertas

### TAREFA 4.4: INTEGRAÇÃO COMPLETA
Conectar todos sistemas:
- Polling fornece dados atualizados
- Cache otimiza performance do monitor
- Dashboard mostra alertas em tempo real
- Sistema permite marcar alertas como resolvidos
- Relatórios de efetividade do sistema

## 🧪 TESTES OBRIGATÓRIOS

### TESTES UNITÁRIOS
1. **StockMonitorService**
   - Testar cada regra de negócio isoladamente
   - Testar cálculo de severidade
   - Testar detecção de padrões anormais
   - Testar configuração de regras

2. **Notification Services**
   - Testar envio de email (mock)
   - Testar envio de SMS (mock)
   - Testar broadcast WebSocket
   - Testar escalonamento

### TESTES DE INTEGRAÇÃO
1. **Fluxo completo de alerta**
   - Dados → Monitor → Regras → Notificação → Dashboard
   - Testar fallback se algum componente falha
   - Testar performance com muitos produtos
   - Testar consistência de dados

2. **Sistema de resolução**
   - Testar marcação de alertas como resolvidos
   - Testar histórico e relatórios
   - Testar re-alerta se situação não melhora
   - Testar auditoria de ações

### TESTES E2E
1. **Cenários reais**
   - Simular ruptura iminente e ver alerta
   - Testar diferentes canais de notificação
   - Validar interface do dashboard
   - Testar configuração de regras por usuário

## 📈 MÉTRICAS DE SUCESSO

### OPERACIONAIS
- ✅ Monitoramento executa em < 30 segundos
- ✅ Notificações enviadas em < 10 segundos
- ✅ Alertas visíveis no dashboard em < 1 segundo
- ✅ Sistema escala para > 1000 produtos

### DE NEGÓCIO
- ✅ Rupturas prevenidas > 95% dos casos
- ✅ Falsos positivos < 5%
- ✅ Tempo de reação reduzido em > 50%
- ✅ Perdas por validade reduzidas em > 30%

### EFETIVIDADE
- ✅ Alertas levam a ações corretivas > 90% das vezes
- ✅ Usuários consideram alertas úteis > 80%
- ✅ Configuração de regras intuitiva
- ✅ Histórico de alertas facilmente consultável

## ⚠️ SINAIS DE ALERTA (REJEITAR)

### ARQUITETURA
- ❌ StockMonitorService com responsabilidades múltiplas
- ❌ Regras não configuráveis ou hardcoded
- ❌ Sem sistema de escalonamento ou histórico
- ❌ Notificações sem fallback ou confirmação

### QUALIDADE
- ❌ Testes não cobrem cenários de borda críticos
- ❌ Sem métricas de efetividade dos alertas
- ❌ Logs incompletos para debugging de falsos positivos
- ❌ Documentação insuficiente das regras de negócio

### PERFORMANCE
- ❌ Monitoramento > 2 minutos (perde atualidade)
- ❌ Notificações > 30 segundos (perde urgência)
- ❌ Falsos positivos > 20% (cria alerta fadiga)
- ❌ Interface lenta para consulta de histórico

### USABILIDADE
- ❌ Alertas ambíguos ou sem ação clara
- ❌ Dificuldade para ajustar regras de negócio
- ❌ Sem indicação visual clara de severidade
- ❌ Histórico confuso ou difícil de filtrar

## 🚀 PRÓXIMOS PASSOS APÓS APROVAÇÃO

1. **Monitorar efetividade**: 1 semana de uso real
2. **Ajustar regras**: Baseado em falsos positivos/negativos
3. **Treinar equipe**: Procedimentos para cada tipo de alerta
4. **Expandir sistema**: Alertas para produção, qualidade, manutenção

## 💬 COMO SOLICITAR REVISÃO
```
@fase-4-alertas: Implementei StockMonitorService com regras de estoque mínimo, 
consumo anormal e validade. Sistema de notificações por email, SMS e dashboard.
Por favor, revise conforme checklist da Fase 4.
```

## 🔗 REFERÊNCIAS
- [SISTEMA_MONITORAMENTO_ESTOQUE.md](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/SISTEMA_MONITORAMENTO_ESTOQUE.md)
- [StockMonitorService.ts](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/stock-monitor/application/StockMonitorService.ts)
- [Alert Rules Configuration](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/stock-monitor/domain/AlertRule.ts)
- [Notification Channels](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/shared/notifications/)