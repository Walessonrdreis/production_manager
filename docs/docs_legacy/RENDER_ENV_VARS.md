# Environment Variables para Deploy no Render

## 📋 Variáveis Obrigatórias

### 1. Banco de Dados (PostgreSQL)
| Variável | Valor Exemplo | Descrição |
|----------|---------------|-----------|
| `DATABASE_URL` | `postgresql://user:password@host:5432/database?schema=public` | URL de conexão com o PostgreSQL do Render |

### 2. Configuração da API Omie
| Variável | Valor Exemplo | Descrição |
|----------|---------------|-----------|
| `OMIE_APP_KEY` | `3830837835825` | Chave da aplicação Omie |
| `OMIE_APP_SECRET` | `fa30baf859eaf8a1f0b1e7b209013775` | Segredo da aplicação Omie |
| `OMIE_BASE_URL` | `https://app.omie.com.br/api/v1/` | URL base da API Omie |

### 3. Configuração do Servidor
| Variável | Valor Exemplo | Descrição |
|----------|---------------|-----------|
| `PORT` | `3333` | Porta onde o servidor vai rodar (Render define automaticamente) |
| `NODE_ENV` | `production` | Ambiente de execução |
| `CORS_ORIGIN` | `*` ou URL específica | Origem permitida para CORS |

## ⚙️ Variáveis Opcionais (Jobs)

### 4. Jobs de Sincronização
| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `ENABLE_STOCK_REFRESH_JOB` | `true` | Habilita job de refresh de estoque |
| `STOCK_REFRESH_CRON` | `*/5 * * * *` | Cron expression para refresh de estoque (a cada 5 minutos) |
| `ENABLE_OMIE_PRODUCT_SYNC_JOB` | `true` | Habilita job de sincronização de produtos Omie |
| `OMIE_PRODUCT_SYNC_CRON` | `*/30 * * * *` | Cron expression para sincronização de produtos (a cada 30 minutos) |
| `OMIE_ORDERS_STAGE_SYNC` | `true` | Habilita job de sincronização de pedidos etapa 20 |
| `OMIE_ORDERS_STAGE20_CRON` | `*/10 * * * *` | Cron expression para sincronização de pedidos (a cada 10 minutos) |

### 5. Configurações Avançadas
| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `LOG_LEVEL` | `info` | Nível de logging (`error`, `warn`, `info`, `debug`) |
| `API_RATE_LIMIT` | `1000` | Limite de requisições por minuto |
| `JWT_SECRET` | (gerar) | Segredo para JWT (se usar autenticação) |

## 🚀 Configuração no Render Dashboard

### Passo a Passo:
1. **Acesse o Dashboard do Render**
   - Vá para seu serviço da API

2. **Vá para "Environment"**
   - Clique na aba "Environment" no menu lateral

3. **Adicione as Variáveis:**
   ```
   DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]?schema=public
   OMIE_APP_KEY=3830837835825
   OMIE_APP_SECRET=fa30baf859eaf8a1f0b1e7b209013775
   OMIE_BASE_URL=https://app.omie.com.br/api/v1/
   NODE_ENV=production
   CORS_ORIGIN=*
   ```

4. **Variáveis de Jobs (opcional):**
   ```
   ENABLE_STOCK_REFRESH_JOB=true
   STOCK_REFRESH_CRON=*/5 * * * *
   ENABLE_OMIE_PRODUCT_SYNC_JOB=true
   OMIE_PRODUCT_SYNC_CRON=*/30 * * * *
   OMIE_ORDERS_STAGE_SYNC=true
   OMIE_ORDERS_STAGE20_CRON=*/10 * * * *
   ```

## 🔧 Script de Build/Deploy Recomendado

### No Render, configure:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

### Ou use este script personalizado (`render-build.sh`):
```bash
#!/bin/bash

echo "🚀 Iniciando build no Render..."

# Instalar dependências
npm ci --only=production

# Gerar cliente Prisma
npx prisma generate

# Build do projeto
npm run build

# Resolver migrações falhadas (se houver)
npx prisma migrate resolve --applied "20260508213903_add_omie_production_orders" || true

echo "✅ Build concluído!"
```

## 🐛 Solução de Problemas

### Erro P3009 (Migração Falhada)
Se encontrar o erro `P3009: migrate found failed migrations`:

1. **Acesse o terminal do Render:**
   - Vá para o serviço → Clique em "Shell"

2. **Execute o comando de resolução:**
   ```bash
   npx prisma migrate resolve --applied "20260508213903_add_omie_production_orders"
   ```

3. **Ou execute nosso script:**
   ```bash
   npm run db:fix:failed
   ```

### Banco de Dados não Conecta
1. Verifique se o `DATABASE_URL` está correto
2. Confirme se o banco PostgreSQL do Render está ativo
3. Verifique se há regras de firewall bloqueando a conexão

## 📊 Verificação Pós-Deploy

Após o deploy, teste os endpoints:

```bash
# Teste de saúde
curl https://seu-app.onrender.com/health

# Listar ordens de produção
curl https://seu-app.onrender.com/v1/admin/omie/production-orders

# Estatísticas
curl https://seu-app.onrender.com/v1/admin/omie/production-orders/stats
```

## 🔐 Segurança

### Variáveis Sensíveis:
- `OMIE_APP_SECRET` - Mantenha sempre secreta
- `DATABASE_URL` - Contém credenciais do banco
- `JWT_SECRET` (se usar) - Gere um valor forte

### Recomendações:
1. Use segredos fortes e únicos
2. Não comite variáveis sensíveis no Git
3. Revise permissões regularmente
4. Use HTTPS sempre

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Render Dashboard
2. Confirme todas as variáveis de ambiente
3. Teste localmente primeiro
4. Consulte a documentação do Prisma para erros de migração