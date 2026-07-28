#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const IGNORE_DIRS = new Set(['node_modules', '.git', '.pnpm', '.cache'])

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
  if (name.startsWith('ESTRUTURA_PROJETO.md.bak-')) return true
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

function renderFullTree(apiRootAbs) {
  const lines = ['```text', 'apps/api/']

  const distAbs = path.join(apiRootAbs, 'dist')
  const prismaAbs = path.join(apiRootAbs, 'prisma')
  const legacyAbs = path.join(apiRootAbs, 'src', 'legacy')
  const srcAbs = path.join(apiRootAbs, 'src')

  function walk(absDir, relDir, prefixParts, includeFiles) {
    const { dirs, files } = listDir(absDir)

    const items = [
      ...dirs.map((name) => ({ type: 'dir', name })),
      ...(includeFiles ? files.map((name) => ({ type: 'file', name })) : []),
    ]

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i]
      const isLast = i === items.length - 1
      const branch = isLast ? '└─' : '├─'
      const prefix = prefixParts.join('')

      if (item.type === 'dir') {
        const childRel = path.join(relDir, item.name)
        const childAbs = path.join(absDir, item.name)

        if (childAbs === distAbs) {
          lines.push(`${prefix}${branch} ${item.name}/ # Build compilado (gerado)`)
          continue
        }

        if (childAbs === legacyAbs) {
          lines.push(`${prefix}${branch} ${item.name}/ # Projeto legado (não expandido)`)
          continue
        }

        if (absDir === prismaAbs) {
          lines.push(`${prefix}${branch} ${item.name}/`)
          continue
        }

        lines.push(`${prefix}${branch} ${item.name}/`)

        const nextPrefixParts = prefixParts.slice()
        nextPrefixParts.push(isLast ? '   ' : '│  ')
        const childIncludeFiles = includeFiles || childAbs === srcAbs || childAbs.startsWith(`${srcAbs}${path.sep}`)
        walk(childAbs, childRel, nextPrefixParts, childIncludeFiles)
        continue
      }

      lines.push(`${prefix}${branch} ${item.name}`)
    }
  }

  walk(apiRootAbs, '', [], false)

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
  const inside = md.slice(start, end + 3)
  const after = md.slice(end + 3)
  return { before, inside, after, start, end: end + 3 }
}

function splitBlockLines(textBlock) {
  const lines = textBlock.split(/\r?\n/)
  const withoutFence = lines.filter((l) => l.trim() !== '```text' && l.trim() !== '```')
  return withoutFence
}

function main() {
  const apiRoot = process.cwd()

const docsBase = path.join(
    apiRoot,
    'docs',
    'ESTRUTURA_PROJETO',
    'COMPLETO',
  )

  const mdPath = path.join(docsBase, 'ESTRUTURA_PROJETO.md')

  if (!fs.existsSync(mdPath)) {
    console.error(`Arquivo não encontrado: ${mdPath}`)
    process.exit(1)
  }

  const original = fs.readFileSync(mdPath, 'utf8')
  const block = extractTextBlock(original)
  if (!block) {
    console.error('Bloco ```text não encontrado em ESTRUTURA_PROJETO.md')
    process.exit(1)
  }

  const templateLines = splitBlockLines(block.inside)
  if (templateLines.length === 0) {
    console.error('Bloco ```text vazio em ESTRUTURA_PROJETO.md')
    process.exit(1)
  }

  const nextBlock = renderFullTree(apiRoot)

  const updated = `${block.before}${nextBlock}${block.after.replace(/^\r?\n/, '')}`

  if (updated === original) {
    console.log('ESTRUTURA_PROJETO.md já está atualizado.')
    return
  }

  const backupPath = `${mdPath}.bak-${formatTimestamp()}`

  try {
    fs.copyFileSync(mdPath, backupPath)
    fs.writeFileSync(mdPath, updated, 'utf8')
    console.log(`Atualizado: ${mdPath}`)
    console.log(`Backup: ${backupPath}`)
  } catch (e) {
    console.error('Falha ao atualizar ESTRUTURA_PROJETO.md:', e)
    try {
      if (fs.existsSync(backupPath)) fs.copyFileSync(backupPath, mdPath)
    } catch {}
    process.exit(1)
  }
}

main()
