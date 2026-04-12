"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetProductDefaultSectorService = void 0;
const ProductRepository_1 = require("../repositories/ProductRepository");
const SectorRepository_1 = require("../repositories/SectorRepository");
const domainErrors_1 = require("../utils/domainErrors");
class SetProductDefaultSectorService {
    productRepo;
    sectorRepo;
    constructor(productRepo = new ProductRepository_1.ProductRepository(), sectorRepo = new SectorRepository_1.SectorRepository()) {
        this.productRepo = productRepo;
        this.sectorRepo = sectorRepo;
    }
    async execute({ productId, sectorId, notes }) {
        const product = await this.productRepo.findById(productId);
        if (!product) {
            throw new domainErrors_1.NotFoundError('Produto');
        }
        const sector = await this.sectorRepo.findById(sectorId);
        if (!sector || !sector.active) {
            throw new domainErrors_1.ValidationError('Setor não encontrado ou inativo.');
        }
        const productSector = await this.productRepo.upsertProductSector(productId, sectorId, notes);
        return productSector;
    }
}
exports.SetProductDefaultSectorService = SetProductDefaultSectorService;
