# Customer Sync — Routes

## 🚀 Comandos (POST)

### Sync de 1 cliente

```
POST /v1/integration/customer-sync/:customerCode/sync
```

**Payload:**
```json
{ "externalRequestId": "opcional" }
```

**Resposta (202):**
```json
{ "success": true, "data": { "status": "ACCEPTED", "externalRequestId": "..." } }
```

---

### Sync global

```
POST /v1/integration/customer-sync/sync-global
```

**Payload:**
```json
{ "externalRequestId": "opcional" }
```

---

## 📘 Read-models (GET)

### Listar clientes

```
GET /v1/admin/read/customers
```

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `q` | string | Busca por nome, código, CNPJ/CPF ou fantasia |
| `activeOnly` | boolean | `true` = apenas ativos |
| `limit` | number | Máx. itens (default: 100) |
| `offset` | number | Deslocamento |

---

### Cliente específico

```
GET /v1/admin/read/customers/:customerCode
```

---

### Estatísticas

```
GET /v1/admin/read/customers/stats
```

**Resposta:**
```json
{ "success": true, "data": { "total": 500, "active": 480, "inactive": 20 } }
```

---

### Sumário (API2)

```
GET /v1/customers/summary
```

---

### Status do sync

```
GET /v1/integration/customer-sync/sync-status/:externalRequestId
```

| Status | Significado |
|--------|-------------|
| `ACCEPTED` | Processando |
| `CONFIRMED` | Concluído |
| `FAILED` | Falhou |

---

### Histórico de comandos

```
GET /v1/integration/customer-sync/sync-history?limit=20
```

---

### Falhas de sincronização

```
GET /v1/integration/customer-sync/sync-failures?limit=20
```

---

### Último sync global

```
GET /v1/integration/customer-sync/last-sync
```
