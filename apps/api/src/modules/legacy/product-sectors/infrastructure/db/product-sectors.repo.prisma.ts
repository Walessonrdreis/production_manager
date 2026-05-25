export const DEFAULT_SECTORS = ['Refino', 'Temperagem', 'Confeitaria', 'Embalagem'] as const

export function createProductSectorsRepoPrisma(prisma: any) {
  return {
    findById(id: string) {
      return prisma.sector.findUnique({ where: { id } })
    },

    findByName(name: string) {
      return prisma.sector.findUnique({ where: { name } })
    },

    list(includeInactive: boolean = false) {
      return prisma.sector.findMany({
        where: includeInactive ? undefined : { active: true },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      })
    },

    create(data: { name: string; order?: number | null }) {
      return prisma.sector.create({ data })
    },

    update(id: string, data: { name?: string; order?: number | null; active?: boolean }) {
      return prisma.sector.update({ where: { id }, data })
    },

    softDelete(id: string) {
      return prisma.sector.update({ where: { id }, data: { active: false } })
    },

    upsertDefault(name: string) {
      return prisma.sector.upsert({
        where: { name },
        update: { active: true },
        create: { name, active: true },
      })
    },
  }
}
