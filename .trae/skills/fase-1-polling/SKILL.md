---
name: "fase-1-polling"
description: "Agente de revisão para Fase 1 - Polling Inteligente (API Core). Invoke quando implementar polling para estoque (2min), pedidos (1min) e produção (30s), ou modificar jobs existentes como parte da API Core."
---

# FASE 1 - AGENTE DE REVISÃO: POLLING INTELIGENTE (API CORE)

## 🎯 CONTEXTO DA FASE - ESTRATÉGIA API-FIRST
Você está revisando a **Fase 1 da Etapa 2** com foco **API-FIRST**. Esta fase (Dias 1-10) desenvolve o **Polling Inteligente** como parte da **API Core**.

## 🎯 OBJETIVOS DA FASE 1 (API CORE)
1. **IntelligentPollingService**: Polling dinâmico baseado em criticidade
2. **Modificar jobs existentes**: Intervalos otimizados para API Core
3. **Sistema de retry**: Backoff inteligente para endpoints REST
4. **Integração com módulos**: Conectar polling com outros módulos da API

## 📋 CHECKLIST DE REVISÃO

### ✅ 1. INTELLIGENTPOLLINGSERVICE (API CORE)
- [ ] **SRP**: Apenas lógica de polling, sem cache ou notificações complexas
- [ ] **Configuração**: Intervalos base e máximo definidos para API Core
- [ ] **Dinâmico**: Ajusta intervalos baseado em status da API Omie
- [ ] **Testes**: Unitários cobrem todos os cenários de endpoints REST
- [ ] **Logs**: Registra sucessos, falhas e ajustes de intervalo para API

### ✅ 2. JOBS MODIFICADOS (API CORE)
- [ ] **omie-production-orders-sync.job.ts**: Intervalo 30 segundos (API Core)
- [ ] **omie-orders-stage20.job.ts**: Intervalo 1 minuto (API Core)  
- [ ] **stock-monitor.job.ts**: Novo job para estoque (2 minutos) (API Core)
- [ ] **Compatibilidade**: Jobs antigos continuam funcionando com API Core
- [ ] **Configuração**: Intervalos via variáveis de ambiente da API

### ✅ 3. SISTEMA DE RETRY (API CORE)
- [ ] **Backoff exponencial**: Baseado em tipo de erro da API Omie
- [ ] **Limite de tentativas**: Configurável para endpoints REST
- [ ] **Circuit breaker**: Evita sobrecarga da API Omie para API Core
- [ ] **Logs**: Registra tentativas e falhas da API

## 🔍 CRITÉRIOS DE ACEITAÇÃO (API CORE)

### 1. PERFORMANCE API CORE
- **Estoque**: Atualizado a cada 2 minutos (máximo) via API
- **Pedidos**: Atualizado a cada 1 minuto (máximo) via API
- **Produção**: Atualizado a cada 30 segundos (máximo) via API
- **Latência**: Polling completo < 5 segundos para API Core

### 2. CONFIABILIDADE API CORE
- **Retry automático**: Para falhas transitórias da API Omie
- **Fallback**: Dados cacheados se API Omie indisponível
- **Monitoramento**: Métricas de sucesso/falha da API Core
- **Alertas**: Para falhas persistentes da API Omie

### 3. MANUTENIBILIDADE API CORE
- **Configurável**: Intervalos via environment da API
- **Documentação**: Endpoints REST documentados em OpenAPI
- **Testes**: Cobertura > 80% para lógica de polling da API Core
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