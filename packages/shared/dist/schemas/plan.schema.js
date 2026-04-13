"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPlanItemInputSchema = exports.CreatePlanInputSchema = exports.ProductionPlanSchema = exports.ProductionPlanItemSchema = exports.PlanStatusEnum = void 0;
const zod_1 = require("zod");
const sector_schema_1 = require("./sector.schema");
const product_schema_1 = require("./product.schema");
exports.PlanStatusEnum = zod_1.z.enum(['DRAFT', 'PUBLISHED', 'CLOSED']);
exports.ProductionPlanItemSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    planId: zod_1.z.string().uuid(),
    productId: zod_1.z.string().uuid(),
    sectorId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive(),
    notes: zod_1.z.string().nullable().optional(),
    // Relações embutidas (quando feitas via populate do Prisma)
    sector: sector_schema_1.SectorSchema.optional(),
    product: product_schema_1.ProductSchema.optional(),
});
exports.ProductionPlanSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    startDate: zod_1.z.string().datetime().or(zod_1.z.date()),
    endDate: zod_1.z.string().datetime().or(zod_1.z.date()),
    status: exports.PlanStatusEnum,
    createdAt: zod_1.z.string().datetime().or(zod_1.z.date()),
    items: zod_1.z.array(exports.ProductionPlanItemSchema).optional(),
});
// Input schemas para as APIs
exports.CreatePlanInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    startDate: zod_1.z.string().datetime({ offset: true }),
    endDate: zod_1.z.string().datetime({ offset: true }),
});
exports.AddPlanItemInputSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    quantity: zod_1.z.number().int().positive(),
    sectorId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().optional(),
});
