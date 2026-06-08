# SISTEMA DE MONITORAMENTO CONTÍNUO - ETAPA 2

## 📋 VISÃO GERAL

Sistema de monitoramento em tempo real para garantir que todos os endpoints críticos da API continuem funcionando durante a implementação da Etapa 2. O sistema roda em background e alerta imediatamente se algum endpoint parar de funcionar.

## 🚀 COMO USAR

### 1. Inicialização Fácil
```powershell
# Execute do diretório raiz do projeto
.\scripts\iniciar-monitoramento.ps1
```

### 2. Modos Disponíveis

#### Modo 1: Dashboard Interativo
- Interface em tempo real com estatísticas
- Atualização automática a cada 60 segundos
- Visualização colorida do status de cada endpoint
- Comandos interativos: [R] Relatório, [S] Status, [L] Logs, [Q] Sair

#### Modo 2: Background Service
- Roda em segundo plano como job do PowerShell
- Logs automáticos em arquivo diário
- Ideal para execução contínua durante desenvolvimento
- Para parar: `Stop-Job -Id <ID>` e `Remove-Job -Id <ID>`

#### Modo 3: Teste Rápido
- Verificação rápida dos endpoints mais críticos
- Resultado imediato com resumo
- Útil para validação antes de commits

## 🔧 ENDPOINTS MONITORADOS

### Endpoints Críticos (Alertas Automáticos)
1. **Health Check** (`/health`) - Status geral da API
2. **Catálogo Público** (`/v1/products`) - Produtos para frontend
3. **Pedidos Etapa 20** (`/v1/orders`) - Pedidos vendidos (produção)
4. **Produtos Omie** (`/v1/admin/omie/products`) - Sincronização Omie

### Endpoints Importantes (Monitoramento)
5. **Produtos Gerenciados** (`/v1/admin/managed-products`) - Produtos internos
6. **Setores** (`/v1/admin/sectors`) - Setores de produção
7. **Planos Produção** (`/v1/admin/plans`) - Planejamento produção

## 🚨 SISTEMA DE ALERTAS

### Tipos de Alertas
1. **Alerta Crítico**: Endpoint crítico falhou
2. **Alerta de Performance**: Tempo de resposta > 500ms
3. **Alerta de Disponibilidade**: Taxa de sucesso < 95%

### Canais de Notificação
- **Console**: Mensagem colorida imediata
- **Arquivo de Log**: `monitoramento-YYYYMMDD.log`
- **Arquivo de Alerta**: `alertas\alerta-YYYYMMDD-HHMMSS.txt`
- **Email**: Se configurado (opcional)
- **Webhook**: Se configurado (opcional)

## 📊 MÉTRICAS COLETADAS

### Por Endpoint
- Total de verificações
- Verificações falhas
- Taxa de sucesso (%)
- Último status HTTP
- Tempo médio de resposta (ms)
- Histórico das últimas 100 verificações

### Gerais
- Uptime do monitoramento
- Total de alertas enviados
- Último alerta enviado
- Status geral da API

## 🛠️ CONFIGURAÇÃO

### Parâmetros do Script
```powershell
.\scripts\monitoramento-continuo.ps1 `
  -RunAsService `
  -CheckInterval 60 `
  -LogFile "monitoramento-personalizado.log" `
  -AlertEmail "dev@empresa.com" `
  -AlertWebhook "https://hooks.slack.com/..."
```

### Configuração de Endpoints
Para adicionar novos endpoints ao monitoramento, edite o array `$criticalEndpoints` no script principal:

```powershell
$criticalEndpoints = @(
  @{Name="Novo Endpoint"; Path="/v1/novo"; Method="GET"; ExpectedStatus=200; Critical=true},
  # ... endpoints existentes
)
```

## 📈 INTERPRETAÇÃO DOS RESULTADOS

### Status da API
- **✅ ESTÁVEL**: Taxa de sucesso ≥ 95%
- **⚠️  ATENÇÃO**: Taxa de sucesso 90-94%
- **❌ CRÍTICO**: Taxa de sucesso < 90%

### Recomendações
1. **API Estável**: Pode continuar implementação normalmente
2. **Problemas Menores**: Monitorar atentamente, verificar logs
3. **Problemas Críticos**: Parar implementação, corrigir antes de continuar

## 🔍 TROUBLESHOOTING

### Problemas Comuns

#### 1. API Não Está Rodando
```
❌ API NÃO está rodando em http://localhost:3333
Execute primeiro: cd apps\api && pnpm dev
```

**Solução**: Inicie a API antes do monitoramento.

#### 2. Endpoint Retorna Status Inesperado
```
⚠️ Catálogo Público - Status inesperado: 500 (esperado: 200)
```

**Solução**: Verificar logs da API, corrigir erro no endpoint.

#### 3. Tempo de Resposta Alto
```
✅ Health Check - OK (1250 ms)
```

**Solução**: Otimizar endpoint, verificar carga do servidor.

### Comandos Úteis
```powershell
# Verificar se API está rodando
Invoke-WebRequest -Uri "http://localhost:3333/health" -Method GET

# Verificar logs do monitoramento
Get-Content monitoramento-20260510.log -Tail 20

# Listar jobs em background
Get-Job

# Parar monitoramento
Stop-Job -Id <ID>
Remove-Job -Id <ID>
```

## 🏗️ ARQUITETURA DO SISTEMA

### Scripts Principais
1. **`monitoramento-continuo.ps1`**: Script principal com todas funcionalidades
2. **`iniciar-monitoramento.ps1`**: Interface amigável para inicialização
3. **`monitoramento-background.ps1`**: Script simplificado para background jobs

### Diretórios
- `scripts/`: Scripts de monitoramento
- `alertas/`: Arquivos de alertas gerados
- `logs/`: Logs do monitoramento (arquivos diários)

### Fluxo de Trabalho
```
[Inicialização] → [Verificação API] → [Loop Principal]
       ↓                ↓                    ↓
  Modo escolhido    Teste saúde     Monitoramento contínuo
       ↓                ↓                    ↓
  Dashboard        Status inicial   Teste endpoints críticos
  Background                         ↓
  Teste rápido                     Coleta métricas
                                    ↓
                                 Verifica alertas
                                    ↓
                                 Aguarda intervalo
```

## 📝 EXEMPLOS DE USO

### Durante Desenvolvimento
```powershell
# Iniciar monitoramento em background durante implementação
.\scripts\iniciar-monitoramento.ps1
# Escolher opção 2 (Background)

# Continuar desenvolvimento normalmente
# O sistema alertará se algum endpoint falhar
```

### Antes de Commits
```powershell
# Teste rápido para garantir API está funcionando
.\scripts\iniciar-monitoramento.ps1
# Escolher opção 3 (Teste Rápido)

# Se todos endpoints OK, pode commitar com segurança
```

### Monitoramento Contínuo
```powershell
# Dashboard interativo para acompanhamento em tempo real
.\scripts\iniciar-monitoramento.ps1
# Escolher opção 1 (Dashboard)

# Monitorar enquanto testa novas funcionalidades
```

## 🔒 SEGURANÇA E LIMITAÇÕES

### Considerações de Segurança
1. **Credenciais**: Nunca inclua credenciais nos scripts
2. **Logs**: Logs contêm URLs mas não dados sensíveis
3. **Alertas**: Configure canais seguros para alertas

### Limitações Conhecidas
1. **Timeout**: Verificações com timeout de 10 segundos
2. **Frequência**: Intervalo mínimo recomendado: 30 segundos
3. **Escala**: Para produção, considerar sistema de monitoramento dedicado

## 🔄 MANUTENÇÃO

### Atualização de Endpoints
Quando novos endpoints críticos forem adicionados na Etapa 2:

1. Adicione ao array `$criticalEndpoints`
2. Teste manualmente o endpoint
3. Verifique se alertas funcionam corretamente

### Rotação de Logs
Os logs são rotacionados automaticamente por dia. Para limpar logs antigos:

```powershell
# Manter apenas logs dos últimos 7 dias
Get-ChildItem monitoramento-*.log | 
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
  Remove-Item
```

## 🎯 INTEGRAÇÃO COM ETAPA 2

### Fase 1: Polling Inteligente
- Monitorar endpoints de sincronização Omie
- Alertar se jobs de polling falharem
- Verificar frequência de atualização

### Fase 2: Cache Multi-nível
- Monitorar performance dos endpoints com cache
- Alertar se cache não estiver funcionando
- Verificar hit rate do cache

### Fase 3: Dashboard Tempo Real
- Monitorar conexões WebSocket
- Alertar se dashboard não receber atualizações
- Verificar latência das atualizações

### Fase 4: Sistema de Alertas
- Monitorar sistema de alertas de estoque
- Alertar se alertas não forem gerados
- Verificar delivery das notificações

---

**ÚLTIMA ATUALIZAÇÃO**: 2026-05-10  
**VERSÃO**: 1.0  
**PRÓXIMA REVISÃO**: 2026-06-10