import { NotFoundError, ConflictError } from "@/shared/errors/domain-errors";

export function createUpdateSectorUseCase(deps: {
  sectorRepo: {
    findById: (id: string) => Promise<any | null>;
    findByName: (name: string) => Promise<any | null>;
    update: (id: string, data: any) => Promise<any>;
  };
}) {
  return {
    async execute(input: { id: string; data: any }) {
      const sector = await deps.sectorRepo.findById(input.id);
      if (!sector) throw new NotFoundError("Setor");

      if (input.data.name && input.data.name !== sector.name) {
        const collision = await deps.sectorRepo.findByName(input.data.name);
        if (collision) {
          throw new ConflictError("Um setor com este nome já existe.");
        }
      }

      return deps.sectorRepo.update(input.id, input.data);
    },
  };
}