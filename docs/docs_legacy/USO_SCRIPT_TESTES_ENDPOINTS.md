# Guia de Uso: Script de Teste de Endpoints

## 📋 Visão Geral

Este script testa automaticamente **todos os endpoints da API atual** para verificar se estão funcionando corretamente antes de iniciar a Etapa 2.

## 🚀 Scripts Disponíveis

### **1. Script Completo (Recomendado)**
```powershell
.\scripts\testar-endpoints.ps1
```
**Testa:** 18 endpoints em 5 categorias com relatório detalhado

### **2. Script Simplificado**
```powershell
.\scripts\testar-endpoints-simples.ps1
```
**Testa:** 5 endpoints principais (rápido)

## 🔍 O que Cada Script Testa

### **Script Completo (`testar-endpoints.ps1`):**

#### **1. Endpoints Meta (3 testes)**
- ✅ `/health` - Health check da API
- ✅ `/` - Página inicial  
- ✅ `/v1` - Lista de rotas da versão 1

#### **2. Endpoints Públicos (4 testes)**
- ✅ `/v1/products` - Catálogo público (BizChat)
- ✅ `/v1/products?q=cor` - Busca de produtos
- ✅ `/v1/orders` - Pedidos etapa 20
- ✅ `/v1/clients` - Clientes sincronizados

#### **3. Endpoints Admin (7 testes)**
- ✅ `/v1/admin/managed-products` - Produtos gerenciados
- ✅ `/v1/admin/sectors` - Setores de produção
- ✅ `/v1/admin/plans` - Planos de produção
- ✅ `/v1/admin/orders` - Pedidos (admin)
- ✅ `/v1/admin/orders/stage20` - Pedidos etapa 20 (admin)
- ✅ `/v1/admin/orders/stage20/enriched` - Pedidos enriquecidos

#### **4. Endpoints Omie (3 testes)**
- ✅ `/v1/admin/omie/products` - Produtos do Omie
- ✅ `/v1/admin/omie/categories` - Categorias do Omie
- ✅ `/v1/admin/omie/stock` - Estoque do Omie

#### **5. Testes de Erro (2 testes)**
- ✅ `/v1/products/999999999` - Produto inexistente (deve retornar 404)
- ✅ `/v1/nao-existe` - Endpoint inexistente (deve retornar 404)

**Total:** 19 testes automatizados

### **Script Simplificado (`testar-endpoints-simples.ps1`):**
- ✅ `/health` - API rodando
- ✅ `/` - Página inicial
- ✅ `/v1` - Rotas disponíveis
- ✅ `/v1/products` - Catálogo funcionando
- ✅ `/v1/orders` - Pedidos funcionando

**Total:** 5 testes rápidos

## 📊 Como Executar

### **Passo 1: Certifique-se que a API está rodando**
```powershell
# Abra um terminal separado e execute:
cd apps\api
pnpm dev

# A API deve iniciar na porta 3333
# Console deve mostrar: Server listening at http://localhost:3333
```

### **Passo 2: Execute o script de testes**
```powershell
# Em outro terminal, na raiz do projeto:
cd c:\Users\walll\OneDrive\projects_git\production_manager

# Para teste completo:
.\scripts\testar-endpoints.ps1

# Para teste rápido:
.\scripts\testar-endpoints-simples.ps1
```

### **Passo 3: Analise os resultados**
O script gera um relatório completo com:
- ✅ Estatísticas de sucesso/falha
- ✅ Taxa de sucesso por categoria
- ✅ Detalhes dos testes que falharam
- ✅ Recomendações específicas

## 🎯 Interpretando os Resultados

### **Cenário 1: Sucesso Total (90%+)**
```
🎉 EXCELENTE! API esta funcionando corretamente.
   Voce pode iniciar a Etapa 2 com confianca!
```
**Ação:** Inicie a Fase 1 imediatamente!

### **Cenário 2: Problemas Menores (70-89%)**
```
⚠️ ATENCAO: Alguns endpoints estao com problemas.
   Recomendamos corrigir antes de iniciar a Etapa 2.
```
**Ação:** Corrija os endpoints específicos que falharam

### **Cenário 3: Problemas Críticos (<70%)**
```
❌ CRITICO: A API esta com muitos problemas.
   Nao inicie a Etapa 2 ate resolver os problemas.
```
**Ação:** Diagnóstico completo da API

## 🔧 Solução de Problemas Comuns

### **Problema 1: API não está rodando**
```
❌ API NAO esta rodando em http://localhost:3333
```
**Solução:**
```powershell
# Terminal 1: Inicie a API
cd apps\api
pnpm dev

# Terminal 2: Execute os testes
cd ..
.\scripts\testar-endpoints.ps1
```

### **Problema 2: Erro de permissão no PowerShell**
```
Erro: A execução de scripts foi desabilitada neste sistema.
```
**Solução:**
```powershell
# Execute como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Problema 3: Endpoints admin retornam erro**
```
❌ /v1/admin/managed-products - Status: 500
```
**Solução:**
1. Verifique logs da API
2. Confirme conexão com banco de dados
3. Execute migrações Prisma: `npx prisma migrate deploy`

### **Problema 4: Endpoints Omie não funcionam**
```
❌ /v1/admin/omie/products - Status: 401
```
**Solução:**
1. Verifique variáveis `.env`: `OMIE_APP_KEY` e `OMIE_APP_SECRET`
2. Confira se as credenciais do Omie estão válidas

## 📝 Exemplo de Saída Bem-sucedida

```
=========================================
TESTE AUTOMATICO DE ENDPOINTS - API
=========================================
Data: 10/05/2026 15:45:00

[PRE-TEST] Verificando se API esta rodando...
   ✅ API esta rodando em http://localhost:3333

=========================================
EXECUTANDO TESTES DE ENDPOINTS
=========================================

=== ENDPOINTS META ===
[TEST-1] Testando: Health Check
   ✅ OK - Status: 200

[TEST-2] Testando: API Index  
   ✅ OK - Status: 200

[TEST-3] Testando: V1 Routes
   ✅ OK - Status: 200

=== ENDPOINTS PUBLICOS (BIZCHAT) ===
[TEST-4] Testando: Catalogo Publico
   ✅ OK - Status: 200

[TEST-5] Testando: Busca Produtos
   ✅ OK - Status: 200

=== ENDPOINTS ADMIN ===
[TEST-6] Testando: Produtos Gerenciados
   ✅ OK - Status: 200

=== ENDPOINTS OMIE ===
[TEST-7] Testando: Produtos Omie
   ✅ OK - Status: 200

=== TESTES DE ERRO ESPERADOS ===
[TEST-8] Testando: Produto Inexistente
   ✅ OK - Status esperado: 404

=========================================
RELATORIO DE TESTES
=========================================

📊 ESTATISTICAS:
   Total de testes: 19
   Testes aprovados: 18
   Testes reprovados: 1

📈 TAXA DE SUCESSO: 95%

📋 RESUMO POR CATEGORIA:
   Meta : 3/3 (100%)
   Publicos : 4/4 (100%)
   Admin : 6/7 (86%)
   Omie : 3/3 (100%)
   Erros : 2/2 (100%)

🎉 EXCELENTE! API esta funcionando corretamente.
   Voce pode iniciar a Etapa 2 com confianca!

   Proximos passos:
   1. Inicie a Fase 1 (Polling Inteligente)
   2. Teste os novos endpoints conforme forem implementados
   3. Monitore os logs durante a implementacao
```

## 🛠️ Comandos de Diagnóstico

### **Se os testes falharem, execute:**

```powershell
# 1. Verificar se API está rodando
curl http://localhost:3333/health

# 2. Testar endpoints manualmente
curl http://localhost:3333/v1/products?page=1&pageSize=5
curl http://localhost:3333/v1/orders?page=1&pageSize=5

# 3. Verificar logs da API
# (Observe o terminal onde a API está rodando)

# 4. Testar banco de dados
cd apps\api
npx prisma studio

# 5. Executar testes unitários
pnpm test
```

## 📈 Fluxo de Trabalho Recomendado

### **Antes de Iniciar a Etapa 2:**
1. **Execute o script completo:** `.\scripts\testar-endpoints.ps1`
2. **Verifique taxa de sucesso:** Deve ser 90%+
3. **Corrija problemas:** Siga recomendações do relatório
4. **Execute novamente:** Até obter 90%+

### **Durante a Implementação:**
1. **Teste após cada fase:** Verifique novos endpoints
2. **Monitore logs:** Identifique problemas rapidamente
3. **Execute testes rápidos:** `.\scripts\testar-endpoints-simples.ps1`

### **Após Cada Fase:**
1. **Valide endpoints novos:** Certifique-se que funcionam
2. **Teste endpoints existentes:** Garanta que não quebraram
3. **Documente mudanças:** Atualize documentação

## 🚀 Scripts de Suporte

### **1. Script de Verificação de Pré-requisitos**
```powershell
.\scripts\verificar-etapa2-v2.ps1
```
**Verifica:** Ambiente, dependências, configurações

### **2. Script de Teste de Endpoints**
```powershell
.\scripts\testar-endpoints.ps1
```
**Verifica:** Todos os endpoints da API

### **3. Script de Teste Rápido**
```powershell
.\scripts\testar-endpoints-simples.ps1
```
**Verifica:** Endpoints críticos (rápido)

## 📞 Suporte

### **Se encontrar problemas:**
1. **Verifique logs:** Script mostra erros detalhados
2. **Teste manualmente:** Use `curl` para endpoints específicos
3. **Consulte documentação:** `docs\` tem guias detalhados
4. **Verifique API:** Certifique-se que está rodando corretamente

### **Para diagnóstico avançado:**
```powershell
# Modo verbose (mostra mais detalhes)
$VerbosePreference = "Continue"
.\scripts\testar-endpoints.ps1

# Modo debug (mostra todas as etapas)
$DebugPreference = "Continue"
.\scripts\testar-endpoints.ps1
```

---

**Pronto para testar?** Execute o script e veja se sua API está 100% funcional! 🚀