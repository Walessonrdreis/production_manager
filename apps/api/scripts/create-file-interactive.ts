import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
})

function ask(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()))
  })
}

/**
 * Normaliza o caminho para evitar:
 * - apps/api/apps/api/...
 * - problemas de barra no Windows
 */
function resolveSafePath(inputPath: string): string {
  const cwd = process.cwd().replace(/\\/g, '/')
  const input = inputPath.replace(/\\/g, '/')

  if (input.startsWith(cwd)) return path.normalize(input)
  if (input.startsWith('apps/api/')) {
    return path.normalize(path.join(cwd, input.replace(/^apps\/api\//, '')))
  }

  return path.resolve(cwd, input)
}

/**
 * Remove cercas de código Markdown (``` ou ```ts)
 */
function stripMarkdownFences(content: string): string {
  const lines = content.split('\n')
  if (lines[0]?.trim().startsWith('```')) lines.shift()
  if (lines.at(-1)?.trim() === '```') lines.pop()
  return lines.join('\n')
}

async function main() {
  try {
    console.log('🧩 Criação / edição de arquivo (2 etapas)\n')

    // ===== ETAPA 1 =====
    const filePathInput = await ask(
      '📄 Informe o caminho do arquivo (ex: src/modules/.../arquivo.ts):\n',
    )

    if (!filePathInput) throw new Error('Caminho do arquivo é obrigatório.')

    const fullPath = resolveSafePath(filePathInput)
    const dirPath = path.dirname(fullPath)

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      console.log(`📁 Diretório criado:\n${dirPath}\n`)
    }

    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, '', 'utf-8')
      console.log(`✅ Arquivo criado:\n${fullPath}\n`)
    } else {
      console.log(`✏️ Arquivo já existe, entrando em modo de edição:\n${fullPath}\n`)
    }

    // ===== ETAPA 2 =====
    console.log('✍️ Cole agora o conteúdo do arquivo.')
    console.log('👉 Finalize a qualquer momento com:')
    console.log('   - Ctrl+D (Linux/Mac/Git Bash)')
    console.log('   - Ctrl+Z (Windows)\n')

    console.log('📥 Capturando conteúdo... (feedback abaixo)\n')

    rl.close()

    if (process.stdin.isTTY) process.stdin.setRawMode(true)
    process.stdin.resume()

    let buffer = ''
    let lines = 0
    let chars = 0

    const renderStatus = () => {
      process.stdout.write(
        `\r📄 linhas: ${lines.toString().padStart(4)} | caracteres: ${chars.toString().padStart(6)}`,
      )
    }

    const finalize = () => {
      if (process.stdin.isTTY) process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdin.removeListener('data', onData)

      const finalContent = stripMarkdownFences(buffer)
      fs.writeFileSync(fullPath, finalContent, 'utf-8')

      console.log('\n\n✅ Conteúdo salvo com sucesso.')
      process.exit(0)
    }

    const cancel = () => {
      if (process.stdin.isTTY) process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdin.removeListener('data', onData)
      console.log('\n\n❌ Operação cancelada.')
      process.exit(1)
    }

    const onData = (chunk: Buffer) => {
      const s = chunk.toString('utf8')

      for (const ch of s) {
        // Ctrl+C → cancelar
        if (ch === '\u0003') {
          cancel()
          return
        }

        // Ctrl+D → finalizar
        if (ch === '\u0004') {
          finalize()
          return
        }

        // Ctrl+Z → finalizar (Windows)
        if (ch === '\u001A') {
          finalize()
          return
        }

        // Enter
        if (ch === '\r' || ch === '\n') {
          buffer += '\n'
          lines++
          chars++
          renderStatus()
          continue
        }

        buffer += ch
        chars++
      }

      renderStatus()
    }

    process.stdin.on('data', onData)
  } catch (err: any) {
    console.error(`❌ Erro: ${err.message}`)
    try {
      rl.close()
    } catch {}
    process.exit(1)
  }
}

main()