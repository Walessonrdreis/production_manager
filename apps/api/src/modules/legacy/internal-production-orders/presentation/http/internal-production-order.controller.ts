import { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { CreateInternalProductionOrderUseCase } from '../../application/use-cases/create-internal-production-order.usecase'
import { UpdateInternalProductionOrderUseCase } from '../../application/use-cases/update-internal-production-order.usecase'
import { StartInternalProductionOrderUseCase } from '../../application/use-cases/start-internal-production-order.usecase'
import { CompleteInternalProductionOrderUseCase } from '../../application/use-cases/complete-internal-production-order.usecase'
import { GetInternalProductionOrdersUseCase } from '../../application/use-cases/get-internal-production-orders.usecase'
import { GetInternalProductionOrderByIdUseCase } from '../../application/use-cases/get-internal-production-order-by-id.usecase'
import { DeleteInternalProductionOrderUseCase } from '../../application/use-cases/delete-internal-production-order.usecase'
import { CreateInternalProductionOrderSchema, UpdateInternalProductionOrderSchema, ListInternalProductionOrdersSchema } from '../../application/dtos/internal-production-order.dto'

export class InternalProductionOrderController {
  constructor(
    private readonly createUseCase: CreateInternalProductionOrderUseCase,
    private readonly updateUseCase: UpdateInternalProductionOrderUseCase,
    private readonly startUseCase: StartInternalProductionOrderUseCase,
    private readonly completeUseCase: CompleteInternalProductionOrderUseCase,
    private readonly listUseCase: GetInternalProductionOrdersUseCase,
    private readonly getByIdUseCase: GetInternalProductionOrderByIdUseCase,
    private readonly deleteUseCase: DeleteInternalProductionOrderUseCase,
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = CreateInternalProductionOrderSchema.parse(request.body)
      const result = await this.createUseCase.execute(validated)
      return reply.code(201).send({ success: true, data: result })
    } catch (error) {
      return this.handleError(error, request, reply)
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const validated = UpdateInternalProductionOrderSchema.parse(request.body)
      const result = await this.updateUseCase.execute(id, validated)
      return reply.code(200).send({ success: true, data: result })
    } catch (error) {
      return this.handleError(error, request, reply)
    }
  }

  async start(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const actorType = this.resolveActorType(request)
      const result = await this.startUseCase.execute(id, actorType)
      return reply.code(200).send({ success: true, data: result })
    } catch (error) {
      return this.handleError(error, request, reply)
    }
  }

  async complete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const actorType = this.resolveActorType(request)
      const result = await this.completeUseCase.execute(id, actorType)
      return reply.code(200).send({ success: true, data: result })
    } catch (error) {
      return this.handleError(error, request, reply)
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const validated = ListInternalProductionOrdersSchema.parse(request.query)
      const result = await this.listUseCase.execute(validated)
      return reply.code(200).send({ success: true, ...result })
    } catch (error) {
      return this.handleError(error, request, reply)
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      const result = await this.getByIdUseCase.execute(id)
      return reply.code(200).send({ success: true, data: result })
    } catch (error) {
      return this.handleError(error, request, reply)
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string }
      await this.deleteUseCase.execute(id)
      return reply.code(200).send({ success: true })
    } catch (error) {
      return this.handleError(error, request, reply)
    }
  }

  private handleError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
    if (error instanceof ZodError) {
      return reply.code(400).send({ success: false, error: 'Dados inválidos', details: error.errors })
    }
    if (error instanceof Error) {
      if (error.message.includes('não encontrada')) {
        return reply.code(404).send({ success: false, error: error.message })
      }
      if (error.message.includes('já existe')) {
        return reply.code(409).send({ success: false, error: error.message })
      }
      if (error.message.includes('não pode ser')) {
        return reply.code(422).send({ success: false, error: error.message })
      }
    }
    request.log.error({ error }, 'Erro interno no módulo internal-production-orders')
    return reply.code(500).send({ success: false, error: 'Erro interno ao processar solicitação' })
  }

  private resolveActorType(request: FastifyRequest): 'SYSTEM' | 'INTEGRATION' | 'USER' {
    const header = (request.headers['x-actor-type'] as string) || 'USER'
    if (header === 'SYSTEM' || header === 'INTEGRATION') return header
    return 'USER'
  }
}
