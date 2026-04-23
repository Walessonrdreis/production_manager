import { NotFoundError } from "@/shared/errors/domain-errors";

export function createDeleteSectorUseCase(deps: {
  sectorRepo: {
    findById: (id: string) => Promise<any | null>;
    softDelete: (id: string) => Promise<any>;
  };
}) {
  return {
    async execute(input: { id: string }) {
      const sector = await deps.sectorRepo.findById(input.id);
      if (!sector) throw new NotFoundError("Setor");

      return deps.sectorRepo.softDelete(input.id);
    },
  };
}