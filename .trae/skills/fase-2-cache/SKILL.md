---
name: "fase-2-cache"
description: "Agente de revisão para Fase 2 - Cache Multi-nível. Invoke quando implementar cache Redis, criar MultiLevelCacheService ou integrar cache aos serviços existentes."
---

# FASE 2 - AGENTE DE REVISÃO: CACHE MULTI-NÍVEL

## 🎯 OBJETIVOS DA FASE 2
1. **Configurar Redis**: Ambiente e client
2. **MultiLevelCacheService**: Cache 3 níveis (memória → Redis → banco)
3. **Integrar cache**: Aos serviços existentes
4. **Invalidation strategy**: Atualização automática

## 📋 CHECKLIST DE REVISÃO

### ✅ 1. REDIS CONFIGURADO
- [ ] **Variável ambiente**: `REDIS_URL` configurada
- [ ] **Client Redis**: `infra/redis.ts` com conexão configurada
- [ ] **Health check**: Verificação de conexão funcionando
- [ ] **Fallback**: Sistema funciona sem Redis (degradação graciosa)
- [ ] **Monitoramento**: Métricas de conexão Redis

### ✅ 2. MULTILEVELCACHESERVICE
- [ ] **SRP**: Apenas lógica de cache, sem negócio
- [ ] **3 níveis**: Memória → Redis → Banco → Omie
- [ ] **TTL configurável**: Por nível e tipo de dado
- [ ] **Cache stampede**: Prevenção implementada
- [ ] **Testes**: Unitários cobrem todos os cenários

### ✅ 3. INTEGRAÇÃO COM SERVIÇOS
- [ ] **Produtos**: Cache de catálogo e estoque
- [ ] **Pedidos**: Cache de status e detalhes
- [ ] **Produção**: Cache de ordens e status
- [ ] **Performance**: Melhoria mensurável nos endpoints
- [ ] **Logs**: Cache hits/misses registrados

### ✅ 4. INVAlIDATION STRATEGY
- [ ] **Time-based**: TTL automático
- [ ] **Event-based**: Invalidação por eventos
- [ ] **Manual**: Endpoint para invalidar cache
- [ ] **Consistência**: Dados não ficam desatualizados

## 🔍 CRITÉRIOS DE ACEITAÇÃO

### 1. PERFORMANCE CACHE
- **Latência memória**: < 1ms
- **Latência Redis**: < 5ms
- **Cache hit rate**: > 85% para dados frequentes
- **Redução chamadas Omie**: > 70% para dados cacheados

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