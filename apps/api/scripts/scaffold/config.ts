import { Template } from './types'

function toCamelCase(input: string) {
  return input
    .trim()
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? String(c).toUpperCase() : ''))
    .replace(/^[A-Z]/, m => m.toLowerCase())
}

function toPascalCase(input: string) {
  const camel = toCamelCase(input)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

export function buildDefaultTemplate(moduleName: string): Template {
  const camel = toCamelCase(moduleName)
  const pascal = toPascalCase(moduleName)

  const marker = 'AUTO-GENERATED: module-scaffold'

  const dirs = [
    'application/use-cases',
    'application/dtos',
    'application/ports',

    'infrastructure/db',
    'infrastructure/integrations',
    'infrastructure/jobs',

    'presentation/http/controllers',
    'presentation/http',
  ]

  const files: Record<string, string> = {
    'presentation/http/routes.ts': `// ${marker}
import { FastifyInstance } from 'fastify'

export async function ${camel}Routes(app: FastifyInstance) {
  // rotas do módulo ${moduleName}
  // app.get('/', async (req, reply) => reply.send({ ok: true }))
}
`,

    'presentation/http/schemas.ts': `// ${marker}
// Schemas HTTP do módulo ${moduleName}
`,

    'presentation/http/controllers/index.ts': `// ${marker}
// Controllers do módulo ${moduleName}
`,

    'index.ts': `// ${marker}
import { FastifyInstance } from 'fastify'
import { ${camel}Routes } from './presentation/http/routes'

export async function ${camel}Module(app: FastifyInstance) {
  /**
   * Composição do módulo ${moduleName} (único ponto de wiring):
   * - repositories (Prisma)
   * - gateways (Omie)
   * - use cases
   * - app.decorate(...)
   */

  app.register(${camel}Routes, { prefix: '/${moduleName}' })
}

// export opcional (útil para testes/consumo interno)
export const ${pascal} = { module: ${camel}Module }
`,
  }

  return { dirs, files, marker }
}