# REGRAS DE TRABALHO INCREMENTAL - TODAS AS FASES

## 🎯 OBJETIVO PRINCIPAL
**FAZER POUCO A POUCO, MOSTRANDO PROGRESSO INCREMENTAL**, evitando ações longas que consomem muitos créditos e dificultam a revisão.

## 🚫 REGRAS CRÍTICAS (APLICAM-SE A TODAS AS FASES)

### 1. **UMA TAREFA POR AÇÃO**
- Implemente **APENAS UMA** tarefa específica por ação
- Exemplo correto: "Criar arquivo X" ou "Escrever testes para Y"
- Exemplo errado: "Criar arquivo X + implementar lógica + escrever testes"

### 2. **MOSTRAR PROGRESSO CLARO**
- Após cada ação, mostre **EXATAMENTE** o que foi feito
- Inclua: arquivos criados, código implementado, testes escritos
- Nunca faça múltiplas coisas sem mostrar progresso intermediário

### 3. **LIMITE DE ARQUIVOS POR AÇÃO**
- **Máximo 2-3 arquivos** por ação
- Se precisar criar mais arquivos, divida em múltiplas ações
- Exemplo: Criar estrutura do módulo (2-3 arquivos) → depois implementar lógica

### 4. **TESTE INCREMENTAL**
- Teste **CADA PARTE** antes de continuar
- Não escreva todos os testes de uma vez
- Execute testes após cada implementação significativa

### 5. **EVITAR CRÉDITOS EXCESSIVOS**
- Ações curtas = menos créditos consumidos
- Progresso visível = revisão mais fácil
- Menos risco de esgotar créditos no meio da implementação

## 📋 FLUXO DE TRABALHO PADRÃO PARA CADA FASE

### **PARA CADA FASE, SIGA ESTE FLUXO:**

**PASSO 1: ESTRUTURA BÁSICA**
```
1. Criar estrutura de diretórios
2. Criar arquivos básicos (index.ts, register.ts)
3. Mostrar estrutura criada
```

**PASSO 2: IMPLEMENTAÇÃO INCREMENTAL**
```
4. Implementar UMA funcionalidade por vez
5. Escrever testes para essa funcionalidade
6. Executar testes e corrigir erros
7. Mostrar progresso
```

**PASSO 3: INTEGRAÇÃO GRADUAL**
```
8. Integrar com sistemas existentes (uma integração por vez)
9. Testar integração
10. Corrigir problemas
```

**PASSO 4: FINALIZAÇÃO**
```
11. Escrever testes finais de integração
12. Executar suite completa de testes
13. Solicitar revisão com @fase-X
```

## 🎯 EXEMPLOS CONCRETOS DE AÇÕES CORRETAS

### **EXEMPLO 1: FASE 1 - POLLING INTELIGENTE**
```
✅ CORRETO (ações separadas):
1. Criar arquivo IntelligentPollingService.ts (estrutura)
2. Mostrar arquivo criado
3. Escrever testes unitários para o serviço
4. Mostrar testes
5. Implementar lógica de polling dinâmico
6. Testar implementação
7. Modificar UM job (ex: production-orders)
8. Testar job modificado
```

```
❌ ERRADO (ação longa):
1. Criar IntelligentPollingService.ts + implementar toda lógica + 
   escrever todos testes + modificar todos jobs + testar tudo
```

### **EXEMPLO 2: FASE 2 - CACHE MULTI-NÍVEL**
```
✅ CORRETO:
1. Adicionar REDIS_URL ao .env
2. Criar infra/redis.ts (estrutura básica)
3. Implementar client Redis básico
4. Testar conexão Redis
5. Criar MultiLevelCacheService.ts (estrutura)
6. Implementar nível 1 (memória)
7. Testar nível 1
8. Implementar nível 2 (Redis)
9. Testar nível 2
```

### **EXEMPLO 3: FASE 3 - DASHBOARD**
```
✅ CORRETO:
1. Criar WebSocket server básico
2. Testar conexão WebSocket
3. Configurar projeto React (Vite + TS + Tailwind)
4. Criar componente ProductionQueue (estrutura)
5. Implementar lógica do componente
6. Testar componente
7. Integrar componente com WebSocket
8. Testar integração
```

## ⚠️ SINAIS DE ALERTA (REJEITAR IMEDIATAMENTE)

### **SINAL 1: AÇÃO MUITO LONGA**
- Mais de 3 arquivos criados/modificados de uma vez
- Implementação de múltiplas funcionalidades juntas
- Escrita de muitos testes de uma só vez

### **SINAL 2: PROGRESSO NÃO VISÍVEL**
- Ação realizada sem mostrar o que foi feito
- Múltiplas mudanças sem explicação passo a passo
- Testes escritos mas não mostrados

### **SINAL 3: INTEGRAÇÃO EXCESSIVA**
- Integração com múltiplos sistemas de uma vez
- Múltiplas dependências implementadas juntas
- Testes de integração complexos de uma só vez

## 🎯 METAS POR AÇÃO (IDEAL)

### **TAMANHO IDEAL DE AÇÃO:**
- **1-2 arquivos** criados/modificados
- **1 funcionalidade** implementada
- **Testes correspondentes** escritos e executados
- **Progresso claro** mostrado ao usuário

### **TEMPO IDEAL POR AÇÃO:**
- **5-15 minutos** de trabalho por ação
- **Progresso visível** a cada 10-15 minutos
- **Revisão fácil** após cada ação

## 🔄 COMO LIDAR COM AÇÕES COMPLEXAS

### **SE UMA TAREFA É COMPLEXA:**
1. **Divida em subtarefas** menores
2. **Implemente uma subtarefa** por ação
3. **Mostre progresso** após cada subtarefa
4. **Teste incrementalmente** cada parte

### **EXEMPLO: IMPLEMENTAR SISTEMA DE ALERTAS**
```
❌ Complexo demais para uma ação:
- Criar módulo + implementar todas regras + configurar todos canais

✅ Divisão correta:
Ação 1: Criar estrutura do módulo stock-monitor
Ação 2: Implementar StockMonitorService básico  
Ação 3: Implementar regra de estoque mínimo
Ação 4: Escrever testes para estoque mínimo
Ação 5: Configurar notificações por email
Ação 6: Testar notificações email
```

## 📊 BENEFÍCIOS DESTA ABORDAGEM

### **PARA O USUÁRIO:**
1. **Progresso visível**: Vê o sistema sendo construído passo a passo
2. **Controle total**: Pode interromper ou ajustar a qualquer momento
3. **Revisão fácil**: Cada parte pequena é fácil de revisar
4. **Economia de créditos**: Ações curtas consomem menos créditos

### **PARA O CHAT BUILDER:**
1. **Foco claro**: Uma tarefa por vez
2. **Feedback imediato**: Testa cada parte antes de continuar
3. **Correção fácil**: Erros são identificados e corrigidos rapidamente
4. **Qualidade garantida**: Cada parte é testada individualmente

## 💬 COMO SOLICITAR REVISÃO CORRETAMENTE

### **FORMATO IDEAL:**
```
@fase-X: Implementei [TAREFA ESPECÍFICA].
- Criei/modifiquei: [LISTA DE ARQUIVOS]
- Funcionalidade: [DESCRIÇÃO BREVE]
- Testes: [O QUE FOI TESTADO]
- Resultados: [TESTES PASSANDO/ERROS CORRIGIDOS]
Por favor, revise conforme checklist da Fase X.
```

### **EXEMPLO PRÁTICO:**
```
@fase-1-polling: Implementei o IntelligentPollingService.
- Criei: modules/shared/services/IntelligentPollingService.ts
- Funcionalidade: Polling dinâmico baseado em criticidade
- Testes: Unitários para ajuste de intervalos
- Resultados: Todos testes passando, logs configurados
Por favor, revise conforme checklist da Fase 1.
```

## 🚀 RESUMO FINAL

**FAÇA:**
- ✅ Uma tarefa por ação
- ✅ Mostre progresso claro
- ✅ Teste incrementalmente
- ✅ Limite a 2-3 arquivos por ação

**NUNCA FAÇA:**
- ❌ Múltiplas tarefas juntas
- ❌ Ações longas sem progresso visível
- ❌ Implementar tudo de uma vez
- ❌ Esgotar créditos em uma ação

**LEMBRE-SE:** Progresso incremental = Revisão fácil = Qualidade garantida = Economia de créditos