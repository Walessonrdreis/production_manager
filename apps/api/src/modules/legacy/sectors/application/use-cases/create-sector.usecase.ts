import { ConflictError } from "@/shared/errors/domain-errors";

export function createCreateSectorUseCase(deps: {
  sectorRepo: {
    findByName: (name: string) => Promise<any | null>;
    create: (data: any) => Promise<any>;
  };
}) {
  return {
    async execute(input: { name: string; order?: number | null }) {
      const existing = await deps.sectorRepo.findByName(input.name);
      if (existing) {
        throw new ConflictError("Um setor com este nome já existe.");
      }

      return deps.sectorRepo.create({
        name: input.name,
        order: input.order,
      });
    },
  };
}