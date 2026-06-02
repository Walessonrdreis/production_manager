# Módulo de Integração de Estoque (Stock)

Este módulo gerencia a consulta de posição de estoque com sistemas externos (Omie), seguindo o padrão Clean Architecture.

## 📋 Rotas Disponíveis

### 1. **POST** `/v1/integration/stock/position`
Consulta a posição de estoque de um produto específico.

**Request Body:**
```json
{
  "productId": "string"
}
```

**Responses:**

**Caso de Sucesso (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "productId": "string",
    "positionDate": "string (DD/MM/YYYY)",
    "total": "number",
    "breakdown": [
      {
        "stockLocationCode": "number",
        "quantity": "number"
      }
    ]
  }
}
```

**Caso de Erro de Validação (`400 Bad Request`):**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request payload"
}
```

**Caso de Erro Interno (`500 Internal Server Error`):**
```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

---

## 🏗️ Arquitetura

```
stock/
├── application/
│   └── get-stock-position.usecase.ts
├── infrastructure/
│   └── omie-stock-position.gateway.ts
├── presentation/
│   └── http/
│       └── stock-position.controller.ts
├── register-stock-module.ts
└── README.md
```

---

## ⚙️ Configuração

**Variáveis de Ambiente:**
- `OMIE_APP_KEY`: Chave da API Omie (obrigatória para integração real)
- `OMIE_APP_SECRET`: Segredo da API Omie (obrigatória para integração real)
- `OMIE_BASE_URL`: URL base da API Omie (default: `"https://app.omie.com.br"`)

**Parâmetros da API Omie:**
- **Call**: `"ListarPosEstoque"`
- **Endpoint**: `/api/v1/estoque/consulta/`
- **Parâmetros**:
  - `nPagina`: Número da página (pagination)
  - `nRegPorPagina`: Registros por página (default: 200)
  - `dDataPosicao`: Data da posição (formato DD/MM/YYYY)
  - `cExibeTodos`: `"S"` (exibe todos os registros)
  - `codigo_local_estoque`: `0` (todos os locais)

---

## 🔄 Fluxo de Integração

1. **API 2 / Frontend** → Solicita posição de estoque via `POST /v1/integration/stock/position`
2. **API 1** → Valida `productId` no request body
3. **Use Case** → Instancia gateway com client Omie
4. **Gateway** → Executa paginação para encontrar o produto
5. **Gateway** → Consolida quantidades por local de estoque
6. **API 1** → Retorna resposta consolidada

---

## 🎯 Objetivo do Módulo

**Consultar posição de estoque descentralizada por local e consolidar total:**

- **Problema**: Omie mantém estoque por local (físico/virtual) e não fornece total direto
- **Solução**: Este endpoint consulta todos os locais e consolida as quantidades
- **Benefício**: Fornece visão unificada do estoque disponível

---

## 📊 Estrutura de Dados

**Resposta de Posição de Estoque:**
```typescript
{
  success: true,
  data: {
    productId: string;           // ID do produto consultado
    positionDate: string;        // Data da consulta (DD/MM/YYYY)
    total: number;              // Quantidade total consolidada
    breakdown: Array<{          // Detalhamento por local
      stockLocationCode: number; // Código do local de estoque
      quantity: number;         // Quantidade no local
    }>;
  }
}
```

---

## 🔍 Detalhes Técnicos

### **Paginação Automática**
- O gateway percorre automaticamente todas as páginas da API Omie
- **Safety limit**: 50 páginas (evita loop infinito)
- **Registros por página**: 200 (balance entre performance e memória)

### **Extração Defensiva**
Devido à variação na estrutura de resposta da API Omie:

**Campos para `productId`:**
- `nCodProd`
- `nCodProduto` 
- `codigo_produto`
- `codigo`
- `cCodigo`

**Campos para `quantity`:**
- `nSaldo`
- `nSaldoAtual`
- `nQuantidade`
- `quantidade`
- `qtd`

**Campos para `stockLocationCode`:**
- `codigo_local_estoque`
- `codigo_local`
- `nCodLocal`

### **Cache de Estoque**
- O módulo usa cache compartilhado (`omieStockCache`)
- **TTL**: Configurável via env (default: 60 segundos)
- **Benefício**: Reduz chamadas REDUNDANT à API Omie

---

## 🔒 Segurança

- **API 1** é a única responsável por integrações externas
- **Credenciais Omie**: Armazenadas em env, nunca no código
- **Circuit Breaker**: Protege contra falhas da API externa
- **Timeout**: Configurável para evitar bloqueios

---

## 🚀 Uso em Produção

**Configuração mínima:**
```bash
OMIE_APP_KEY="sua_chave_aqui"
OMIE_APP_SECRET="seu_segredo_aqui"
OMIE_BASE_URL="https://app.omie.com.br"
```

**Considerações de performance:**
1. **Cache**: Habilitar cache reduz latência e chamadas externas
2. **Pagination**: Ajustar `nRegPorPagina` conforme volume de produtos
3. **Timeout**: Configurar timeout adequado para ambiente de produção

---

## ⚠️ Considerações Importantes

### **Variação da API Omie**
- A estrutura de resposta pode variar por conta/empresa
- O gateway implementa extração defensiva para lidar com variações
- Recomenda-se testar em ambiente de staging antes de produção

### **Limitações**
- **Latência**: Consultas paginadas podem ser mais lentas
- **Volume**: Muitos produtos podem exigir múltiplas páginas
- **Atualização**: Dados em cache podem estar desatualizados (TTL)

### **Monitoramento**
- Taxa de sucesso das consultas
- Tempo médio de resposta
- Detecções de REDUNDANT
- Uso de cache (hit/miss ratio)

---

## 🔗 Relacionamento com Outros Módulos

- **API 2**: Consulta este endpoint para obter posição de estoque
- **Products Module**: Usa dados de estoque para catálogo público
- **Production Orders**: Verifica disponibilidade antes de criar ordens
- **Alerts Module**: Monitora estoque crítico baseado nestes dados

---

## 📈 Melhorias Futuras

1. **Bulk Queries**: Consultar múltiplos produtos em uma chamada
2. **Delta Updates**: Atualizar apenas estoques que mudaram
3. **Predictive Cache**: Pré-carregar estoque de produtos frequentes
4. **Health Checks**: Monitorar saúde da integração Omie
5. **Retry Strategies**: Implementar retry com backoff exponencial

---

## 🧪 Testes

**Cenários recomendados:**
1. **Produto existente**: Retorna posição consolidada
2. **Produto inexistente**: Retorna total 0 com breakdown vazio
3. **Request inválido**: Retorna erro de validação
4. **Falha Omie**: Retorna erro interno com fallback apropriado
5. **Cache hit/miss**: Verificar comportamento com e sem cache