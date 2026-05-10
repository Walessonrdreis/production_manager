---
name: "fase-2-cache"
description: "Agente de revisão para Fase 2 - Cache Multi-nível (API Avançada). Invoke quando implementar cache Redis, criar MultiLevelCacheService ou integrar cache aos serviços existentes como parte da API Avançada."
---

# FASE 2 - AGENTE DE REVISÃO: CACHE MULTI-NÍVEL (API AVANÇADA)

## 🎯 CONTEXTO DA FASE - ESTRATÉGIA API-FIRST
Você está revisando a **Fase 2 da Etapa 2** com foco **API-FIRST**. Esta fase (Dias 11-20) desenvolve o **Cache Multi-nível** como parte da **API Avançada**, após a API Core estar estável.

## 🎯 OBJETIVOS DA FASE 2 (API AVANÇADA)
1. **Configurar Redis**: Ambiente e client para API Avançada
2. **MultiLevelCacheService**: Cache 3 níveis (memória → Redis → banco) para endpoints avançados
3. **Integrar cache**: Aos serviços existentes da API Core
4. **Invalidation strategy**: Atualização automática para dados em tempo real
5. **Métricas e monitoramento**: Performance do cache para API Avançada

## 📋 CHECKLIST DE REVISÃO

### ✅ 1. REDIS CONFIGURADO (API AVANÇADA)
- [ ] **Variável ambiente**: `REDIS_URL` configurada para API Avançada
- [ ] **Client Redis**: `infra/redis.ts` com conexão configurada para endpoints avançados
- [ ] **Health check**: Verificação de conexão funcionando para API Avançada
- [ ] **Fallback**: Sistema funciona sem Redis (degradação graciosa) mantendo API Core
- [ ] **Monitoramento**: Métricas de conexão Redis para endpoints avançados

### ✅ 2. MULTILEVELCACHESERVICE (API AVANÇADA)
- [ ] **SRP**: Apenas lógica de cache, sem negócio complexo
- [ ] **3 níveis**: Memória → Redis → Banco → Omie para endpoints avançados
- [ ] **TTL configurável**: Por nível e tipo de dado para API Avançada
- [ ] **Cache stampede**: Prevenção implementada para alta concorrência
- [ ] **Testes**: Unitários cobrem todos os cenários de cache para endpoints REST

### ✅ 3. INTEGRAÇÃO COM SERVIÇOS (API AVANÇADA)
- [ ] **Produtos**: Cache de catálogo e estoque para endpoints avançados
- [ ] **Pedidos**: Cache de status e detalhes para consultas complexas
- [ ] **Produção**: Cache de ordens e status para análises em tempo real
- [ ] **Performance**: Melhoria mensurável nos endpoints avançados
- [ ] **Logs**: Cache hits/misses registrados para monitoramento da API

### ✅ 4. INVAlIDATION STRATEGY (API AVANÇADA)
- [ ] **Time-based**: TTL automático para dados temporários
- [ ] **Event-based**: Invalidação por eventos de negócio
- [ ] **Manual**: Endpoint para invalidar cache específico
- [ ] **Consistência**: Dados não ficam desatualizados para usuários da API

## 🔍 CRITÉRIOS DE ACEITAÇÃO (API AVANÇADA)

### 1. PERFORMANCE CACHE API AVANÇADA
- **Latência memória**: < 1ms para endpoints avançados
- **Latência Redis**: < 5ms para consultas complexas
- **Cache hit rate**: > 85% para dados frequentes da API Avançada
- **Redução chamadas Omie**: > 70% para dados cacheados em endpoints avançados

### 2. INTEGRAÇÃO COM API CORE
- **Compatibilidade**: Cache funciona com endpoints existentes da API Core
- **Performance**: Melhoria mensurável em endpoints que usam cache
- **Fallback**: Sistema funciona mesmo se cache falhar
- **Monitoramento**: Métricas de cache disponíveis para análise

### 2. CONFIABILIDADE
- **Fallback automático**: Se Redis indisponível
- **Retry conexão**: Para falhas transitórias
- **Circuit breaker**: Evita sobrecarga Redis
- **Monitoramento**: Métricas de cache em tempo real

### 3. MANUTENIBILIDADE
- **Configuração centralizada**: TTLs em um lugar
- **Testes abrangentes**: Cobertura > 90%
- **Documentação**: Como usar e configurar cache
- **Métricas**: Dashboard com performance cache

## 🧪 TESTES OBRIGATÓRIOS

### UNITÁRIOS
```typescript
// MultiLevelCacheService
test('deve buscar primeiro na memória')
test('deve buscar no Redis se memória vazia')
test('deve buscar no banco se Redis vazio')
test('deve chamar Omie se banco vazio')
test('deve atualizar todos os níveis após fetch')

// Redis client
test('deve reconectar após falha')
test('deve lidar com timeout')
test('deve registrar métricas de conexão')
```

### INTEGRAÇÃO
```typescript
test('deve melhorar performance endpoint produtos')
test('deve reduzir chamadas à API Omie')
test('deve invalidar cache após atualizações')
test('deve funcionar sem Redis (fallback)')
```

### PERFORMANCE
```typescript
test('latência cache memória < 1ms')
test('latência cache Redis < 5ms')
test('cache hit rate > 85% após warmup')
```

## 📊 MÉTRICAS DE SUCESSO

### OPERACIONAIS
- **Cache hit rate**: > 85%
- **Latência média endpoints**: Redução de 50%
- **Chamadas Omie**: Redução de 70%
- **Uptime Redis**: > 99.9%

### DE NEGÓCIO
- **Tempo resposta dashboard**: < 200ms
- **Atualização dados em tempo real**: < 1 segundo
- **Disponibilidade sistema**: > 99.5%

## ⚠️ SINAIS DE ALERTA

### REJEITAR SE:
1. **Sem fallback**: Sistema quebra sem Redis
2. **Cache stampede**: Múltiplas chamadas simultâneas ao Omie
3. **Dados desatualizados**: Cache não é invalidado corretamente
4. **Performance piorou**: Latência aumentou após cache
5. **Testes insuficientes**: Cobertura < 80%

### APROVAR SE:
1. **Performance melhorada**: Latência reduzida significativamente
2. **Fallback funcionando**: Sistema opera sem Redis
3. **Cache consistente**: Dados sempre atualizados
4. **Monitoramento completo**: Métricas de cache disponíveis
5. **Documentação clara**: Como usar e configurar

## 🔄 PRÓXIMOS PASSOS APÓS APROVAÇÃO

### IMEDIATOS
1. **Commit**: `feat(cache): implement multi-level cache with Redis`
2. **Deploy**: Ambiente de staging com Redis
3. **Monitorar**: Métricas de cache por 48h

### PREPARAÇÃO FASE 3
1. **Configurar WebSocket**: Preparar ambiente
2. **Planejar dashboard**: Componentes React necessários
3. **Documentar**: Transição para Fase 3

## 🛠️ CONFIGURAÇÃO REDIS

### VARIÁVEIS AMBIENTE
```env
REDIS_URL=redis://localhost:6379
REDIS_TTL_STOCK=120  # 2 minutos em segundos
REDIS_TTL_ORDERS=60   # 1 minuto em segundos
REDIS_TTL_PRODUCTION=30  # 30 segundos
```

### CLIENT REDIS
```typescript
// infra/redis.ts
import Redis from 'ioredis';
import { env } from '@/config';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected');
});
```