"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sectorRoutes = sectorRoutes;
const zod_1 = require("zod");
const db_1 = require("../db");
const CreateSectorService_1 = require("../services/CreateSectorService");
const domainErrors_1 = require("../utils/domainErrors");
const contracts_1 = require("@shared/contracts");
const http_1 = require("../lib/http");
async function sectorRoutes(app) {
    // POST /v1/sectors
    app.post('/v1/sectors', async (request, reply) => {
        const parseResult = contracts_1.CreateSectorInputSchema.safeParse(request.body);
        if (!parseResult.success) {
            throw new domainErrors_1.ValidationError('Dados inválidos.', parseResult.error.format());
        }
        const { name, order } = parseResult.data;
        const service = new CreateSectorService_1.CreateSectorService();
        const sector = await service.execute({ name, order });
        return reply.status(201).send(sector);
    });
    // GET /v1/sectors
    app.get('/v1/sectors', async (request, reply) => {
        const querySchema = zod_1.z.object({
            includeInactive: zod_1.z.coerce.boolean().optional().default(false),
        });
        const { includeInactive } = querySchema.parse(request.query);
        const sectors = await db_1.prisma.sector.findMany({
            where: includeInactive ? undefined : { active: true },
            orderBy: [
                { order: 'asc' },
                { name: 'asc' },
            ],
        });
        if ((0, http_1.wantsLegacyResponse)(request)) {
            return reply.send({ items: sectors });
        }
        return reply.send((0, http_1.paginated)(sectors, {
            page: 1,
            pageSize: sectors.length,
            total: sectors.length,
        }));
    });
    // PATCH /v1/sectors/:id
    app.patch('/v1/sectors/:id', async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            id: zod_1.z.string().uuid('ID inválido'),
        });
        const paramsResult = paramsSchema.safeParse(request.params);
        if (!paramsResult.success) {
            throw new domainErrors_1.ValidationError('ID de rota inválido.', paramsResult.error.format());
        }
        const bodyResult = contracts_1.UpdateSectorInputSchema.safeParse(request.body);
        if (!bodyResult.success) {
            throw new domainErrors_1.ValidationError('Dados de atualização inválidos.', bodyResult.error.format());
        }
        const { id } = paramsResult.data;
        const data = bodyResult.data;
        // Verifica se o setor existe
        const sector = await db_1.prisma.sector.findUnique({
            where: { id },
        });
        if (!sector) {
            throw new domainErrors_1.NotFoundError('Setor');
        }
        // Se estiver tentando alterar o nome, verifica colisão
        if (data.name && data.name !== sector.name) {
            const existingName = await db_1.prisma.sector.findUnique({
                where: { name: data.name },
            });
            if (existingName) {
                throw new domainErrors_1.ConflictError('Um setor com este nome já existe.');
            }
        }
        const updatedSector = await db_1.prisma.sector.update({
            where: { id },
            data,
        });
        return reply.send(updatedSector);
    });
    // DELETE /v1/sectors/:id (soft delete)
    app.delete('/v1/sectors/:id', async (request, reply) => {
        const paramsSchema = zod_1.z.object({
            id: zod_1.z.string().uuid('ID inválido'),
        });
        const paramsResult = paramsSchema.safeParse(request.params);
        if (!paramsResult.success) {
            throw new domainErrors_1.ValidationError('ID de rota inválido.', paramsResult.error.format());
        }
        const { id } = paramsResult.data;
        const sector = await db_1.prisma.sector.findUnique({
            where: { id },
        });
        if (!sector) {
            throw new domainErrors_1.NotFoundError('Setor');
        }
        const deletedSector = await db_1.prisma.sector.update({
            where: { id },
            data: { active: false },
        });
        return reply.send(deletedSector);
    });
}
