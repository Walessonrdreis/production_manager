import * as fs from 'fs'
import * as path from 'path'
import { Options, WriteResult } from './types'

export function normalizeRel(p: string) {
  return p.replace(/\\/g, '/')
}

export function exists(p: string) {
  try {
    fs.accessSync(p)
    return true
  } catch {
    return false
  }
}

export function ensureProjectRoot() {
  const cwd = process.cwd()
  const srcDir = path.join(cwd, 'src')
  const modulesDir = path.join(cwd, 'src', 'modules')

  if (!exists(srcDir) || !exists(modulesDir)) {
    throw new Error(
      'Não encontrei "src/" e "src/modules/" no diretório atual.\n' +
        '👉 Rode este script a partir do diretório da API (ex: cd api).',
    )
  }
}

export function ensureDir(dirPath: string, options: Options): WriteResult {
  if (exists(dirPath)) return { action: 'skipped' }
  if (!options.dryRun) fs.mkdirSync(dirPath, { recursive: true })
  return { action: 'created' }
}

export function readUtf8(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * Política:
 * - se o arquivo não existe => cria
 * - se existe e NÃO tem --force => não mexe
 * - se existe e tem --force => só sobrescreve se contiver marker (protege arquivos manuais)
 */
export function safeWriteFile(
  filePath: string,
  content: string,
  options: Options,
  marker?: string,
): WriteResult {
  const alreadyExists = exists(filePath)

  if (alreadyExists && !options.force) return { action: 'skipped' }

  if (alreadyExists && options.force && marker) {
    const current = readUtf8(filePath)
    if (!current.includes(marker)) {
      return { action: 'skipped-protected' }
    }
  }

  if (!options.dryRun) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content, { encoding: 'utf-8' })
  }

  return { action: alreadyExists ? 'overwritten' : 'created' }
}

export function listTree(root: string): string[] {
  const out: string[] = []

  const walk = (dir: string) => {
    if (!exists(dir)) return
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      const rel = normalizeRel(path.relative(root, full))
      out.push(rel)
      if (entry.isDirectory()) walk(full)
    }
  }

  walk(root)
  return out.sort()
}
