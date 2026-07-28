#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const IGNORE_DIRS = new Set(['node_modules', '.git', '.pnpm', '.cache', 'dist'])

function formatTimestamp(date = new Date()) {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`
}

function listDir(absDir) {
  const entries = fs.readdirSync(absDir, { withFileTypes: true })
  const dirs = []
  const files = []
  for (const e of entries) {
    if (IGNORE_DIRS.has(e.name)) continue
    if (e.isDirectory()) { dirs.push(e.name); continue }
    files.push(e.name)
  }
  dirs.sort((a, b) => a.localeCompare(b))
  files.sort((a, b) => a.localeCompare(b))
  return { dirs, files }
}

function walk(absDir, prefix, result) {
  const { dirs, files } = listDir(absDir)
  const items = [
    ...dirs.map(n => ({ type: 'dir', name: n })),
    ...files.map(n => ({ type: 'file', name: n })),
  ]
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const isLast = i === items.length - 1
    const branch = isLast ? '└─' : '├─'
    result.push(`${prefix}${branch} ${item.name}${item.type === 'dir' ? '/' : ''}`)
    if (item.type === 'dir') {
      walk(path.join(absDir, item.name), `${prefix}${isLast ? '   ' : '│  '}`, result)
    }
  }
}

function getProjectStats(apiRoot) {
  const src = path.join(apiRoot, 'src')
  const modules = path.join(src, 'modules')

  let moduleCount = 0
  let jobCount = 0
  let testCount = 0
  let useCaseCount = 0
  let controllerCount = 0
  let routeCount = 0
  let repoCount = 0

  function scan(dir) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (IGNORE_DIRS.has(e.name) || e.name.startsWith('.')) continue
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.git') continue
        scan(full)
      } else {
        if (e.name.endsWith('.job.ts')) jobCount++
        else if (e.name.endsWith('.test.ts') || e.name.endsWith('.spec.ts')) testCount++
        else if (e.name.endsWith('.usecase.ts')) useCaseCount++
        else if (e.name.endsWith('.controller.ts')) controllerCount++
        else if (e.name.endsWith('.routes.ts')) routeCount++
        else if (e.name.match(/\.repo\.\w+\.ts$/)) repoCount++
      }
    }
  }

  if (fs.existsSync(modules)) {
    const moduleDirs = fs.readdirSync(modules, { withFileTypes: true })
      .filter(e => e.isDirectory() && !IGNORE_DIRS.has(e.name))
    moduleCount = moduleDirs.length
  }

  scan(src)

  return { moduleCount, jobCount, testCount, useCaseCount, controllerCount, routeCount, repoCount }
}

function getPollingConfigs() {
  return [
    { name: 'omie-production-orders-sync', interval: '30s', criticality: 'high', description: 'Ordens de produção Omie' },
    { name: 'omie-orders-stage20-sync', interval: '1min', criticality: 'high', description: 'Pedidos etapa 20 Omie' },
    { name: 'stock-monitor', interval: '2min', criticality: 'medium', description: 'Monitoramento de estoque' },
    { name: 'omie-product-sync', interval: '5min', criticality: 'medium', description: 'Sincronização de produtos' },
    { name: 'stock-refresh', interval: '10min', criticality: 'low', description: 'Atualização de estoque' },
  ]
}

function getModulesInfo(apiRoot) {
  const modulesDir = path.join(apiRoot, 'src', 'modules')
  if (!fs.existsSync(modulesDir)) return []
  return fs.readdirSync(modulesDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !IGNORE_DIRS.has(e.name))
    .map(e => ({ name: e.name, path: path.join(modulesDir, e.name) }))
}

function getEndpointsSummary() {
  return [
    { method: 'GET', path: '/', description: 'Raiz da API (info)' },
    { method: 'GET', path: '/health', description: 'Health check' },
    { method: 'GET', path: '/v1', description: 'Índice de rotas v1' },
    { method: 'GET', path: '/v1/products', description: 'Catálogo público + estoque' },
    { method: 'GET', path: '/v1/products/:omieCode', description: 'Detalhe produto por OmieCode' },
    { method: 'GET', path: '/v1/orders', description: 'Lista pedidos etapa 20' },
    { method: 'GET', path: '/v1/clients', description: 'Lista clientes' },
    { method: 'GET', path: '/v1/clients/:omieClientCode', description: 'Detalhe cliente' },
    { method: 'POST', path: '/v1/admin/omie/clients/sync', description: 'Força sincronização clientes' },
    { method: 'GET', path: '/v1/admin/managed-products', description: 'Lista produtos gerenciados' },
    { method: 'POST', path: '/v1/admin/managed-products', description: 'Seleciona produto gerenciado' },
    { method: 'POST', path: '/v1/admin/managed-products/bulk', description: 'Seleciona produtos em lote' },
    { method: 'GET', path: '/v1/admin/orders', description: 'Lista pedidos admin' },
    { method: 'GET', path: '/v1/admin/sectors', description: 'Lista setores' },
    { method: 'GET', path: '/v1/admin/plans', description: 'Lista planos' },
    { method: 'GET', path: '/v1/internal-production-orders', description: 'Lista OPs internas' },
    { method: 'POST', path: '/v1/internal-production-orders', description: 'Cria OP interna' },
    { method: 'PATCH', path: '/v1/internal-production-orders/:id/start', description: 'Inicia OP interna' },
    { method: 'PATCH', path: '/v1/internal-production-orders/:id/complete', description: 'Completa OP interna' },
    { method: 'DELETE', path: '/v1/internal-production-orders/:id', description: 'Exclui OP interna' },
    { method: 'GET', path: '/api/alerts/stock', description: 'Alertas de estoque' },
    { method: 'GET', path: '/api/alerts/stock/critical', description: 'Alertas críticos de estoque' },
    { method: 'POST', path: '/api/alerts/stock/configure', description: 'Configura regras de alerta' },
    { method: 'POST', path: '/api/production/queue/add', description: 'Adiciona à fila de produção' },
    { method: 'GET', path: '/api/production/queue', description: 'Lista fila de produção' },
    { method: 'POST', path: '/api/production/queue/reorder', description: 'Reordena fila de produção' },
    { method: 'POST', path: '/api/integration/sales-to-production', description: 'Integra venda→produção' },
    { method: 'POST', path: '/api/sync/stock', description: 'Sincroniza estoque (Omie)' },
    { method: 'POST', path: '/api/sync/orders', description: 'Sincroniza pedidos (Omie)' },
    { method: 'POST', path: '/api/sync/production', description: 'Sincroniza produção (Omie)' },
    { method: 'POST', path: '/api/forecast/demand', description: 'Previsão de demanda' },
    { method: 'GET', path: '/api/metrics/production/efficiency', description: 'KPIs de produção' },
    { method: 'GET', path: '/v1/trello/webhook', description: 'Webhook Trello (GET)' },
    { method: 'POST', path: '/v1/trello/webhook', description: 'Webhook Trello (POST)' },
  ]
}

function generateTree(apiRoot) {
  const result = ['```text', 'apps/api/']
  const dist = path.join(apiRoot, 'dist')
  const prisma = path.join(apiRoot, 'prisma')
  const legacy = path.join(apiRoot, 'src', 'legacy')
  const src = path.join(apiRoot, 'src')

  function walkDir(absDir, prefix, showFiles) {
    const { dirs, files } = listDir(absDir)
    const items = [
      ...dirs.map(n => ({ type: 'dir', name: n })),
      ...(showFiles ? files.map(n => ({ type: 'file', name: n })) : []),
    ]
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const isLast = i === items.length - 1
      const branch = isLast ? '└─' : '├─'
      const p = prefix + branch + ' ' + item.name

      if (item.type === 'dir') {
        const childAbs = path.join(absDir, item.name)
        if (childAbs === dist) { result.push(p + '/ # Build compilado'); continue }
        if (childAbs === legacy) { result.push(p + '/ # Legado (não expandido)'); continue }
        if (absDir === prisma) { result.push(p + '/'); continue }
        result.push(p + '/')
        const next = prefix + (isLast ? '   ' : '│  ')
        walkDir(childAbs, next, showFiles || childAbs === src || childAbs.startsWith(src + path.sep))
      } else {
        result.push(p)
      }
    }
  }

  walkDir(apiRoot, '', false)
  result.push('```', '')
  return result.join('\n')
}

function generateResumo(apiRoot) {
  const pkg = JSON.parse(fs.readFileSync(path.join(apiRoot, 'package.json'), 'utf8'))
  const stats = getProjectStats(apiRoot)
  const modules = getModulesInfo(apiRoot)
  const pollings = getPollingConfigs()
  const endpoints = getEndpointsSummary()
  const tree = generateTree(apiRoot)

  const lines = []

  lines.push('# RESUMO_PROJETO')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push(`**Versão:** ${pkg.version || '1.0.0'}`)
  lines.push(`**Data:** ${new Date().toLocaleDateString('pt-BR')}`)
  lines.push(`**Hora:** ${new Date().toLocaleTimeString('pt-BR')}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 1. IDENTIFICAÇÃO')
  lines.push('')
  lines.push(`- **Nome:** ${pkg.name || 'production-manager-api'}`)
  lines.push(`- **Descrição:** ${pkg.description || 'API de gerenciamento de produção integrada com Omie'}`)
  lines.push(`- **Versão:** ${pkg.version || '1.0.0'}`)
  lines.push('- **Stack:** Node.js + TypeScript + Fastify + Prisma + PostgreSQL')
  lines.push(`- **License:** ${pkg.license || 'N/A'}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 2. ARQUITETURA')
  lines.push('')
  lines.push('### 2.1 Clean Architecture')
  lines.push('')
  lines.push('```')
  lines.push('Presentation (routes/controllers/schemas)')
  lines.push('       ↓')
  lines.push('Application (use-cases/dto/ports)')
  lines.push('       ↓')
  lines.push('Infrastructure (repositories/gateways/jobs)')
  lines.push('       ↓')
  lines.push('Domain (entities/value-objects/errors)')
  lines.push('```')
  lines.push('')
  lines.push('### 2.2 Estrutura de Diretórios')
  lines.push('')
  lines.push(tree)
  lines.push('')
  lines.push('### 2.3 Tecnologias')
  lines.push('')
  lines.push('| Tecnologia | Versão | Finalidade |')
  lines.push('|---|---|---|')
  lines.push(`| Node.js | ${process.version} | Runtime |`)
  lines.push('| TypeScript | 5.x | Tipagem estática |')
  lines.push('| Fastify | 5.x | Framework HTTP |')
  lines.push('| Prisma | 6.x | ORM / Database |')
  lines.push('| PostgreSQL | - | Banco de dados relacional |')
  lines.push('| Redis | - | Cache / Pub-Sub |')
  lines.push('| Zod | - | Validação de schemas |')
  lines.push('| Vitest | - | Testes unitários/integração |')
  lines.push('| Omie API | REST | ERP externo (integração) |')
  lines.push('')
  const deps = pkg.dependencies || {}
  const devDeps = pkg.devDependencies || {}
  lines.push(`- **Dependências de produção:** ${Object.keys(deps).length}`)
  lines.push(`- **Dependências de desenvolvimento:** ${Object.keys(devDeps).length}`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 3. MÓDULOS DE NEGÓCIO')
  lines.push('')
  lines.push(`Total: **${stats.moduleCount} módulos**`)
  lines.push('')
  lines.push('| # | Módulo | Responsabilidade |')
  lines.push('|---|---|---|')
  const moduleDescriptions = {
    'omie-production-orders': 'Ordens de produção via Omie',
    'omie-sales-orders': 'Pedidos de venda via Omie',
    'orders-enriched': 'Pedidos enriquecidos (dados complementares)',
    'orders-view': 'View de pedidos consolidada',
    'plans': 'Planos de produção',
    'products': 'Gestão de produtos',
    'product-structure': 'Estrutura/malha de produtos',
    'sectors': 'Setores de produção',
    'product-sectors': 'Mapeamento produto-setor',
    'stock-monitor': 'Monitoramento de estoque',
    'client': 'Sincronização de clientes Omie',
    'internal-production-orders': 'Ordens de produção internas',
    'trello-integration': 'Integração com Trello',
    'orders-view': 'View consolidada de pedidos',
  }
  modules.forEach((m, i) => {
    const desc = moduleDescriptions[m.name] || 'Módulo de negócio'
    lines.push(`| ${i + 1} | \`${m.name}\` | ${desc} |`)
  })
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 4. JOBS E POLLING')
  lines.push('')
  lines.push(`Total: **${stats.jobCount} jobs**`)
  lines.push('')
  lines.push('### 4.1 Configurações de Polling')
  lines.push('')
  lines.push('| Job | Intervalo Base | Criticalidade | Descrição |')
  lines.push('|---|---|---|---|')
  pollings.forEach(p => {
    lines.push(`| \`${p.name}\` | ${p.interval} | ${p.criticality} | ${p.description} |`)
  })
  lines.push('')
  lines.push('### 4.2 Jobs Disponíveis')
  lines.push('')
  lines.push('- `omie-production-orders-sync` — Sincroniza OPs do Omie')
  lines.push('- `omie-orders-stage20-sync` — Sincroniza pedidos etapa 20')
  lines.push('- `omie-product-sync` — Sincroniza produtos do Omie')
  lines.push('- `omie-product-structure-sync` — Sincroniza estrutura de produtos')
  lines.push('- `omie-client-sync` — Sincroniza clientes do Omie')
  lines.push('- `stock-monitor` — Monitora estoque crítico')
  lines.push('- `stock-refresh` — Atualiza saldo de estoque')
  lines.push('- `sync-omie-clients` — Sincronização de clientes')
  lines.push('')
  lines.push('### 4.3 Sistema de Retry')
  lines.push('')
  lines.push('- **Circuit Breaker:** Ativo para jobs críticos (threshold: 3 falhas)')
  lines.push('- **Backoff Exponencial:** Fator 2x por tentativa')
  lines.push('- **Jitter:** Variação aleatória para evitar thundering herd')
  lines.push('- **Configurável via env:** Prefixo `RETRY_<JOBNAME>_*`')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 5. API ENDPOINTS')
  lines.push('')
  lines.push(`Total: **${endpoints.length} endpoints**`)
  lines.push('')
  lines.push('| Método | Caminho | Descrição |')
  lines.push('|---|---|---|')
  endpoints.forEach(e => {
    lines.push(`| ${e.method} | \`${e.path}\` | ${e.description} |`)
  })
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 6. BANCO DE DADOS')
  lines.push('')
  lines.push('### 6.1 Tecnologia')
  lines.push('- **ORM:** Prisma 6.x')
  lines.push('- **Banco:** PostgreSQL')
  lines.push('- **Migration:** Prisma Migrations')
  lines.push('')
  lines.push('### 6.2 Models (Prisma Schema)')
  lines.push('- Produtos, Setores, Planos de Produção')
  lines.push('- Ordens de Produção (Omie + Internas)')
  lines.push('- Pedidos de Venda (Etapa 20)')
  lines.push('- Clientes')
  lines.push('- Estrutura de Produtos (malha)')
  lines.push('- Alertas de Estoque')
  lines.push('- Fila de Produção')
  lines.push('- Mapeamento Produto-Setor')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 7. ESTATÍSTICAS DO PROJETO')
  lines.push('')
  lines.push('| Métrica | Valor |')
  lines.push('|---|---|')
  lines.push(`| Módulos de negócio | ${stats.moduleCount} |`)
  lines.push(`| Jobs agendados | ${stats.jobCount} |`)
  lines.push(`| Use Cases | ${stats.useCaseCount} |`)
  lines.push(`| Controllers | ${stats.controllerCount} |`)
  lines.push(`| Arquivos de rotas | ${stats.routeCount} |`)
  lines.push(`| Repositories | ${stats.repoCount} |`)
  lines.push(`| Testes unitários | ${stats.testCount} |`)
  lines.push(`| Dependências produção | ${Object.keys(pkg.dependencies || {}).length} |`)
  lines.push(`| Dependências dev | ${Object.keys(pkg.devDependencies || {}).length} |`)
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 8. INICIALIZAÇÃO')
  lines.push('')
  lines.push('```bash')
  lines.push('# Desenvolvimento')
  lines.push('pnpm dev')
  lines.push('')
  lines.push('# Build')
  lines.push('pnpm build')
  lines.push('')
  lines.push('# Testes')
  lines.push('pnpm test')
  lines.push('pnpm test:watch')
  lines.push('')
  lines.push('# Lint')
  lines.push('pnpm lint')
  lines.push('')
  lines.push('# Gerar resumo do projeto')
  lines.push('pnpm gen:resumo')
  lines.push('```')
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## 9. AMBIENTES')
  lines.push('')
  lines.push('| Variável | Descrição |')
  lines.push('|---|---|')
  lines.push('| `NODE_ENV` | development / production / test |')
  lines.push('| `PORT` | Porta do servidor HTTP |')
  lines.push('| `HOST` | Host do servidor |')
  lines.push('| `DATABASE_URL` | URL de conexão PostgreSQL |')
  lines.push('| `REDIS_URL` | URL de conexão Redis |')
  lines.push('| `OMIE_BASE_URL` | URL base API Omie |')
  lines.push('| `OMIE_APP_KEY` | App Key Omie |')
  lines.push('| `OMIE_APP_SECRET` | App Secret Omie |')
  lines.push('| `CORS_ORIGIN` | Origens permitidas CORS |')
  lines.push('')

  return lines.join('\n')
}

function extractVersionBlock(md) {
  const start = md.indexOf('# RESUMO_PROJETO')
  if (start === -1) return null

  const metaEnd = md.indexOf('---', start + 15)
  if (metaEnd === -1) return null

  const secondSep = md.indexOf('---', metaEnd + 3)
  if (secondSep === -1) return null

  const before = md.slice(0, start)
  const header = md.slice(start, secondSep + 3)
  const after = md.slice(secondSep + 3).replace(/^\r?\n/, '')

  return { before, header, after, start, end: secondSep + 3 }
}

function main() {
  const apiRoot = process.cwd()

  const docsBase = path.join(apiRoot, 'docs', 'ESTRUTURA_PROJETO')
  const mdPath = path.join(docsBase, 'RESUMO_PROJETO.md')

  if (!fs.existsSync(docsBase)) {
    fs.mkdirSync(docsBase, { recursive: true })
  }

  const newContent = generateResumo(apiRoot)

  if (fs.existsSync(mdPath)) {
    const original = fs.readFileSync(mdPath, 'utf8')
    if (original === newContent) {
      console.log('RESUMO_PROJETO.md já está atualizado.')
      return
    }

    const backupPath = `${mdPath}.bak-${formatTimestamp()}`
    try {
      fs.copyFileSync(mdPath, backupPath)
      console.log(`Backup salvo: ${backupPath}`)
    } catch (e) {
      console.error('Falha ao criar backup:', e)
      process.exit(1)
    }
  }

  try {
    fs.writeFileSync(mdPath, newContent, 'utf8')
    console.log(`Atualizado: ${mdPath}`)
  } catch (e) {
    console.error('Falha ao atualizar RESUMO_PROJETO.md:', e)
    process.exit(1)
  }
}

main()
