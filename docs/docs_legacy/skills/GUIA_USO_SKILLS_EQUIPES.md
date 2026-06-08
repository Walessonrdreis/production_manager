# GUIA DE USO DOS SKILLS PARA EQUIPES

## 🎯 VISÃO GERAL DOS SKILLS

### SKILLS DISPONÍVEIS:
1. **`@fase-1-polling`** - API Core (Dias 1-10)
2. **`@fase-2-cache`** - API Avançada (Dias 11-20)  
3. **`@fase-3-dashboard`** - Frontend (Dias 21-40)
4. **`@fase-4-alertas`** - API Avançada (Dias 11-20)

### PRINCÍPIO FUNDAMENTAL:
- **API-First**: Desenvolver API completa antes de qualquer frontend
- **Revisão obrigatória**: Cada fase precisa de revisão do skill correspondente
- **Trabalho incremental**: Máximo 3 arquivos por ação, 15 minutos por ação

## 📋 COMO USAR OS SKILLS

### 1. INICIAR UMA FASE
```bash
# 1. Verificar pré-requisitos
./scripts/verificar-etapa2-v2.ps1

# 2. Ler o prompt da fase
cat .trae/skills/fase-1-polling/PROMPT.md

# 3. Iniciar desenvolvimento seguindo passo a passo
```

### 2. SOLICITAR REVISÃO
```bash
# Após implementar uma funcionalidade, solicite revisão:
# Use a menção do skill correspondente

@fase-1-polling # Para revisão de polling inteligente
@fase-2-cache    # Para revisão de cache multi-nível
@fase-3-dashboard # Para revisão de frontend dashboard
@fase-4-alertas  # Para revisão de sistema de alertas avançado
```

### 3. RESPONDER À REVISÃO
```bash
# 1. Corrigir problemas identificados
# 2. Executar testes novamente
# 3. Confirmar correções com o skill
```

## 🚀 GUIA POR EQUIPE

### EQUIPE API CORE (Abordagem 2)

#### FASE 1: API CORE (Dias 1-10)
**Skill**: `@fase-1-polling`
**Objetivo**: API básica estável com endpoints críticos

**Passo a passo:**
1. **Dia 1-2**: Endpoints de sincronização (`POST /api/sync/*`)
   - `SyncStock.ts`, `SyncOrders.ts`
   - Testes unitários e integração
   - Revisão: `@fase-1-polling`

2. **Dia 3-4**: Sistema de alertas básico (`GET /api/alerts/*`)
   - `AlertService.ts`, `AlertRoutes.ts`
   - Integração com polling
   - Revisão: `@fase-1-polling`

3. **Dia 5**: Documentação OpenAPI inicial
   - `openapi.yaml`
   - Testes de documentação
   - Revisão: `@fase-1-polling`

4. **Dia 6-7**: Sistema de fila de produção
   - `ProductionQueueService.ts`
   - Endpoints REST
   - Revisão: `@fase-1-polling`

5. **Dia 8-9**: Integração vendas→produção
   - `SalesToProductionIntegration.ts`
   - Webhooks e triggers
   - Revisão: `@fase-1-polling`

6. **Dia 10**: Otimização e testes finais
   - Performance tuning
   - Testes end-to-end
   - Revisão final: `@fase-1-polling`

#### FASE 2: API AVANÇADA (Dias 11-20)
**Skill**: `@fase-2-cache`
**Objetivo**: API completa versão 1.0

**Passo a passo:**
1. **Dia 11-12**: Métricas e KPIs (`GET /api/metrics/*`)
   - `ProductionMetricsService.ts`
   - Cache com Redis
   - Revisão: `@fase-2-cache`

2. **Dia 13-14**: Previsão de demanda (`POST /api/forecast/*`)
   - `DemandForecastService.ts`
   - Integração ML básica
   - Revisão: `@fase-2-cache`

3. **Dia 15**: Relatórios avançados (`GET /api/reports/*`)
   - `ReportGeneratorService.ts`
   - PDF generation
   - Revisão: `@fase-2-cache`

4. **Dia 16-17**: Testes end-to-end
   - Cypress tests
   - API contract tests
   - Revisão: `@fase-2-cache`

5. **Dia 18-19**: Performance e segurança
   - Rate limiting
   - Authentication
   - Revisão: `@fase-2-cache`

6. **Dia 20**: API v1.0 pronta
   - Deploy staging
   - Documentação completa
   - Revisão final: `@fase-2-cache`

### EQUIPE FRONTEND

#### FASE 3: DASHBOARD (Dias 21-40)
**Skill**: `@fase-3-dashboard`
**Pré-requisito**: API v1.0 estável

**Passo a passo:**
1. **Dia 21-22**: Setup React + TypeScript + Tailwind
   - `vite.config.ts`, `tailwind.config.js`
   - Revisão: `@fase-3-dashboard`

2. **Dia 23-24**: Layout base e navegação
   - `Layout.tsx`, `Navigation.tsx`
   - Responsive design
   - Revisão: `@fase-3-dashboard`

3. **Dia 25**: Dashboard mínimo funcional
   - `Dashboard.tsx`, `KpiCards.tsx`
   - API integration
   - Revisão: `@fase-3-dashboard`

4. **Dia 26-27**: Gráficos e visualizações
   - `Charts.tsx`, `RealTimeUpdates.tsx`
   - WebSocket integration
   - Revisão: `@fase-3-dashboard`

5. **Dia 28-29**: Notificações frontend
   - `Notifications.tsx`, `AlertSystem.tsx`
   - Multi-channel alerts
   - Revisão: `@fase-3-dashboard`

6. **Dia 30**: Otimização performance
   - Code splitting
   - Bundle optimization
   - Revisão: `@fase-3-dashboard`

7. **Dia 31-32**: Testes E2E com Cypress
   - `cypress/e2e/dashboard.cy.ts`
   - User flow tests
   - Revisão: `@fase-3-dashboard`

8. **Dia 33-34**: Responsividade mobile/tablet
   - Mobile-first design
   - Cross-browser testing
   - Revisão: `@fase-3-dashboard`

9. **Dia 35**: SEO e acessibilidade
   - Meta tags
   - ARIA labels
   - Revisão: `@fase-3-dashboard`

10. **Dia 36-40**: Deploy e ajustes finais
    - Production deployment
    - Monitoring setup
    - Revisão final: `@fase-3-dashboard`

### EQUIPE API INTERMEDIÁRIA (Abordagem 1)

**Timeline**: 26 semanas (paralelo às outras equipes)
**Skills**: Desenvolvimento próprio (não usa skills de fase)

**Coordenar com:**
- **Equipe API Core**: Compartilhar padrões e aprendizados
- **Equipe Frontend**: Manter compatibilidade de APIs

## 📊 CHECKLIST DE QUALIDADE POR FASE

### ✅ FASE 1 - API CORE (`@fase-1-polling`)
- [ ] **Endpoints REST**: Todos funcionando com status codes corretos
- [ ] **Testes unitários**: 80%+ cobertura para services
- [ ] **Testes integração**: Endpoints testados com database real
- [ ] **Documentação**: OpenAPI básica gerada
- [ ] **Performance**: Response time < 500ms para endpoints críticos
- [ ] **Logs**: Sucessos e falhas registradas adequadamente
- [ ] **Error handling**: Exceptions tratadas com mensagens claras

### ✅ FASE 2 - API AVANÇADA (`@fase-2-cache`)
- [ ] **Cache implementado**: Redis configurado e funcionando
- [ ] **Métricas**: Endpoints de KPIs com dados atualizados
- [ ] **Previsão**: Sistema básico de forecast funcionando
- [ ] **Relatórios**: PDF generation testada
- [ ] **Segurança**: Authentication e rate limiting implementados
- [ ] **Performance**: Cache hit rate > 70%
- [ ] **Testes E2E**: Fluxos completos testados com Cypress

### ✅ FASE 3 - FRONTEND (`@fase-3-dashboard`)
- [ ] **Componentes React**: Todos funcionando com TypeScript
- [ ] **API integration**: Consumo correto de endpoints REST
- [ ] **WebSocket**: Conexões persistentes funcionando
- [ ] **Responsividade**: Funciona em mobile, tablet, desktop
- [ ] **Testes E2E**: Fluxos de usuário testados com Cypress
- [ ] **Performance**: Lighthouse score > 80
- [ ] **Acessibilidade**: ARIA labels, keyboard navigation

### ✅ FASE 4 - ALERTAS AVANÇADOS (`@fase-4-alertas`)
- [ ] **AdvancedAlertService**: Regras complexas implementadas
- [ ] **Machine Learning**: Integração básica com ML
- [ ] **Multi-canal**: Email, SMS, WebSocket funcionando
- [ ] **Dashboard gestão**: Interface REST para configuração
- [ ] **Testes avançados**: Regras ML testadas adequadamente
- [ ] **Performance**: Alertas gerados em < 5 segundos
- [ ] **Integração**: Funciona com métricas e previsão

## ⚠️ REGRAS CRÍTICAS DE USO

### 1. **NENHUM FRONTEND ANTES DO DIA 21**
- Proibido desenvolver React/HTML/CSS antes da API v1.0
- Frontend apenas consome APIs estáveis
- Violação: Revisão rejeitada automaticamente

### 2. **REVISÃO OBRIGATÓRIA POR FASE**
- Cada funcionalidade precisa de revisão do skill correspondente
- Sem revisão: Não considerar como concluído
- Revisão rejeitada: Corrigir e solicitar nova revisão

### 3. **TRABALHO INCREMENTAL**
- Máximo 3 arquivos por ação
- Máximo 15 minutos por ação
- Progresso visível passo a passo
- Violação: Interromper e dividir em ações menores

### 4. **TDD OBRIGATÓRIO**
- Teste primeiro (RED)
- Implementação mínima (GREEN)
- Refatoração (REFACTOR)
- Violação: Revisão rejeitada

### 5. **COMPATIBILIDADE COM APLICAÇÕES EXISTENTES**
- APIs mantêm contratos existentes
- Não quebrar aplicações em produção
- Versionamento para breaking changes

## 🔧 FERRAMENTAS E SCRIPTS

### SCRIPTS DE VERIFICAÇÃO:
```bash
# Verificar pré-requisitos da Etapa 2
./scripts/verificar-etapa2-v2.ps1

# Testar endpoints da API
./scripts/testar-endpoints-simples.ps1

# Monitoramento contínuo
./scripts/iniciar-monitoramento-etapa2.ps1
```

### DOCUMENTAÇÃO:
```bash
# Plano completo da Etapa 2
docs/ETAPA_2_API_FIRST_DETALHADO.md

# Coordenação de equipes
.trae/skills/COORDENACAO_EQUIPES_API_FIRST.md

# Regras de trabalho incremental
.trae/rules/trabalho-incremental.md
```

## 📞 SUPORTE E ESCALAÇÃO

### PROBLEMAS TÉCNICOS:
1. **Tentar resolver** com base na documentação
2. **Consultar skill** correspondente para revisão
3. **Escalar para agente principal** se skill não resolver

### BLOQUEIOS DE COORDENAÇÃO:
1. **Revisar** `COORDENACAO_EQUIPES_API_FIRST.md`
2. **Sincronizar** com outras equipes no daily sync
3. **Documentar** decisões para referência futura

### QUALIDADE INSUFICIENTE:
1. **Revisar checklist** da fase correspondente
2. **Corrigir** problemas identificados
3. **Solicitar nova revisão** após correções

---

**ÚLTIMA ATUALIZAÇÃO**: 2026-05-10  
**VERSÃO**: 1.0  
**PRÓXIMA REVISÃO**: Após conclusão da Fase 1 (Dia 10)