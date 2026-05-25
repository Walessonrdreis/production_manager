import {
  listSectorsQuerySchema,
  sectorIdParamsSchema,
  createSectorBodySchema,
  updateSectorBodySchema,
} from "./sectors.schemas";
import { paginated, wantsLegacyResponse } from "@/shared/http/response";

export function createSectorsController(useCases: any) {
  return {
    async create(request: any, reply: any) {
      const body = createSectorBodySchema.parse(request.body);
      const sector = await useCases.createSector.execute(body);
      return reply.status(201).send(sector);
    },

    async list(request: any, reply: any) {
      const { includeInactive } = listSectorsQuerySchema.parse(request.query);
      const sectors = await useCases.listSectors.execute({ includeInactive });

      if (wantsLegacyResponse(request)) {
        return reply.send({ items: sectors });
      }

      return reply.send(
        paginated(sectors, {
          page: 1,
          pageSize: sectors.length,
          total: sectors.length,
        })
      );
    },

    async update(request: any, reply: any) {
      const { id } = sectorIdParamsSchema.parse(request.params);
      const data = updateSectorBodySchema.parse(request.body);
      const sector = await useCases.updateSector.execute({ id, data });
      return reply.send(sector);
    },

    async remove(request: any, reply: any) {
      const { id } = sectorIdParamsSchema.parse(request.params);
      const sector = await useCases.deleteSector.execute({ id });
      return reply.send(sector);
    },
  };
}