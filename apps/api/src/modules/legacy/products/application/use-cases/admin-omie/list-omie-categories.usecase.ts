export function createListOmieCategoriesUseCase(deps: { prisma: any }) {
  return {
    async execute(input: { q?: string }) {
      const normalizedQ = input.q?.trim();

      const items = (await deps.prisma.omieProduct.findMany({
        select: { familyDescription: true },
        distinct: ["familyDescription"],
        orderBy: { familyDescription: "asc" },
        where: normalizedQ
          ? { familyDescription: { contains: normalizedQ, mode: "insensitive" } }
          : { familyDescription: { not: null } },
      })) as Array<{ familyDescription: string | null }>;

      const families = items
        .map((i) => i.familyDescription?.trim())
        .filter((v): v is string => Boolean(v));

      return { families };
    },
  };
}