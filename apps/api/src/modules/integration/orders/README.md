# Módulo de Integração de Pedidos (Orders)

Este módulo gerencia a integração de pedidos de venda (stage 20) com sistemas externos (Omie), seguindo o padrão Clean Architecture.

## 📋 Rotas Disponíveis

### 1. **POST** `/v1/integration/orders/stage20`
Consulta pedidos de venda na etapa 20 (prontos para produção).

**Request Body:**
- Nenhum corpo necessário

**Responses:**

**Caso 1: Integração desabilitada (`OMIE_STAGE20_SYNC_ENABLED="false"`)**
- `200 OK`: Retorna lista vazia (modo passivo)
  ```json
  {
    "success": true,
    "data": {
      "orders": [],
      "reason": "MANUAL_SYNC_ONLY"
    }
  }
  ```

**Caso 2: Integração habilitada mas desativada para uso direto**
- `503 Service Unavailable`: Orienta usar sync manual
  ```json
  {
    "success": false,
    "error": "INTEGRATION_DISABLED",
    "message": "Integração Omie para pedidos (stage20) desabilitada. Use POST /v1/admin/omie/orders/stage20/sync quando necessário."
  }
  ```

---

## 🏗️ Arquitetura

```
orders/
├── application/
│   └── get-orders-stage20.usecase.ts
├── infrastructure/
│   └── omie-orders-stage20.gateway.ts
├── presentation/
│   └── http/
│       └── orders-stage20.controller.ts
├── register-orders-module.ts
└── README.md
```

---

## ⚙️ Configuração

**Variáveis de Ambiente:**
- `OMIE_STAGE20_SYNC_ENABLED`: `"false"` (default) ou `"true"`
  - `"false"`: Retorna lista vazia (200 OK) - modo passivo
  - `"true"`: Retorna 503 orientando sync manual

**Credenciais Omie (se necessário):**
- `OMIE_APP_KEY`: Chave da API Omie
- `OMIE_APP_SECRET`: Segredo da API Omie
- `OMIE_BASE_URL`: URL base da API Omie (default: `"https://app.omie.com.br"`)

---

## 🔄 Fluxo de Integração

1. **API 2 / Frontend** → Solicita pedidos stage 20 via `POST /v1/integration/orders/stage20`
2. **API 1** → Verifica `OMIE_STAGE20_SYNC_ENABLED`
   - Se `"false"`: Retorna `200 OK` com lista vazia
   - Se `"true"`: Retorna `503` orientando sync manual
3. **Admin** → Executa sync manual via `POST /v1/admin/omie/orders/stage20/sync` quando necessário

---

## 🎯 Objetivo do Módulo

**Proteger contra chamadas REDUNDANT à API Omie** durante desenvolvimento/teste:

- **Problema**: Chamadas indiretas (front/API2/admin/enriched) podem disparar integração Omie automaticamente
- **Solução**: Este endpoint atua como **guardrail** para estabilização
- **Política**: 
  - Em produção de teste: retorna lista vazia (neutro)
  - Em produção real: orienta usar sync manual controlado

---

## 🧪 Modos de Operação

### **Modo Passivo (Recomendado para Dev/Test)**
```bash
OMIE_STAGE20_SYNC_ENABLED="false"
```
- Retorna `200 OK` com `orders: []`
- Não faz chamadas externas
- Permite desenvolvimento sem risco de REDUNDANT

### **Modo Ativo (Sync Manual)**
```bash
OMIE_STAGE20_SYNC_ENABLED="true"
```
- Retorna `503` orientando sync manual
- Admin executa sync via endpoint dedicado
- Controle total sobre quando integrar

---

## 📊 Estrutura de Dados (Stage 20)

**Pedido Stage 20:**
```typescript
{
  omieOrderCode: string;      // Código do pedido no Omie
  stage: string;              // "20" (pronto para produção)
  clientCode: string;         // Código do cliente
  clientName: string;         // Nome do cliente
  forecastDate?: string;      // Data prevista (opcional)
  items: Array<{
    productCode: string;      // Código do produto
    description?: string;     // Descrição (opcional)
    quantity: number;         // Quantidade
    unit?: string;            // Unidade (opcional)
  }>;
}
```

---

## 🔒 Segurança

- **API 1** é a única responsável por integrações externas
- **Endpoints públicos** não disparam integração automática
- **Sync manual** requer endpoint admin dedicado
- **Cache TTL**: 60 segundos para reduzir chamadas REDUNDANT

---

## 🚀 Uso em Produção

**Para desenvolvimento/teste:**
```bash
OMIE_STAGE20_SYNC_ENABLED="false"
```
- Frontend/API2 podem chamar sem risco
- Retorna resposta neutra (lista vazia)

**Para produção real:**
```bash
OMIE_STAGE20_SYNC_ENABLED="true"
```
- Endpoint público orienta usar sync manual
- Admin controla quando sincronizar
- Evita consumo redundante da API Omie

---

## ⚠️ Considerações Importantes

1. **REDUNDANT Detection**: O gateway detecta erros `"REDUNDANT"` da API Omie e retorna código específico
2. **Cache Safety**: Cache de 60s evita chamadas excessivas mas mantém dados atualizados
3. **Error Handling**: Erros da API Omie são normalizados e tratados adequadamente
4. **Backward Compatibility**: Estrutura mantém compatibilidade com sistemas existentes

---

## 🔗 Relacionamento com Outros Módulos

- **API 2**: Consulta este endpoint para obter pedidos stage 20
- **Admin Module**: Fornece endpoint para sync manual (`/v1/admin/omie/orders/stage20/sync`)
- **Omie Integration**: Usa client com circuit breaker para resiliência

---

## 📈 Monitoramento

**Métricas recomendadas:**
- Taxa de chamadas ao endpoint
- Detecções de REDUNDANT
- Tempo de resposta do cache vs API Omie
- Erros de integração

**Logs importantes:**
- Entrada/saída do controller
- Erros do gateway Omie
- Ativações de circuit breaker