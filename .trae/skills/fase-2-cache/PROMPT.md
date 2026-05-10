# PROMPT PARA FASE 2 - CACHE MULTI-NÍVEL

## 🎯 CONTEXTO DA FASE
Você está implementando a **Fase 2 da Etapa 2** do projeto Production Manager. O foco é implementar um sistema de cache multi-nível para reduzir a latência e diminuir a carga na API do Omie.

## 📋 INSTRUÇÕES PARA O CHAT BUILDER

### O QUE VOCÊ PRECISA FAZER:
1. **Configurar Redis** no ambiente de desenvolvimento e produção
2. **Implementar `MultiLevelCacheService`** com 4 níveis de cache
3. **Integrar cache** com todos os módulos existentes
4. **Implementar sistema de invalidação** baseado em eventos
5. **Escrever testes completos** para cache e Redis

### PASSO A PASSO:
1. **Configure Redis**: Adicione `REDIS_URL` ao `.env` e crie `infra/redis.ts`
2. **Crie o cache service**: `modules/shared/services/MultiLevelCacheService.ts`
3. **Atualize módulos**: Modifique `omie-production-orders`, `omie-sales-orders`, etc.
4. **Implemente invalidação**: Sistema que remove cache quando dados mudam
5. **Escreva testes**: Unitários para cache, integração com Redis
6. **Execute testes**: Verifique performance e consistência
7. **Solicite revisão**: Use `@fase-2-cache`

### REGRAS IMPORTANTES:
- **Hierarquia de cache**: Memória → Redis → Banco → Omie
- **Stale-while-revalidate**: Serve dados antigos enquanto atualiza
- **TTLs configuráveis**: Diferentes por tipo de dado
- **Fallback robusto**: Sistema funciona mesmo se Redis cair
- **Métricas**: Cache hit rate monitorado

### PRÉ-REQUISITOS:
- **Fase 1 aprovada**: Polling inteligente funcionando
- **Redis instalado**: Localmente ou via Docker
- **Variáveis de ambiente**: `REDIS_URL` configurada

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
1. **Planejar**: "Vou configurar Redis no `.env` e criar estrutura básica do client"
2. **Implementar**: Adicionar `REDIS_URL` ao `.env` + criar `infra/redis.ts` (estrutura)
3. **Testar**: Escrever testes básicos para conexão Redis
4. **Mostrar**: Mostrar configuração e testes
5. **Perguntar**: "Redis configurado com sucesso. Devo continuar implementando o cache service?"

#### ❌ EXEMPLO DE FLUXO ERRADO (múltiplas ações juntas):
- Configurar Redis + implementar todo cache + integrar todos módulos + testar tudo
- Implementar múltiplos níveis de cache sem mostrar progresso intermediário
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

## 📊 OBJETIVOS DE NEGÓCIO
1. **Reduzir latência**: Cache hit < 100ms
2. **Diminuir carga Omie**: 80% menos requisições diretas
3. **Aumentar disponibilidade**: Dados disponíveis mesmo se API Omie cair
4. **Otimizar performance**: Cache inteligente baseado em criticidade
5. **Garantir consistência**: Sistema de invalidação eficiente

## 🛠️ TAREFAS ESPECÍFICAS

### TAREFA 2.1: CONFIGURAR REDIS
Configurar Redis no ambiente:
- Adicionar `REDIS_URL` ao `.env`
- Criar `infra/redis.ts` com client configurado
- Implementar conexão com retry
- Configurar TTLs baseados em tipo de dado

### TAREFA 2.2: MULTILEVELCACHESERVICE
Criar `modules/shared/services/MultiLevelCacheService.ts` com:
- Cache em 4 níveis: Memória → Redis → Banco → Omie
- Estratégia stale-while-revalidate
- Invalidação baseada em eventos
- Métricas de hit/miss rate

### TAREFA 2.3: INTEGRAR COM MÓDULOS EXISTENTES
Atualizar módulos para usar cache:
- `omie-production-orders`: Cache de ordens
- `omie-sales-orders`: Cache de pedidos
- `orders-enriched`: Cache enriquecido
- `products`: Cache de produtos

## 🧪 TESTES OBRIGATÓRIOS

### TESTES UNITÁRIOS
1. **MultiLevelCacheService**
   - Testar hierarquia de cache (1→2→3→4)
   - Testar stale-while-revalidate
   - Testar invalidação por evento
   - Testar TTLs diferentes por tipo

2. **Redis client**
   - Testar conexão e reconexão
   - Testar operações básicas (get/set/del)
   - Testar TTL expiration
   - Testar fallback se Redis indisponível

### TESTES DE INTEGRAÇÃO
1. **Cache completo**
   - Testar fluxo completo com falhas simuladas
   - Testar consistência entre níveis
   - Testar performance sob carga
   - Testar recovery após downtime

## 📈 MÉTRICAS DE SUCESSO

### OPERACIONAIS
- ✅ Cache hit rate > 80%
- ✅ Latência cache < 100ms
- ✅ Redis disponibilidade > 99.9%
- ✅ Invalidação automática funcionando

### DE NEGÓCIO
- ✅ 80% menos requisições para API Omie
- ✅ Dados disponíveis durante downtime Omie
- ✅ Performance consistente sob carga
- ✅ Zero data inconsistency

## ⚠️ SINAIS DE ALERTA (REJEITAR)

### ARQUITETURA
- ❌ CacheService faz polling ou notificações
- ❌ Sem hierarquia de cache (apenas 1 nível)
- ❌ Sem sistema de invalidação
- ❌ TTLs hardcoded ou não configuráveis

### QUALIDADE
- ❌ Testes não cobrem cenários de falha
- ❌ Sem testes de performance
- ❌ Sem métricas de cache hit/miss
- ❌ Logs incompletos para debugging

### PERFORMANCE
- ❌ Cache hit rate < 50%
- ❌ Latência cache > 500ms
- ❌ Sem fallback se Redis cai
- ❌ Data inconsistency entre níveis

## 🚀 PRÓXIMOS PASSOS APÓS APROVAÇÃO

1. **Monitorar**: Métricas de cache por 48h
2. **Otimizar**: Ajustar TTLs baseado em uso real
3. **Escalar**: Configurar Redis cluster se necessário
4. **Preparar**: Ambiente para Fase 3 (WebSocket)

## 💬 COMO SOLICITAR REVISÃO
```
@fase-2-cache: Implementei o MultiLevelCacheService e configurei Redis. 
Por favor, revise conforme checklist da Fase 2.
```

## 🔗 REFERÊNCIAS
- [ETAPA_2_PRODUCAO.md](file:///C:/Users/walll/OneDrive/projects_git/production_manager/docs/ETAPA_2_PRODUCAO.md)
- [MultiLevelCacheService.ts](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/shared/services/MultiLevelCacheService.ts)
- [infra/redis.ts](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/infra/redis.ts)
- [OmieStockCache.ts](file:///C:/Users/walll/OneDrive/projects_git/production_manager/apps/api/src/modules/shared/cache/OmieStockCache.ts)