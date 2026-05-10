---
name: "fase-4-alertas"
description: "Agente de revisão para Fase 4 - Sistema de Alertas. Invoke quando implementar StockMonitorService, regras de negócio para estoque crítico, sistema de notificações ou integração com dashboard."
---

# FASE 4 - AGENTE DE REVISÃO: SISTEMA DE ALERTAS

## 🎯 OBJETIVOS DA FASE 4
1. **StockMonitorService**: Monitoramento contínuo de estoque
2. **Regras de negócio**: Estoque mínimo, consumo anormal, validade
3. **Sistema de notificações**: Email, SMS, dashboard
4. **Integração completa**: Polling + Cache + Dashboard + Alertas

## 📋 CHECKLIST DE REVISÃO

### ✅ 1. STOCKMONITORSERVICE
- [ ] **SRP**: Apenas monitoramento e alertas, sem cache ou polling
- [ ] **Regras configuráveis**: Via environment ou banco
- [ ] **Monitoramento contínuo**: Executa periodicamente
- [ ] **Logs detalhados**: Alertas gerados, ações tomadas
- [ ] **Testes**: Unitários cobrem todas regras de negócio

### ✅ 2. REGRAS DE NEGÓCIO
- [ ] **Estoque mínimo**: Por produto/categoria
- [ ] **Consumo anormal**: Desvio padrão histórico
- [ ] **Validade próxima**: Produtos perto de vencer
- [ ] **Ruptura iminente**: Baseado em consumo e lead time
- [ ] **Personalizável**: Regras podem ser ajustadas

### ✅ 3. SISTEMA DE NOTIFICAÇÕES
- [ ] **Email**: Para produtos críticos
- [ ] **SMS**: Para ruptura iminente
- [ ] **Dashboard**: Alertas ativos visíveis
- [ ] **Escalonamento**: Alertas não resolvidos
- [ ] **Histórico**: Todos alertas registrados

### ✅ 4. INTEGRAÇÃO COMPLETA
- [ ] **Polling → Cache → Monitor → Alertas**: Fluxo completo
- [ ] **Dashboard updates**: Alertas em tempo real via WebSocket
- [ ] **Resolução**: Alertas podem ser marcados como resolvidos
- [ ] **Relatórios**: Histórico de alertas por período

## 🔍 CRITÉRIOS DE ACEITAÇÃO

### 1. EFETIVIDADE ALERTAS
- **Detecção precoce**: Antes da ruptura real
- **Precisão**: Falsos positivos < 5%
- **Relevância**: Alertas apenas para situações críticas
- **Ação**: Alertas levam a ações corretivas

### 2. PERFORMANCE SISTEMA
- **Monitoramento**: Execução < 30 segundos
- **Notificações**: Envio < 10 segundos
- **Dashboard**: Alertas visíveis em < 1 segundo
- **Escalabilidade**: Suporta > 1000 produtos

### 3. EXPERIÊNCIA USUÁRIO
- **Clareza**: Alertas fáceis de entender
- **Ação**: Próximos passos claros
- **Histórico**: Fácil consulta de alertas passados
- **Configuração**: Regras fáceis de ajustar

### 4. CONFIABILIDADE
- **Disponibilidade**: Sistema 24/7
- **Resiliência**: Continua funcionando se componentes falham
- **Consistência**: Dados corretos sempre
- **Auditoria**: Todas ações registradas

## ⚠️ SINAIS DE ALERTA (REJEITAR)

### ARQUITETURA
- ❌ StockMonitorService faz cache ou polling
- ❌ Regras hardcoded não configuráveis
- ❌ Sem sistema de escalonamento
- ❌ Alertas sem histórico ou resolução

### QUALIDADE
- ❌ Testes não cobrem casos de borda
- ❌ Sem testes de performance do monitor
- ❌ Logs incompletos para debugging
- ❌ Documentação insuficiente das regras

### PERFORMANCE
- ❌ Monitoramento > 2 minutos
- ❌ Notificações > 30 segundos
- ❌ Falsos positivos > 20%
- ❌ Sistema não escala com muitos produtos

### USABILIDADE
- ❌ Alertas confusos ou ambíguos
- ❌ Sem indicação clara de severidade
- ❌ Dificuldade para configurar regras
- ❌ Histórico de alertas difícil de consultar

## 🚀 PRÓXIMOS PASSOS APÓS APROVAÇÃO

1. **Monitorar**: Efetividade dos alertas por 1 semana
2. **Ajustar**: Regras baseado em falsos positivos/negativos
3. **Treinar**: Equipe no uso do sistema de alertas
4. **Documentar**: Procedimentos para cada tipo de alerta

## 💬 COMO SOLICITAR REVISÃO
```
@fase-4-alertas: Implementei StockMonitorService e sistema de alertas.
Por favor, revise conforme checklist da Fase 4.
```

## 🔗 REFERÊNCIAS
- [SISTEMA_MONITORAMENTO_ESTOQUE.md](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/SISTEMA_MONITORAMENTO_ESTOQUE.md)
- [StockMonitorService.ts](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/stock-monitor/application/StockMonitorService.ts)
- [AlertNotificationService.ts](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/shared/services/AlertNotificationService.ts)
- [AlertsPanel.tsx](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/dashboard/src/components/AlertsPanel.tsx)