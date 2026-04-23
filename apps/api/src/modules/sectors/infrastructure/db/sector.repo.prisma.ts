export function createSectorRepoPrisma(prisma: any) {
  return {
    findById(id: string) {
      return prisma.sector.findUnique({ where: { id } });
    },

    findByName(name: string) {
      return prisma.sector.findUnique({ where: { name } });
    },

    list(includeInactive: boolean = false) {
      return prisma.sector.findMany({
        where: includeInactive ? undefined : { active: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      });
    },

    create(data: { name: string; order?: number | null }) {
      return prisma.sector.create({ data });
    },

    update(id: string, data: any) {
      return prisma.sector.update({ where: { id }, data });
    },

    softDelete(id: string) {
      return prisma.sector.update({
        where: { id },
        data: { active: false },
      });
    },
  };
}