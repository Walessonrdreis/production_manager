"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SectorRepository = void 0;
const db_1 = require("../db");
class SectorRepository {
    async findById(id) {
        return db_1.prisma.sector.findUnique({
            where: { id },
        });
    }
    async findByName(name) {
        return db_1.prisma.sector.findUnique({
            where: { name },
        });
    }
    async findAll(includeInactive = false) {
        return db_1.prisma.sector.findMany({
            where: includeInactive ? undefined : { active: true },
            orderBy: [
                { order: 'asc' },
                { name: 'asc' },
            ],
        });
    }
    async create(data) {
        return db_1.prisma.sector.create({
            data,
        });
    }
    async update(id, data) {
        return db_1.prisma.sector.update({
            where: { id },
            data,
        });
    }
    async softDelete(id) {
        return db_1.prisma.sector.update({
            where: { id },
            data: { active: false },
        });
    }
}
exports.SectorRepository = SectorRepository;
