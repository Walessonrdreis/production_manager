"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSectorService = void 0;
const SectorRepository_1 = require("../repositories/SectorRepository");
const domainErrors_1 = require("../utils/domainErrors");
class CreateSectorService {
    sectorRepo;
    constructor(sectorRepo = new SectorRepository_1.SectorRepository()) {
        this.sectorRepo = sectorRepo;
    }
    async execute({ name, order = 0 }) {
        const existingSector = await this.sectorRepo.findByName(name);
        if (existingSector) {
            throw new domainErrors_1.ConflictError('Um setor com este nome já existe.');
        }
        const sector = await this.sectorRepo.create({
            name,
            order,
        });
        return sector;
    }
}
exports.CreateSectorService = CreateSectorService;
