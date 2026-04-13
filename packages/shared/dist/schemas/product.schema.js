"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductSectorInputSchema = exports.CreateProductInputSchema = exports.ProductSchema = exports.ProductSectorSchema = exports.OmieProductSchema = void 0;
const zod_1 = require("zod");
const sector_schema_1 = require("./sector.schema");
exports.OmieProductSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    omieId: zod_1.z.string(),
    code: zod_1.z.string().nullable().optional(),
    familyDescription: zod_1.z.string().nullable().optional(),
    sku: zod_1.z.string().nullable(),
    description: zod_1.z.string(),
    active: zod_1.z.boolean(),
    stockQuantity: zod_1.z.string().nullable().optional(),
    minimumStock: zod_1.z.string().nullable().optional(),
    rawPayload: zod_1.z.any().optional(),
    lastSyncAt: zod_1.z.string().datetime().or(zod_1.z.date()),
});
exports.ProductSectorSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    sectorId: zod_1.z.string().uuid(),
    notes: zod_1.z.string().nullable().optional(),
    sector: sector_schema_1.SectorSchema.optional(), // Populated in some responses
});
exports.ProductSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    omieProductId: zod_1.z.string().uuid(),
    nickname: zod_1.z.string().nullable().optional(),
    active: zod_1.z.boolean(),
    omieProduct: exports.OmieProductSchema.optional(), // Populated in some responses
    productSector: exports.ProductSectorSchema.nullable().optional(), // Populated in some responses
});
// Input schemas para as APIs
exports.CreateProductInputSchema = zod_1.z.object({
    omieProductId: zod_1.z.string().uuid(),
});
exports.UpdateProductSectorInputSchema = zod_1.z.object({
    sectorId: zod_1.z.string().uuid('ID de setor inválido'),
    notes: zod_1.z.string().optional(),
});
