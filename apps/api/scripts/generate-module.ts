import fs from 'fs'
import path from 'path'

const moduleName = process.argv[2]

if (!moduleName) {
  console.error('❌ Informe o nome do módulo. Ex: clientes')
  process.exit(1)
}

const cwd = process.cwd()

if (!fs.existsSync(path.join(cwd, 'src'))) {
  console.error('❌ Este script deve ser executado a partir do diretório da API (onde existe a pasta src/)')
  process.exit(1)
}


const basePath = path.resolve(__dirname, '../src/modules', moduleName)

const folders = [
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
  'presentation/http/routes.ts': `import { FastifyInstance } from 'fastify'

export async function ${moduleName}Routes(app: FastifyInstance) {
  // rotas do módulo ${moduleName}
}
`,

  'presentation/http/schemas.ts': `// Schemas HTTP do módulo ${moduleName}
`,

  'presentation/http/controllers/index.ts': `// Controllers do módulo ${moduleName}
`,

  'index.ts': `import { FastifyInstance } from 'fastify'
import { ${moduleName}Routes } from './presentation/http/routes'

export async function ${moduleName}Module(app: FastifyInstance) {
  // composição de dependências do módulo ${moduleName}

  app.register(${moduleName}Routes, { prefix: '/${moduleName}' })
}
`,
}

console.log(`🚀 Gerando módulo: ${moduleName}`)

// cria diretórios
folders.forEach(folder => {
  const fullPath = path.join(basePath, folder)
  fs.mkdirSync(fullPath, { recursive: true })
})

// cria arquivos
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(basePath, filePath)
  fs.writeFileSync(fullPath, content)
})

console.log(`✅ Módulo "${moduleName}" criado com sucesso em src/modules/${moduleName}`)