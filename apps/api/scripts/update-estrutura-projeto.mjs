#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const IGNORE = new Set(['node_modules', '.git', '.pnpm', '.cache'])
const IGNORE_EXACT = new Set(['ESTRUTURA_PROJETO.md'])

function padEnd(str, len) {
  if (str.length >= len) return str
  return str + ' '.repeat(len - str.length)
}

function formatTimestamp(date = new Date()) {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`
}

function parseTemplateTree(blockLines) {
  const root = {
    name: 'apps/api/',
    isDir: true,
    desc: null,
    hasDesc: false,
    children: new Map(),
    order: [],
    expanded: true,
    childDescWidth: 0,
  }

  const stack = [root]

  for (const line of blockLines) {
    const trimmed = line.trimEnd()
    if (!trimmed) continue
    if (trimmed === root.name) continue

    const match = trimmed.match(
      /^(?<indent>(?:│  |   )*)(?<branch>├─|└─)\s(?<name>[^#]+?)(?<spacer>\s*)(?:#\s*(?<desc>.*))?$/
    )
    if (!match?.groups) continue

    const indent = match.groups.indent ?? ''
    const groups = Math.floor(indent.length / 3)
    const nameRaw = (match.groups.name ?? '').trimEnd()
    const spacer = match.groups.spacer ?? ''
    const desc = match.groups.desc ?? null
    const hasDesc = desc != null
    const isDir = nameRaw.endsWith('/')
    const name = nameRaw
    const width = name.length + spacer.length
    const depth = groups + 1

    while (stack.length > depth) stack.pop()
    const parent = stack[stack.length - 1]
    const node = {
      name,
      isDir,
      desc: hasDesc ? desc : null,
      hasDesc,
      children: new Map(),
      order: [],
      expanded: false,
      childDescWidth: 0,
    }
    parent.children.set(name, node)
    parent.order.push(name)
    if (hasDesc && spacer.length >= 2 && width > (parent.childDescWidth ?? 0)) {
      parent.childDescWidth = width
    }
    if (parent.isDir) parent.expanded = true
    stack.push(node)
  }

  return { root }
}

function getDirEntries(absDir) {
  const entries = fs.readdirSync(absDir, { withFileTypes: true })
  const visible = entries.filter((e) => {
    if (IGNORE.has(e.name)) return false
    if (IGNORE_EXACT.has(e.name)) return false
    if (e.name.startsWith('.')) return false
    if (e.name.startsWith('ESTRUTURA_PROJETO.md.bak-')) return false
    return true
  })
  const dirs = []
  const files = []
  for (const e of visible) {
    if (e.isDirectory()) dirs.push(e.name)
    else files.push(e.name)
  }
  dirs.sort((a, b) => a.localeCompare(b))
  files.sort((a, b) => a.localeCompare(b))
  return { dirs, files, all: visible }
}

function buildRuntimeTree(templateNode, absDir) {
  const runtimeNode = {
    name: templateNode.name,
    isDir: templateNode.isDir,
    desc: templateNode.desc ?? null,
    hasDesc: templateNode.hasDesc ?? false,
    children: [],
    expanded: templateNode.isDir && Boolean(templateNode.expanded),
    childDescWidth: templateNode.childDescWidth ?? 0,
  }

  if (!runtimeNode.isDir || !runtimeNode.expanded) return runtimeNode

  if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) return runtimeNode

  const { dirs, files } = getDirEntries(absDir)
  const actualSet = new Map()
  for (const d of dirs) actualSet.set(`${d}/`, { name: `${d}/`, isDir: true })
  for (const f of files) actualSet.set(f, { name: f, isDir: false })

  const used = new Set()
  for (const key of templateNode.order ?? []) {
    const tChild = templateNode.children.get(key)
    const aChild = actualSet.get(key)
    if (!tChild || !aChild) continue
    if (Boolean(aChild.isDir) !== Boolean(tChild.isDir)) continue
    used.add(key)
    const childAbs = path.join(absDir, aChild.isDir ? key.slice(0, -1) : key)
    runtimeNode.children.push(buildRuntimeTree(tChild, childAbs))
  }

  const extraDirs = []
  const extraFiles = []
  for (const key of actualSet.keys()) {
    if (used.has(key)) continue
    if (key.endsWith('/')) extraDirs.push(key)
    else extraFiles.push(key)
  }
  extraDirs.sort((a, b) => a.localeCompare(b))
  extraFiles.sort((a, b) => a.localeCompare(b))

  for (const key of [...extraDirs, ...extraFiles]) {
    const aChild = actualSet.get(key)
    const childAbs = path.join(absDir, aChild.isDir ? key.slice(0, -1) : key)
    runtimeNode.children.push(
      buildRuntimeTree(
        {
          name: key,
          isDir: aChild.isDir,
          desc: null,
          hasDesc: false,
          children: new Map(),
          order: [],
          expanded: false,
        },
        childAbs
      )
    )
  }

  return runtimeNode
}

function renderTree(rootNode) {
  const lines = ['```text', rootNode.name]

  function renderChildren(parent, prefixParts) {
    const children = parent.children
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i]
      const isLast = i === children.length - 1
      const branch = isLast ? '└─' : '├─'

      const prefix = prefixParts.join('')
      const head = `${prefix}${branch} ${child.name}`

      if (child.hasDesc && child.desc) {
        const width = parent.childDescWidth ?? child.name.length
        const paddedName = padEnd(child.name, width)
        lines.push(`${prefix}${branch} ${paddedName} # ${child.desc}`)
      } else {
        lines.push(head)
      }

      if (child.isDir && child.expanded && child.children.length > 0) {
        const nextPrefixParts = prefixParts.slice()
        nextPrefixParts.push(isLast ? '   ' : '│  ')
        renderChildren(child, nextPrefixParts)
      }
    }
  }

  renderChildren(rootNode, [])
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
  const mdPath = path.join(apiRoot, 'ESTRUTURA_PROJETO.md')

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
  const { root: templateRoot } = parseTemplateTree(templateLines)

  const runtimeRoot = buildRuntimeTree(templateRoot, apiRoot)
  const nextBlock = renderTree(runtimeRoot)

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
