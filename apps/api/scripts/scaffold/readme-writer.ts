import * as path from 'path'
import { AuditResult, Options, Template } from './types'
import { safeWriteFile } from './fs-utils'

function checklist(items: { relPath: string; exists: boolean }[]) {
  return items.map(i => `- ${i.exists ? '[x]' : '[ ]'} \`${i.relPath}\``).join('\n')
}

export function renderReadme(audit: AuditResult, template: Template) {
  const now = new Date().toISOString()

  const dirs = audit.expected.filter(e => e.kind === 'dir')
  const files = audit.expected.filter(e => e.kind === 'file')

  const done = audit.expected.filter(e => e.exists).length
  const total = audit.expected.length

  const missingDirs = dirs.filter(d => !d.exists)
  const missingFiles = files.filter(f => !f.exists)

  const nextSteps: string[] = []
  if (missingDirs.length) nextSteps.push(`- Criar pastas faltantes (${missingDirs.length}).`)
  if (missingFiles.length) nextSteps.push(`- Criar arquivos faltantes (${missingFiles.length}).`)
  if (!nextSteps.length) {
    nextSteps.push('- Estrutura base completa ✅. Próximo passo: implementar use-cases, ports e integrações.')
  }

  const warnBlock =
    audit.warnings.length > 0
      ? `## ⚠️ Alertas\n\n${audit.warnings.map(w => `- ${w}`).join('\n')}\n`
      : ''

  const extrasBlock =
    audit.extras.length > 0
      ? `## 📦 Itens extras encontrados (fora do template)\n\n` +
        `> Não é necessariamente erro — mas vale revisar para manter o padrão.\n\n` +
        audit.extras.map(e => `- \`${e}\``).join('\n') +
        '\n'
      : ''

  return `# Módulo \`${audit.moduleName}\`

> ${template.marker}  
> Última atualização: \`${now}\`

## 🎯 Objetivo do módulo
Descreva aqui a responsabilidade do módulo \`${audit.moduleName}\` (domínio, integrações, limites).

## 🧱 Padrão arquitetural (por módulo)
Este módulo segue:
- \`presentation/http\` (Fastify: request/reply)
- \`application/use-cases\` (regras de negócio, sem HTTP)
- \`application/ports\` (interfaces/contratos)
- \`infrastructure\` (Prisma, integrações, jobs)
- \`index.ts\` (composição e wiring)

## ✅ Status da estrutura (template)
Progresso: **${done}/${total}** itens presentes.

### Pastas
${checklist(dirs)}

### Arquivos
${checklist(files)}

${warnBlock}
## 🧩 O que falta implementar (próximos passos)
${nextSteps.join('\n')}

## 🧪 Checkpoints de validação
- \`app.printRoutes()\` deve listar as rotas do módulo (quando registradas).
- \`presentation\` não acessa Prisma diretamente.
- \`application\` não conhece Fastify/HTTP.
- \`index.ts\` é o único lugar com wiring de dependências.

${extrasBlock}
`
}

export function writeReadme(params: {
  audit: AuditResult
  template: Template
  options: Options
}) {
  const { audit, template, options } = params
  const readmePath = path.join(audit.modulePath, 'README.md')
  const content = renderReadme(audit, template)

  // README sempre atualiza (não faz sentido “proteger”)
  return safeWriteFile(readmePath, content, { ...options, force: true }, template.marker)
}