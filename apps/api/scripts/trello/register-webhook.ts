import 'dotenv/config'

const TRELLO_API_BASE = 'https://api.trello.com/1'

interface TrelloWebhook {
  id: string
  callbackURL: string
  idModel: string
  active: boolean
}

async function getExistingWebhooks(key: string, token: string): Promise<TrelloWebhook[]> {
  const url = `${TRELLO_API_BASE}/tokens/${token}/webhooks?key=${key}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Falha ao listar webhooks: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

async function createWebhook(key: string, token: string, callbackURL: string, idModel: string): Promise<TrelloWebhook> {
  const url = `${TRELLO_API_BASE}/webhooks?key=${key}&token=${token}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callbackURL,
      idModel,
      description: `Webhook de produção - ${idModel}`,
    }),
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Falha ao criar webhook: ${response.status} ${response.statusText} - ${body}`)
  }
  return response.json()
}

async function main() {
  const key = process.env['TRELLO_API_KEY']
  const token = process.env['TRELLO_API_TOKEN']
  const boardId = process.env['TRELLO_BOARD_ID']
  const callbackURL = process.env['TRELLO_WEBHOOK_CALLBACK_URL']

  if (!key || !token || !boardId || !callbackURL) {
    console.error('Variáveis de ambiente necessárias: TRELLO_API_KEY, TRELLO_API_TOKEN, TRELLO_BOARD_ID, TRELLO_WEBHOOK_CALLBACK_URL')
    process.exit(1)
  }

  console.log(`Verificando webhooks existentes para o board ${boardId}...`)

  const existing = await getExistingWebhooks(key, token)
  const duplicate = existing.find(
    (w) => w.callbackURL === callbackURL && w.idModel === boardId,
  )

  if (duplicate) {
    console.log(`Webhook já existe: ${duplicate.id}`)
    console.log(`  Callback: ${duplicate.callbackURL}`)
    console.log(`  Board:    ${duplicate.idModel}`)
    console.log(`  Status:   ${duplicate.active ? 'ativo' : 'inativo'}`)
    console.log('\nResultado: already-exists')
    return
  }

  console.log('Criando novo webhook...')
  const created = await createWebhook(key, token, callbackURL, boardId)
  console.log(`Webhook criado: ${created.id}`)
  console.log(`  Callback: ${created.callbackURL}`)
  console.log(`  Board:    ${created.idModel}`)
  console.log('\nResultado: created')
}

main().catch((error) => {
  console.error('Erro:', error instanceof Error ? error.message : error)
  process.exit(1)
})
