import * as path from 'path'
import { buildDefaultTemplate } from './config'
import { auditModule } from './audit'
import { ensureDir, ensureProjectRoot, normalizeRel, safeWriteFile } from './fs-utils'
import { writeReadme } from './readme-writer'
import { Options } from './types'

function parseArgs(argv: string[]): { moduleName: string; options: Options } {
  const args = argv.slice(2)
  const options: Options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  }

  const moduleName = args.find(a => !a.startsWith('--')) || ''
  if (!moduleName) {
    console.error('❌ Informe o nome do módulo. Ex: npm run gen:module -- clientes')
    process.exit(1)
  }

  return { moduleName, options }
}

function main() {
  const { moduleName, options } = parseArgs(process.argv)

  try {
    ensureProjectRoot()
  } catch (err: any) {
    console.error(`❌ ${err?.message || String(err)}`)
    process.exit(1)
  }

  const template = buildDefaultTemplate(moduleName)
  const modulePath = path.resolve(process.cwd(), 'src/modules', moduleName)

  const logs: string[] = []
  logs.push(`🚀 scaffold | mode=${options.dryRun ? 'DRY-RUN' : 'WRITE'} | force=${options.force ? 'on' : 'off'}`)
  logs.push(`📦 module=${moduleName}`)
  logs.push(`📁 path=${normalizeRel(path.relative(process.cwd(), modulePath))}`)

  // 1) garante diretório do módulo e subpastas
  const r0 = ensureDir(modulePath, options)
  if (r0.action === 'created') logs.push(`+ created dir: src/modules/${moduleName}`)

  for (const d of template.dirs) {
    const full = path.join(modulePath, d)
    const r = ensureDir(full, options)
    if (r.action === 'created') logs.push(`+ created dir: ${d}`)
  }

  // 2) garante arquivos do template
  for (const [rel, content] of Object.entries(template.files)) {
    const full = path.join(modulePath, rel)
    const r = safeWriteFile(full, content, options, template.marker)

    if (r.action === 'created') logs.push(`+ created file: ${rel}`)
    if (r.action === 'overwritten') logs.push(`~ overwritten file: ${rel}`)
    if (r.action === 'skipped-protected') logs.push(`! kept existing (protected): ${rel}`)
  }

  // 3) audita e escreve README
  const audit = auditModule({ moduleName, modulePath, template })
  const rr = writeReadme({ audit, template, options })

  if (rr.action === 'created') logs.push(`+ created file: README.md`)
  if (rr.action === 'overwritten') logs.push(`~ updated file: README.md`)

  // 4) print resumo final
  const missing = audit.expected.filter(e => !e.exists)
  logs.push(`✅ audit: missing=${missing.length} extras=${audit.extras.length} warnings=${audit.warnings.length}`)

  console.log(logs.join('\n'))
}

main()