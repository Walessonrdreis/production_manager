# COORDENAÇÃO DE EQUIPES - ESTRATÉGIA API-FIRST

## 🎯 VISÃO GERAL DA ESTRATÉGIA

### DUAS EQUIPES EM PARALELO:
1. **EQUIPE API CORE (Abordagem 2)**: Desenvolve API melhorada sobre Omie (Dias 1-20)
2. **EQUIPE API INTERMEDIÁRIA (Abordagem 1)**: Desenvolve API independente do Omie (26 semanas)

### PRINCÍPIO FUNDAMENTAL:
- **API-First**: Desenvolver API completa antes de qualquer frontend
- **Compatibilidade**: APIs devem manter compatibilidade com aplicações existentes
- **Coordenação**: Equipes compartilham padrões e aprendizado

## 📅 CRONOGRAMA COORDENADO

### FASE 1: API CORE (Dias 1-10) - EQUIPE API CORE
**Objetivo**: API básica estável com endpoints críticos de produção
- **Dia 1-2**: Endpoints de sincronização (`POST /api/sync/*`)
- **Dia 3-4**: Sistema de alertas básico (`GET /api/alerts/*`)
- **Dia 5**: Documentação OpenAPI inicial
- **Dia 6-7**: Sistema de fila de produção
- **Dia 8-9**: Integração vendas→produção
- **Dia 10**: Otimização e testes

### FASE 2: API AVANÇADA (Dias 11-20) - EQUIPE API CORE
**Objetivo**: API completa versão 1.0 com funcionalidades avançadas
- **Dia 11-12**: Métricas e KPIs (`GET /api/metrics/*`)
- **Dia 13-14**: Previsão de demanda (`POST /api/forecast/*`)
- **Dia 15**: Relatórios avançados (`GET /api/reports/*`)
- **Dia 16-17**: Testes end-to-end
- **Dia 18-19**: Performance e segurança
- **Dia 20**: API v1.0 pronta para consumo

### FASE 3: FRONTEND DASHBOARD (Dias 21-40) - EQUIPE FRONTEND
**Objetivo**: Dashboard React completo consumindo API estável
- **Dia 21-22**: Setup React + TypeScript + Tailwind
- **Dia 23-24**: Layout base e navegação
- **Dia 25**: Dashboard mínimo funcional
- **Dia 26-27**: Gráficos e visualizações
- **Dia 28-29**: Notificações frontend
- **Dia 30**: Otimização performance
- **Dia 31-32**: Testes E2E com Cypress
- **Dia 33-34**: Responsividade mobile/tablet
- **Dia 35**: SEO e acessibilidade
- **Dia 36-40**: Deploy e ajustes finais

### FASE 4: API INTERMEDIÁRIA (Semanas 1-26) - EQUIPE API INTERMEDIÁRIA
**Objetivo**: API independente do Omie com migração gradual
- **Semanas 1-4**: Modelagem de domínio e schema
- **Semanas 5-8**: Endpoints básicos de produção
- **Semanas 9-12**: Sistema de sincronização bidirecional
- **Semanas 13-16**: Migração de dados gradual
- **Semanas 17-20**: Feature parity com API Core
- **Semanas 21-24**: Otimização e performance
- **Semanas 25-26**: Migração completa e sunset da API Core

## 🔄 FLUXO DE TRABALHO COORDENADO

### 1. COMPARTILHAMENTO DE PADRÕES
- **Arquitetura**: Clean Architecture em todos os módulos
- **Nomenclatura**: Verbo + Objeto (`SyncStock.ts`, `GetOrders.ts`)
- **Testes**: TDD obrigatório, 80%+ cobertura
- **Documentação**: OpenAPI para todas as APIs

### 2. INTEGRAÇÃO CONTÍNUA
- **API Core**: Deploy automático após merge em `main`
- **API Intermediária**: Deploy em staging após cada milestone
- **Frontend**: Deploy após API v1.0 estável

### 3. COMUNICAÇÃO ENTRE EQUIPES
- **Daily sync**: 15 minutos para alinhamento técnico
- **Weekly review**: Revisão de progresso e ajustes
- **Documentação compartilhada**: Todos acessam mesma base de conhecimento

## 📋 CHECKLIST DE COORDENAÇÃO

### ✅ PADRÕES COMPARTILHADOS
- [ ] **Clean Architecture**: Todos os módulos seguem camadas (presentation/application/infrastructure/domain)
- [ ] **TDD**: Ciclo RED-GREEN-REFACTOR obrigatório
- [ ] **SRP**: 1 arquivo = 1 intenção, granularidade extrema
- [ ] **Nomenclatura**: Verbo + Objeto para todos os arquivos
- [ ] **Documentação**: OpenAPI para endpoints públicos

### ✅ INTEGRAÇÃO TÉCNICA
- [ ] **API Core**: Endpoints REST funcionais e testados
- [ ] **API Intermediária**: Schema compatível com API Core
- [ ] **Frontend**: Consome apenas APIs estáveis (v1.0+)
- [ ] **Migração**: Plano claro de transição entre APIs

### ✅ COMUNICAÇÃO
- [ ] **Daily sync**: Equipes alinhadas diariamente
- [ ] **Documentação atualizada**: Todos têm acesso às especificações
- [ ] **Decisões registradas**: Mudanças arquiteturais documentadas
- [ ] **Problemas compartilhados**: Bloqueios discutidos entre equipes

## 🚀 PRÓXIMOS PASSOS PARA INÍCIO

### 1. EQUIPE API CORE (Início imediato)
```bash
# Executar script de verificação
./scripts/verificar-etapa2-v2.ps1

# Iniciar desenvolvimento Fase 1
# Usar skill: @fase-1-polling
```

### 2. EQUIPE API INTERMEDIÁRIA (Início após semana 1)
```bash
# Revisar documentação da Abordagem 1
docs/ABORDAGEM_1_API_INTERMEDIARIA_COMPLETA.md

# Planejar semanas 1-4 (modelagem)
```

### 3. EQUIPE FRONTEND (Início após dia 20)
```bash
# Aguardar API v1.0 estável
# Iniciar após confirmação da Equipe API Core
# Usar skill: @fase-3-dashboard
```

## ⚠️ REGRAS CRÍTICAS DE COORDENAÇÃO

### 1. **NENHUM FRONTEND ANTES DO DIA 21**
- Proibido desenvolver React/HTML/CSS antes da API v1.0
- Frontend apenas consome APIs estáveis

### 2. **COMPATIBILIDADE COM APLICAÇÕES EXISTENTES**
- APIs mantêm contratos existentes
- Não quebrar aplicações em produção
- Versionamento para breaking changes

### 3. **TRABALHO INCREMENTAL OBRIGATÓRIO**
- Máximo 3 arquivos por ação
- Máximo 15 minutos por ação
- Progresso visível passo a passo

### 4. **DOCUMENTAÇÃO ATUALIZADA**
- OpenAPI para todos os endpoints
- README por módulo
- Decisões arquiteturais registradas

## 📞 CONTATOS E RESPONSABILIDADES

### EQUIPE API CORE
- **Responsável**: Desenvolvimento API sobre Omie (Abordagem 2)
- **Skills**: `@fase-1-polling`, `@fase-2-cache`
- **Timeline**: Dias 1-20

### EQUIPE API INTERMEDIÁRIA
- **Responsável**: API independente do Omie (Abordagem 1)
- **Skills**: Desenvolvimento próprio (26 semanas)
- **Timeline**: Semanas 1-26

### EQUIPE FRONTEND
- **Responsável**: Dashboard React
- **Skills**: `@fase-3-dashboard`
- **Timeline**: Dias 21-40

### AGENTE DE REVISÃO PRINCIPAL
- **Responsável**: Revisão de todas as fases
- **Skills**: Todos os `@fase-*`
- **Função**: Garantir qualidade e aderência aos padrões

---

**ÚLTIMA ATUALIZAÇÃO**: 2026-05-10  
**VERSÃO**: 1.0  
**PRÓXIMA REVISÃO**: Após conclusão da Fase 1 (Dia 10)