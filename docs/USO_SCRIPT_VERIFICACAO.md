# Guia de Uso: Script de Verificação Automática

## 📋 Visão Geral

Este script verifica automaticamente todos os pré-requisitos necessários para iniciar a **Etapa 2** do projeto. Ele testa desde o ambiente básico até a configuração específica do projeto.

## 🚀 Como Usar

### **Opção 1: Execução Simples (Recomendada)**
```powershell
# Navegue até a raiz do projeto
cd c:\Users\walll\OneDrive\projects_git\production_manager

# Execute o script
.\scripts\verificar-etapa2-v2.ps1
```

### **Opção 2: Execução Direta**
```powershell
# Execute de qualquer lugar
powershell -ExecutionPolicy Bypass -File "C:\Users\walll\OneDrive\projects_git\production_manager\scripts\verificar-etapa2-v2.ps1"
```

### **Opção 3: Execução com Permissões Elevadas**
```powershell
# Se encontrar erros de permissão
powershell -ExecutionPolicy Bypass -File ".\scripts\verificar-etapa2-v2.ps1" -Verb RunAs
```

## 🔍 O que o Script Verifica

### **1. Diretório Atual**
- ✅ Verifica se você está no diretório correto do projeto
- ❌ Erro: Se não estiver em `*production_manager*`

### **2. Node.js e pnpm**
- ✅ Versão do Node.js instalada
- ✅ Versão do pnpm instalada
- ❌ Erro: Se algum não estiver instalado

### **3. Variáveis de Ambiente (.env)**
- ✅ Arquivo `.env` existe
- ✅ `OMIE_APP_KEY` configurada
- ✅ `OMIE_APP_SECRET` configurada  
- ✅ `DATABASE_URL` configurada
- ✅ `REDIS_URL` configurada (nova para Etapa 2)
- ⚠️ Atenção: Se alguma variável estiver faltando

### **4. Dependências do Projeto**
- ✅ Arquivo `package.json` existe
- ✅ Diretório `node_modules` existe
- ⚠️ Atenção: Se `node_modules` não existir

### **5. Prisma e Banco de Dados**
- ✅ Status das migrações Prisma
- ⚠️ Atenção: Se houver migrações pendentes

### **6. Redis**
- ✅ `REDIS_URL` configurada no `.env`
- ℹ️ Informação: Como testar conexão manualmente

### **7. Estrutura de Diretórios**
- ✅ `apps\api\src\modules`
- ✅ `apps\api\src\shared`
- ✅ `apps\api\src\infra`
- ✅ `.trae\rules`
- ✅ `docs`
- ❌ Erro: Se algum diretório não existir

### **8. Documentação da Etapa 2**
- ✅ `ETAPA_2_PRODUCAO.md`
- ✅ `ENDPOINTS_OMPLETE_LISTA.md`
- ✅ `ANALISE_ENDPOINTS_CRITICOS.md`
- ✅ `SISTEMA_MONITORAMENTO_ESTOQUE.md`
- ✅ `DASHBOARD_PRODUCAO_TEMPO_REAL.md`
- ✅ `RESUMO_ETAPA_2_PRODUCAO.md`
- ✅ `COMPATIBILIDADE_API_ATUAL.md`
- ⚠️ Atenção: Se algum documento não existir

## 📊 Interpretando os Resultados

### **Status: PRONTO PARA ETAPA 2 (90%+)**
```
🎉 STATUS: PRONTO PARA ETAPA 2 (95%)
   Você pode iniciar as fases de implementação!
```
**Ação:** Você pode começar a Etapa 2 imediatamente!

### **Status: QUASE PRONTO (70-89%)**
```
⚠️ STATUS: QUASE PRONTO (75%)
   Corrija os itens em vermelho antes de começar
```
**Ação:** Corrija os itens marcados com ❌ ERRO

### **Status: NÃO PRONTO (<70%)**
```
❌ STATUS: NÃO PRONTO (50%)
   Corrija os problemas listados acima
```
**Ação:** Corrija todos os problemas antes de continuar

## 🛠️ Solução de Problemas Comuns

### **Problema 1: Erro de Execução de Script**
```
Erro: A execução de scripts foi desabilitada neste sistema.
```
**Solução:**
```powershell
# Abra PowerShell como Administrador e execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Problema 2: Node.js não encontrado**
```
ERRO Node.js não encontrado!
```
**Solução:**
1. Baixe e instale Node.js: https://nodejs.org/
2. Reinicie o terminal
3. Verifique: `node --version`

### **Problema 3: pnpm não encontrado**
```
ERRO pnpm não encontrado!
```
**Solução:**
```powershell
npm install -g pnpm
```

### **Problema 4: Arquivo .env não encontrado**
```
ERRO Arquivo .env não encontrado!
```
**Solução:**
1. Crie o arquivo: `apps\api\.env`
2. Adicione as variáveis necessárias:
```
OMIE_APP_KEY=sua_chave_aqui
OMIE_APP_SECRET=sua_chave_secreta_aqui
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
```

### **Problema 5: Redis não configurado**
```
ATENCAO REDIS_URL não configurado
```
**Solução:**
1. Instale Redis: https://redis.io/docs/install/install-redis/
2. Adicione ao `.env`: `REDIS_URL=redis://localhost:6379`
3. Teste: `redis-cli ping`

## 📝 Exemplo de Saída Bem-sucedida

```
=========================================
VERIFICACAO DE PRE-REQUISITOS - ETAPA 2
=========================================
Data: 10/05/2026 14:30:00

[1/8] Verificando diretorio atual...
   OK Diretorio: C:\Users\walll\OneDrive\projects_git\production_manager

[2/8] Verificando Node.js e pnpm...
   OK Node.js: v18.17.0
   OK pnpm: v8.15.0

[3/8] Verificando variaveis de ambiente...
   OK Arquivo .env encontrado
   OK OMIE_APP_KEY configurado
   OK OMIE_APP_SECRET configurado
   OK DATABASE_URL configurado
   OK REDIS_URL configurado

[4/8] Verificando dependencias...
   OK package.json encontrado
   OK node_modules encontrado

[5/8] Verificando Prisma e banco de dados...
   OK Migracoes Prisma atualizadas

[6/8] Verificando conexao Redis...
   OK REDIS_URL configurado: redis://localhost:6379

[7/8] Verificando estrutura do projeto...
   OK apps\api\src\modules
   OK apps\api\src\shared
   OK apps\api\src\infra
   OK .trae\rules
   OK docs

[8/8] Verificando documentacao da Etapa 2...
   OK docs\ETAPA_2_PRODUCAO.md
   OK docs\ENDPOINTS_OMPLETE_LISTA.md
   OK docs\ANALISE_ENDPOINTS_CRITICOS.md
   OK docs\SISTEMA_MONITORAMENTO_ESTOQUE.md
   OK docs\DASHBOARD_PRODUCAO_TEMPO_REAL.md
   OK docs\RESUMO_ETAPA_2_PRODUCAO.md
   OK docs\COMPATIBILIDADE_API_ATUAL.md

=========================================
RESUMO DA VERIFICACAO
=========================================
   OK Diretorio correto
   OK Node.js instalado
   OK pnpm instalado
   OK Arquivo .env
   OK package.json
   OK Estrutura basica
   OK Documentacao

STATUS: PRONTO PARA ETAPA 2 (100%)
   Você pode iniciar as fases de implementacao!

=========================================
PROXIMOS PASSOS
=========================================
1. Inicie a API: cd apps\api && pnpm dev
2. Teste endpoints: curl http://localhost:3333/v1/products
3. Quando estiver funcionando, avise para iniciarmos a Fase 1!
```

## 🔄 Fluxo de Trabalho Recomendado

### **Antes de Iniciar a Etapa 2:**
1. Execute o script de verificação
2. Corrija todos os itens com ❌ ERRO
3. Execute novamente até obter 90%+

### **Quando Estiver Pronto:**
1. Inicie a API: `cd apps\api && pnpm dev`
2. Teste endpoints básicos
3. Avise para iniciarmos a **Fase 1**

## 📞 Suporte

Se encontrar problemas com o script:

1. **Verifique os logs de erro** mostrados no terminal
2. **Consulte este documento** para soluções comuns
3. **Execute em modo debug** (adicione `-Debug` ao comando)
4. **Entre em contato** se o problema persistir

---

**Pronto para começar?** Execute o script e veja se está tudo OK! 🚀