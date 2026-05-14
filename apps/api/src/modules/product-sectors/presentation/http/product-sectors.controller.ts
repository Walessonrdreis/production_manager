import type { FastifyReply, FastifyRequest } from 'fastify'
import { listSectorsQuerySchema, sectorIdParamsSchema, updateSectorBodySchema } from './product-sectors.schemas'

export function createProductSectorsController(deps: {
  listSectorsUseCase: { execute: (input: { includeInactive: boolean }) => any }
  updateSectorUseCase: { execute: (input: { id: string; data: any }) => any }
  deleteSectorUseCase: { execute: (input: { id: string }) => any }
}) {
  return {
    async list(request: FastifyRequest, reply: FastifyReply) {
      const query = listSectorsQuerySchema.parse(request.query)
      const sectors = await deps.listSectorsUseCase.execute({ includeInactive: query.includeInactive })
      return reply.code(200).send({ data: sectors })
    },

    async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
      const params = sectorIdParamsSchema.parse(request.params)
      const body = updateSectorBodySchema.parse(request.body)
      const sector = await deps.updateSectorUseCase.execute({ id: params.id, data: body })
      return reply.code(200).send({ data: sector })
    },

    async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
      const params = sectorIdParamsSchema.parse(request.params)
      await deps.deleteSectorUseCase.execute({ id: params.id })
      return reply.code(204).send()
    },
  }
}
