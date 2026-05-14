import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ProcessTrelloWebhookUseCase } from '../../../application/use-cases/process-trello-webhook.use-case'
import type { TrelloWebhookEvent } from '../../../application/dtos/trello-webhook-event.dto'

export class TrelloWebhookController {
  constructor(private readonly processWebhook: ProcessTrelloWebhookUseCase) {}

  async handlePost(request: FastifyRequest, reply: FastifyReply) {
    try {
      const event = request.body as TrelloWebhookEvent
      const result = await this.processWebhook.execute(event)
      return reply.code(200).send(result)
    } catch (error) {
      request.log.error({ error: error instanceof Error ? error.message : 'unknown' }, 'Erro no webhook POST')
      return reply.code(200).send({ handled: false, created: false, reason: 'internal-error' })
    }
  }

  async handleGet(request: FastifyRequest, reply: FastifyReply) {
    const challenge = (request.query as { 'hub.challenge'?: string })['hub.challenge']
    if (challenge) {
      return reply.code(200).send(Number(challenge))
    }
    return reply.code(200).send({ ok: true, message: 'Webhook endpoint ativo' })
  }
}
