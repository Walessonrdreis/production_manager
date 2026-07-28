"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSectorInputSchema = exports.CreateSectorInputSchema = exports.SectorSchema = void 0;
const zod_1 = require("zod");
exports.SectorSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    order: zod_1.z.number().int(),
    active: zod_1.z.boolean(),
});
// Input schemas para as APIs
exports.CreateSectorInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome do setor é obrigatório'),
    order: zod_1.z.number().int().optional().default(0),
});
exports.UpdateSectorInputSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    order: zod_1.z.number().int().optional(),
    active: zod_1.z.boolean().optional(),
});
