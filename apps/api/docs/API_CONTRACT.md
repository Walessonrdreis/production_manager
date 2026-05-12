# 📦 API Contract — Production Manager

_Última atualização automática: **11/05/2026, 20:20:54**_

---

## 🎯 Objetivo

Esta API expõe um **contrato público simples e estável** para consumo externo (ex.: BizChat).
O consumidor **não precisa conhecer Omie, jobs, banco ou histórico**.

---

## ✅ Endpoint público

### `GET /v1/products`

Catálogo público de produtos com estoque atual. Representa uma tabela lógica única para consumo externo (ex.: BizChat).

- **Chave externa**: `omieCode`

---

## 🧾 Campos retornados

| Campo | Tipo | Descrição |
|------|------|-----------|
| `omieCode` | string | Código único do produto (chave externa). |
| `description` | string | Descrição do produto. |
| `sku` | string | null | SKU do produto, se existir. |
| `stockQuantity` | string (decimal) | Quantidade atual em estoque. |
| `minimumStock` | string (decimal) | Estoque mínimo configurado. |
| `stockUpdatedAt` | ISO string | null | Data/hora da última atualização do estoque. |

---

## 📐 Regras do contrato

- Este é o único endpoint público para produtos + estoque
- Campos são atributos do recurso, não endpoints separados
- Se não houver estoque, stockQuantity = "0.0000" e stockUpdatedAt = null
- Endpoints públicos não chamam a API do Omie em tempo real
- Chave externa sempre é omieCode

---

## 🔍 Descoberta (DX)

- Use ?describe=true para descobrir o schema via API (quando implementado)
- Use ?pretty=true para resposta formatada (quando habilitado)

---

## 🚫 O que **não** é endpoint

- ❌ `/v1/products/stockQuantity`
- ❌ `/v1/products/sku`
- ❌ `/v1/products/minimumStock`

> Campos são **atributos do recurso**, não endpoints separados.

---

## 🧪 Exemplo

### Request

```http
GET /v1/products?page=1&pageSize=50
```

### Response

```json
{
  "data": [
    {
      "omieCode": "XTE",
      "description": "Chá Tarde de Domingo",
      "sku": null,
      "stockQuantity": "42.0000",
      "minimumStock": "10.0000",
      "stockUpdatedAt": "2026-04-16T14:22:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "total": 1
  }
}
```

---

## 🧠 Observações finais

- Este contrato é **estável** durante o ciclo do MVP
- Mudanças devem ocorrer apenas com versionamento (`/v2`)
- Para estado interno, use endpoints `/v1/admin/*`
