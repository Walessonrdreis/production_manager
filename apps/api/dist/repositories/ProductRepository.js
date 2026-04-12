"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRepository = void 0;
const db_1 = require("../db");
class ProductRepository {
    async findById(id) {
        return db_1.prisma.product.findUnique({
            where: { id },
        });
    }
    async findByOmieId(omieProductId) {
        return db_1.prisma.product.findUnique({
            where: { omieProductId },
        });
    }
    async create(data) {
        return db_1.prisma.product.create({
            data,
        });
    }
    async delete(id) {
        return db_1.prisma.product.delete({
            where: { id },
        });
    }
    async findAllWithDetails() {
        return db_1.prisma.product.findMany({
            include: {
                omieProduct: true,
                productSector: {
                    include: {
                        sector: true,
                    },
                },
            },
            orderBy: {
                omieProduct: {
                    description: 'asc',
                },
            },
        });
    }
    // --- Mapeamento Product Sector ---
    async findProductSector(productId) {
        return db_1.prisma.productSector.findUnique({
            where: { productId },
        });
    }
    async upsertProductSector(productId, sectorId, notes) {
        return db_1.prisma.productSector.upsert({
            where: { productId },
            create: {
                productId,
                sectorId,
                notes,
            },
            update: {
                sectorId,
                notes,
            },
        });
    }
}
exports.ProductRepository = ProductRepository;
