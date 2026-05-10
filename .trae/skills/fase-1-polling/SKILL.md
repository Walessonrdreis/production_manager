---
name: "fase-1-polling"
description: "Agente de revisão para Fase 1 - Polling Inteligente. Invoke quando implementar polling para estoque (2min), pedidos (1min) e produção (30s), ou modificar jobs existentes."
---

# FASE 1 - AGENTE DE REVISÃO: POLLING INTELIGENTE

## 🎯 OBJETIVOS DA FASE 1
1. **IntelligentPollingService**: Polling dinâmico baseado em criticidade
2. **Modificar jobs existentes**: Intervalos otimizados
3. **Sistema de retry**: Backoff inteligente

## 📋 CHECKLIST DE REVISÃO

### ✅ 1. INTELLIGENTPOLLINGSERVICE
- [ ] **SRP**: Apenas lógica de polling, sem cache ou notificações
- [ ] **Configuração**: Intervalos base e máximo definidos
- [ ] **Dinâmico**: Ajusta intervalos baseado em status da API
- [ ] **Testes**: Unitários cobrem todos os cenários
- [ ] **Logs**: Registra sucessos, falhas e ajustes de intervalo

### ✅ 2. JOBS MODIFICADOS
- [ ] **omie-production-orders-sync.job.ts**: Intervalo 30 segundos
- [ ] **omie-orders-stage20.job.ts**: Intervalo 1 minuto  
- [ ] **stock-monitor.job.ts**: Novo job para estoque (2 minutos)
- [ ] **Compatibilidade**: Jobs antigos continuam funcionando
- [ ] **Configuração**: Intervalos via variáveis de ambiente

### ✅ 3. SISTEMA DE RETRY
- [ ] **Backoff exponencial**: Baseado em tipo de erro
- [ ] **Limite de tentativas**: Configurável
- [ ] **Circuit breaker**: Evita sobrecarga da API Omie
- [ ] **Logs**: Registra tentativas e falhas

## 🔍 CRITÉRIOS DE ACEITAÇÃO

### 1. PERFORMANCE
- **Estoque**: Atualizado a cada 2 minutos (máximo)
- **Pedidos**: Atualizado a cada 1 minuto (máximo)
- **Produção**: Atualizado a cada 30 segundos (máximo)
- **Latência**: Polling completo < 5 segundos

### 2. CONFIABILIDADE
- **Retry automático**: Para falhas transitórias
- **Fallback**: Dados cacheados se API indisponível
- **Monitoramento**: Métricas de sucesso/falha
- **Alertas**: Para falhas persistentes

### 3. MANUTENIBILIDADE
- **Configurável**: Intervalos via environment
- **Testável**: Mocks mínimos para testes
- **Modular**: Fácil de estender/modificar
- **Documentado**: README explicando uso

## 🧪 TESTES OBRIGATÓRIOS

### UNITÁRIOS
```typescript
// IntelligentPollingService
test('deve ajustar intervalo baseado em falhas')
test('deve usar intervalo base para sucessos')
test('deve limitar intervalo máximo')

// Jobs modificados
test('deve usar intervalo configurado')
test('deve lidar com falhas de rede')
test('deve registrar logs apropriados')
```

### INTEGRAÇÃO
```typescript
test('deve sincronizar ordens produção a cada 30s')
test('deve sincronizar pedidos a cada 1min')
test('deve monitorar estoque a cada 2min')
```

## 📊 MÉTRICAS DE SUCESSO

### OPERACIONAIS
- **Taxa de sucesso polling**: > 99%
- **Latência média**: < 2 segundos
- **Cache hit rate**: > 80% (quando implementado)

### DE NEGÓCIO
- **Detecção novos pedidos**: < 1 minuto
- **Atualização estoque**: < 2 minutos
- **Status produção**: < 30 segundos

## ⚠️ SINAIS DE ALERTA

### REJEITAR SE:
1. **Polling muito lento**: Intervalos > objetivos definidos
2. **Sem retry**: Falhas não são tratadas automaticamente
3. **Logs insuficientes**: Não registra sucessos/falhas
4. **Testes faltando**: Cobertura < 80% para nova lógica
5. **Quebra compatibilidade**: APIs/jobs existentes afetados

### APROVAR SE:
1. **Intervalos otimizados**: Objetivos cumpridos
2. **Retry funcionando**: Backoff inteligente
3. **Logs completos**: Monitoramento adequado
4. **Testes abrangentes**: Cobertura > 80%
5. **Compatibilidade mantida**: Nada quebrado

## 🔄 PRÓXIMOS PASSOS APÓS APROVAÇÃO

### IMEDIATOS
1. **Commit**: `feat(polling): implement intelligent polling service`
2. **Deploy**: Ambiente de staging
3. **Monitorar**: Métricas por 24h

### PREPARAÇÃO FASE 2
1. **Configurar Redis**: Preparar ambiente
2. **Planejar cache**: Estratégia multi-nível
3. **Documentar**: Transição para Fase 2