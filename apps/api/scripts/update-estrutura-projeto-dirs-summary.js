#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.pnpm',
  '.cache',
  'dist',
])

const IGNORE_FILES_PREFIX = [
  'Estrutura_Projeto_Resumido.md.bak-',
]

// quantos arquivos aparecem no comentário
const MAX_FILES_IN_COMMENT = 8

// extensões permitidas no comentário
const ALLOWED_FILE_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.prisma',
  '.yml',
  '.yaml',
])

function formatTimestamp(date = new Date()) {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`
}

function shouldIgnoreFile(name) {
  for (const p of IGNORE_FILES_PREFIX) {
    if (name.startsWith(p)) return true
  }
  return false
}

function listDir(absDir) {
  const entries = fs.readdirSync(absDir, { withFileTypes: true })
  const dirs = []
  const files = []

  for (const e of entries) {
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue
      dirs.push(e.name)
      continue
    }
    if (shouldIgnoreFile(e.name)) continue
    files.push(e.name)
  }

  dirs.sort((a, b) => a.localeCompare(b))
  files.sort((a, b) => a.localeCompare(b))
  return { dirs, files }
}

function filterFilesForComment(files) {
  const filtered = files.filter((f) => {
    const ext = path.extname(f).toLowerCase()
    return ALLOWED_FILE_EXTS.has(ext) || ext === ''
  })

  const priority = [
    'index.ts',
    'routes.ts',
    'schemas.ts',
    'controller.ts',
    'server.ts',
    'app.ts',
    'package.json',
    'tsconfig.json',
    'schema.prisma',
    'README.md',
  ]

  filtered.sort((a, b) => {
    const ia = priority.indexOf(a)
    const ib = priority.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b)
  })

  return filtered
}

function filesComment(files) {
  const filtered = filterFilesForComment(files)
  if (!filtered.length) return ''

  const shown = filtered.slice(0, MAX_FILES_IN_COMMENT)
  const rest = filtered.length - shown.length

  return ` # files: ${shown.join(', ')}${rest > 0 ? ` (+${rest})` : ''}`
}

/**
 * Renderiza SOMENTE diretórios,
 * com comentário inline dos arquivos do diretório.
 */
function renderDirsTreeWithInlineFiles(apiRootAbs) {
  const lines = ['```text', 'apps/api/']

  const legacyAbs = path.join(apiRootAbs, 'src', 'legacy')

  function walk(absDir, prefixParts) {
    const { dirs } = listDir(absDir)
    const items = dirs.map((name) => ({ name }))

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i]
      const isLast = i === items.length - 1
      const branch = isLast ? '└─' : '├─'
      const prefix = prefixParts.join('')

      const childAbs = path.join(absDir, item.name)

      if (childAbs === legacyAbs) {
        lines.push(`${prefix}${branch} ${item.name}/ # Projeto legado (não expandido)`)
        continue
      }

      const { files } = listDir(childAbs)
      const comment = filesComment(files)

      lines.push(`${prefix}${branch} ${item.name}/${comment}`)

      const nextPrefixParts = prefixParts.slice()
      nextPrefixParts.push(isLast ? '   ' : '│  ')
      walk(childAbs, nextPrefixParts)
    }
  }

  walk(apiRootAbs, [])

  lines.push('```')
  lines.push('')
  return lines.join('\n')
}

function extractTextBlock(md) {
  const start = md.indexOf('```text')
  if (start === -1) return null
  const end = md.indexOf('```', start + 7)
  if (end === -1) return null
  const before = md.slice(0, start)
  const after = md.slice(end + 3)
  return { before, after }
}

function main() {
  const apiRoot = process.cwd()

  const docsBase = path.join(
    apiRoot,
    'docs',
    'ESTRUTURA_PROJETO',
    'RESUMIDO',
  )

  fs.mkdirSync(docsBase, { recursive: true })

  const mdPath = path.join(
    docsBase,
    'Estrutura_Projeto_Resumido.md',
  )

  const original = fs.existsSync(mdPath)
    ? fs.readFileSync(mdPath, 'utf8')
    : ''

  const block = extractTextBlock(original)

  const nextTree = renderDirsTreeWithInlineFiles(apiRoot)

  const updated = block
    ? `${block.before}${nextTree}${block.after.replace(/^\r?\n/, '')}`
    : `${nextTree}`

  if (updated === original) {
    console.log('Estrutura_Projeto_Resumido.md já está atualizado.')
    return
  }

  const backupPath = `${mdPath}.bak-${formatTimestamp()}`

  try {
    if (original) fs.copyFileSync(mdPath, backupPath)
    fs.writeFileSync(mdPath, updated, 'utf8')
    console.log(`Atualizado: ${mdPath}`)
    if (original) console.log(`Backup: ${backupPath}`)
  } catch (e) {
    console.error('Falha ao atualizar Estrutura_Projeto_Resumido.md:', e)
    try {
      if (fs.existsSync(backupPath)) fs.copyFileSync(backupPath, mdPath)
    } catch {}
    process.exit(1)
  }
}

main()