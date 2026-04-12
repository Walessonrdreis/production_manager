"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanRepository = void 0;
const db_1 = require("../db");
class PlanRepository {
    async findById(id) {
        return db_1.prisma.productionPlan.findUnique({
            where: { id },
        });
    }
    async findByIdWithDetails(id) {
        return db_1.prisma.productionPlan.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: { include: { omieProduct: true } },
                        sector: true,
                    },
                },
            },
        });
    }
    async findAll() {
        return db_1.prisma.productionPlan.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return db_1.prisma.productionPlan.create({
            data,
        });
    }
    // --- Itens do Plano ---
    async createItem(data) {
        return db_1.prisma.productionPlanItem.create({
            data,
        });
    }
}
exports.PlanRepository = PlanRepository;
