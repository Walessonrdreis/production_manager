import * as path from 'path'
import { AuditResult, StatusItem, Template } from './types'
import { exists, listTree, normalizeRel } from './fs-utils'

export function auditModule(params: {
  moduleName: string
  modulePath: string
  template: Template
}): AuditResult {
  const { moduleName, modulePath, template } = params

  const expected: StatusItem[] = [
    ...template.dirs.map(relPath => ({
      kind: 'dir' as const,
      relPath,
      exists: exists(path.join(modulePath, relPath)),
    })),
    ...Object.keys(template.files).map(relPath => ({
      kind: 'file' as const,
      relPath,
      exists: exists(path.join(modulePath, relPath)),
    })),
  ].sort((a, b) => a.relPath.localeCompare(b.relPath))

  const warnings: string[] = []

  if (!exists(path.join(modulePath, 'index.ts'))) warnings.push('Falta `index.ts` (ponto único de composição do módulo).')
  if (!exists(path.join(modulePath, 'presentation/http/routes.ts')))
    warnings.push('Falta `presentation/http/routes.ts` (registro de rotas Fastify do módulo).')

  // extras: tudo que existe e não está no template (nem README)
  const currentTree = listTree(modulePath)
  const expectedSet = new Set<string>([
    ...template.dirs.map(d => normalizeRel(d)),
    ...Object.keys(template.files).map(f => normalizeRel(f)),
    'README.md',
  ])

  const extras = currentTree
    .filter(p => p && p !== '.')
    .filter(p => !expectedSet.has(normalizeRel(p)))
    .slice(0, 300)

  return {
    moduleName,
    modulePath,
    expected: [...expected, { kind: 'file', relPath: 'README.md', exists: exists(path.join(modulePath, 'README.md')) }],
    extras,
    warnings,
  }
}