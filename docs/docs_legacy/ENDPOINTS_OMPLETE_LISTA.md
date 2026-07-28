# LISTA COMPLETA DE ENDPOINTS OMIE PARA PRODUÇÃO

## 📊 MATRIZ DE PRIORIDADE

| Prioridade | Endpoint | Frequência | Impacto | Status |
|------------|----------|------------|---------|--------|
| 🚨 CRÍTICO | ListarPosEstoque | 2 min | ALTO | URGENTE |
| 🚨 CRÍTICO | ListarPedidos (status=20) | 1 min | ALTO | URGENTE |
| 🚨 CRÍTICO | ListarOrdemProducao | 30 seg | ALTO | URGENTE |
| 🔴 ALTO | ConsultarPosEstoque | Sob demanda | ALTO | IMPORTANTE |
| 🔴 ALTO | ConsultarPedido | Sob demanda | MÉDIO | IMPORTANTE |
| 🔴 ALTO | ConsultarOrdemProducao | Sob demanda | ALTO | IMPORTANTE |
| 🟡 MÉDIO | ListarProdutos | 5 min | MÉDIO | DESEJÁVEL |
| 🟡 MÉDIO | ListarMateriais | 5 min | MÉDIO | DESEJÁVEL |
| 🟢 BAIXO | ListarClientes | 15 min | BAIXO | CONTEXTO |

## 📋 ENDPOINTS DETALHADOS

### 1. 🚨 **ListarPosEstoque** - Posição de Estoque
**Call:** `ListarPosEstoque`
**Frequência:** 120000ms (2 minutos)
**Impacto na produção:** ALTO

```json
{
  "call": "ListarPosEstoque",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "pagina": 1,
      "registros_por_pagina": 100,
      "apenas_importado_api": "N",
      "filtrar_por_data_de": "2026-05-01",
      "filtrar_por_data_ate": "2026-05-09"
    }
  ]
}
```

**Resposta esperada:**
```json
{
  "pagina": 1,
  "total_de_paginas": 5,
  "registros": 450,
  "total_de_registros": 450,
  "estoque": [
    {
      "nCodProd": "12345",
      "cCodIntProd": "PROD-001",
      "cDescricao": "Produto A",
      "cUnidade": "UN",
      "nSaldo": 150.5,
      "nSaldoReservado": 25.0,
      "nSaldoDisponivel": 125.5,
      "nEstoqueMinimo": 50.0,
      "nEstoqueMaximo": 200.0,
      "dDtUltEnt": "2026-05-08",
      "dDtUltSai": "2026-05-07"
    }
  ]
}
```

**Dados críticos para produção:**
- `nSaldoDisponivel`: Quantidade disponível para produção
- `nSaldoReservado`: Quantidade já reservada para pedidos
- `nEstoqueMinimo`: Nível mínimo para alertas

### 2. 🚨 **ListarPedidos** - Pedidos de Venda
**Call:** `ListarPedidos`
**Frequência:** 60000ms (1 minuto) para status=20
**Impacto na produção:** ALTO

```json
{
  "call": "ListarPedidos",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "pagina": 1,
      "registros_por_pagina": 50,
      "apenas_importado_api": "N",
      "filtrar_por_data_de": "2026-05-09",
      "filtrar_por_data_ate": "2026-05-09",
      "filtrar_por_situacao": "20"
    }
  ]
}
```

**Status importantes:**
- `"0"`: Pendente
- `"10"`: Faturado
- `"20"`: Em produção 🚨
- `"30"`: Produzido
- `"40"`: Entregue

**Resposta esperada:**
```json
{
  "pagina": 1,
  "total_de_paginas": 2,
  "registros": 85,
  "total_de_registros": 85,
  "pedidos": [
    {
      "cabecalho": {
        "nCodPed": "78901",
        "cNumero": "PED-2026-001",
        "cCodInt": "CLI-001",
        "cNome": "Cliente A",
        "dDtPed": "2026-05-09 10:30:00",
        "cSituacao": "20",
        "cTipo": "V"
      },
      "itens": [
        {
          "nCodProd": "12345",
          "cCodIntProd": "PROD-001",
          "cDescricao": "Produto A",
          "nQuant": 10.0,
          "nValUnit": 25.50,
          "nValTotal": 255.00
        }
      ]
    }
  ]
}
```

### 3. 🚨 **ListarOrdemProducao** - Ordens de Produção
**Call:** `ListarOrdemProducao`
**Frequência:** 30000ms (30 segundos)
**Impacto na produção:** ALTO

```json
{
  "call": "ListarOrdemProducao",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "pagina": 1,
      "registros_por_pagina": 30,
      "apenas_importado_api": "N",
      "filtrar_por_data_de": "2026-05-01",
      "filtrar_por_data_ate": "2026-05-09"
    }
  ]
}
```

**Resposta esperada:**
```json
{
  "pagina": 1,
  "total_de_paginas": 3,
  "registros": 75,
  "total_de_registros": 75,
  "ordens_producao": [
    {
      "nCodOrdem": "45678",
      "cNumero": "OP-2026-001",
      "dDtEmissao": "2026-05-09 09:00:00",
      "cStatus": "1",
      "cObservacao": "Urgente - Cliente VIP",
      "produtos": [
        {
          "nCodProd": "12345",
          "cCodIntProd": "PROD-001",
          "cDescricao": "Produto A",
          "nQuant": 15.0,
          "nQuantProduzida": 5.0,
          "nQuantRestante": 10.0
        }
      ],
      "componentes": [
        {
          "nCodComp": "67890",
          "cCodIntComp": "MP-001",
          "cDescricao": "Matéria-prima X",
          "nQuantNecessaria": 30.0,
          "nQuantConsumida": 10.0
        }
      ]
    }
  ]
}
```

**Status de produção:**
- `"0"`: Pendente
- `"1"`: Em andamento 🚨
- `"2"`: Concluída
- `"3"`: Cancelada

### 4. 🔴 **ConsultarPosEstoque** - Consulta Estoque Específico
**Call:** `ConsultarPosEstoque`
**Frequência:** Sob demanda
**Impacto na produção:** ALTO

```json
{
  "call": "ConsultarPosEstoque",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "nCodProd": "12345",
      "cCodIntProd": "PROD-001"
    }
  ]
}
```

### 5. 🔴 **ConsultarPedido** - Consulta Pedido Específico
**Call:** `ConsultarPedido`
**Frequência:** Sob demanda
**Impacto na produção:** MÉDIO

```json
{
  "call": "ConsultarPedido",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "nCodPed": "78901",
      "cNumero": "PED-2026-001"
    }
  ]
}
```

### 6. 🔴 **ConsultarOrdemProducao** - Consulta Ordem Específica
**Call:** `ConsultarOrdemProducao`
**Frequência:** Sob demanda
**Impacto na produção:** ALTO

```json
{
  "call": "ConsultarOrdemProducao",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "nCodOrdem": "45678",
      "cNumero": "OP-2026-001"
    }
  ]
}
```

### 7. 🟡 **ListarProdutos** - Lista de Produtos
**Call:** `ListarProdutos`
**Frequência:** 300000ms (5 minutos)
**Impacto na produção:** MÉDIO

```json
{
  "call": "ListarProdutos",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "pagina": 1,
      "registros_por_pagina": 100,
      "apenas_importado_api": "N",
      "filtrar_apenas_omiepdv": "N"
    }
  ]
}
```

**Dados importantes:**
- Composição do produto (BOM - Bill of Materials)
- Tempo de produção estimado
- Unidade de medida
- Códigos alternativos

### 8. 🟡 **ListarMateriais** - Lista de Materiais/Componentes
**Call:** `ListarMateriais`
**Frequência:** 300000ms (5 minutos)
**Impacto na produção:** MÉDIO

```json
{
  "call": "ListarMateriais",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "pagina": 1,
      "registros_por_pagina": 100,
      "apenas_importado_api": "N"
    }
  ]
}
```

### 9. 🟢 **ListarClientes** - Lista de Clientes
**Call:** `ListarClientes`
**Frequência:** 900000ms (15 minutos)
**Impacto na produção:** BAIXO (contexto)

```json
{
  "call": "ListarClientes",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "pagina": 1,
      "registros_por_pagina": 50,
      "apenas_importado_api": "N"
    }
  ]
}
```

## ⚙️ ENDPOINTS DE ESCRITA (MODIFICAÇÃO)

### 10. **IncluirOrdemProducao** - Criar Nova Ordem
**Call:** `IncluirOrdemProducao`
**Uso:** Event-driven (quando pedido é convertido)

```json
{
  "call": "IncluirOrdemProducao",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "cabecalho": {
        "cNumero": "OP-AUTO-001",
        "dDtEmissao": "2026-05-09 14:30:00",
        "cObservacao": "Gerado automaticamente do pedido PED-2026-001"
      },
      "produtos": [
        {
          "nCodProd": "12345",
          "nQuant": 10.0,
          "cObservacao": "Urgente"
        }
      ]
    }
  ]
}
```

### 11. **AlterarOrdemProducao** - Atualizar Ordem
**Call:** `AlterarOrdemProducao`
**Uso:** Event-driven (atualizar status, quantidade produzida)

```json
{
  "call": "AlterarOrdemProducao",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "nCodOrdem": "45678",
      "cabecalho": {
        "cStatus": "2",
        "cObservacao": "Produção concluída em 09/05/2026 16:45"
      },
      "produtos": [
        {
          "nCodProd": "12345",
          "nQuantProduzida": 15.0
        }
      ]
    }
  ]
}
```

### 12. **AlterarSituacaoPedido** - Atualizar Status do Pedido
**Call:** `AlterarSituacaoPedido`
**Uso:** Event-driven (quando produção é concluída)

```json
{
  "call": "AlterarSituacaoPedido",
  "app_key": "SUA_APP_KEY",
  "app_secret": "SUA_APP_SECRET",
  "param": [
    {
      "nCodPed": "78901",
      "cSituacao": "30"
    }
  ]
}
```

## 🔄 ENDPOINTS ADICIONAIS (CONTEXTO)

### 13. **ListarProdutosResumo** - Resumo de Produtos
**Call:** `ListarProdutosResumo`
**Frequência:** 600000ms (10 minutos)

### 14. **ConsultarProduto** - Detalhes do Produto
**Call:** `ConsultarProduto`
**Frequência:** Sob demanda

### 15. **ConsultarMaterial** - Detalhes do Material
**Call:** `ConsultarMaterial`
**Frequência:** Sob demanda

### 16. **ConsultarCliente** - Detalhes do Cliente
**Call:** `ConsultarCliente`
**Frequência:** Sob demanda

### 17. **UpsertEstoque** - Atualizar Estoque
**Call:** `UpsertEstoque`
**Uso:** Event-driven (após produção)

## 🏗️ ARQUITETURA DE SINCRONIZAÇÃO

### Serviços necessários:

```typescript
// 1. Serviço de Polling Inteligente
class IntelligentPollingService {
  private endpoints = [
    {
      name: 'ListarPosEstoque',
      interval: 120000,
      priority: 1,
      lastSync: null,
      errorCount: 0
    },
    {
      name: 'ListarPedidos',
      interval: 60000,
      priority: 2,
      filter: { situacao: '20' },
      lastSync: null,
      errorCount: 0
    },
    {
      name: 'ListarOrdemProducao',
      interval: 30000,
      priority: 3,
      lastSync: null,
      errorCount: 0
    }
  ];
}

// 2. Serviço de Cache Multi-nível
class MultiLevelCacheService {
  private levels = {
    memory: new LRUCache({ max: 1000, ttl: 30000 }),
    redis: new RedisCache({ ttl: 300000 }),
    database: new DatabaseCache()
  };
}

// 3. Serviço de Alertas
class ProductionAlertService {
  private alertRules = {
    stockCritical: (product) => product.nSaldoDisponivel < product.nEstoqueMinimo * 1.2,
    productionDelay: (order) => {
      const hoursSinceStart = (Date.now() - new Date(order.dDtEmissao)) / (1000 * 60 * 60);
      return hoursSinceStart > 24 && order.cStatus === '1';
    },
    qualityIssue: (order) => order.nQuantRejeitada > order.nQuant * 0.05
  };
}
```

## 📊 FREQUÊNCIAS OTIMIZADAS

### Para máxima eficiência:

1. **Alta prioridade (30s-2min):**
   - Status de ordens de produção
   - Pedidos com status=20 (em produção)
   - Estoque de produtos críticos

2. **Média prioridade (5-10min):**
   - Lista completa de produtos
   - Materiais e componentes
   - Clientes (atualização)

3. **Baixa prioridade (15-30min):**
   - Dados históricos
   - Relatórios consolidados
   - Configurações do sistema

## 🚀 PLANO DE IMPLEMENTAÇÃO POR ENDPOINT

### FASE 1 (Dias 1-3) - CRÍTICO
- [ ] `ListarPosEstoque` - Implementar polling a cada 2min
- [ ] `ListarPedidos` (status=20) - Implementar polling a cada 1min
- [ ] Cache nível 1 (Redis) para dados de estoque

### FASE 2 (Dias 4-7) - IMPORTANTE
- [ ] `ListarOrdemProducao` - Implementar polling a cada 30s
- [ ] `ConsultarPosEstoque` - Endpoint sob demanda
- [ ] Sistema de alertas de estoque crítico

### FASE 3 (Dias 8-14) - DESEJÁVEL
- [ ] `ListarProdutos` - Polling a cada 5min
- [ ] `ListarMateriais` - Polling a cada 5min
- [ ] Dashboard com dados consolidados

### FASE 4 (Dias 15-20) - COMPLETO
- [ ] `IncluirOrdemProducao` - Criação automática
- [ ] `AlterarOrdemProducao` - Atualização em tempo real
- [ ] Integração completa vendas → produção

## ⚠️ LIMITAÇÕES E CONSIDERAÇÕES

### Limites da API Omie:
- **Rate limiting:** ~60 requisições/minuto
- **Paginação:** Máximo 500 registros por página
- **Filtros:** Limitados a campos específicos
- **Webhooks:** Não disponíveis (precisamos de polling)

### Estratégias de mitigação:
1. **Polling inteligente:** Backoff exponencial em caso de erro
2. **Cache agressivo:** Reduzir chamadas desnecessárias
3. **Batch processing:** Processar múltiplos itens por chamada
4. **Priorização:** Focar nos endpoints mais críticos

## 📈 MÉTRICAS DE PERFORMANCE

| Endpoint | Tempo alvo | Taxa de sucesso | Latência média |
|----------|------------|-----------------|----------------|
| ListarPosEstoque | < 2s | 99.9% | 800ms |
| ListarPedidos | < 1.5s | 99.9% | 600ms |
| ListarOrdemProducao | < 1s | 99.9% | 400ms |

---

**PRÓXIMOS PASSOS:** 
1. Implementar serviço de polling para os 3 endpoints críticos
2. Configurar Redis para cache nível 2
3. Criar dashboard mínimo com status em tempo real
4. Implementar sistema de alertas para estoque crítico