"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePlanItemService = void 0;
const domainErrors_1 = require("../utils/domainErrors");
const PlanRepository_1 = require("../repositories/PlanRepository");
const ProductRepository_1 = require("../repositories/ProductRepository");
const SectorRepository_1 = require("../repositories/SectorRepository");
class CreatePlanItemService {
    planRepo;
    productRepo;
    sectorRepo;
    constructor(planRepo = new PlanRepository_1.PlanRepository(), productRepo = new ProductRepository_1.ProductRepository(), sectorRepo = new SectorRepository_1.SectorRepository()) {
        this.planRepo = planRepo;
        this.productRepo = productRepo;
        this.sectorRepo = sectorRepo;
    }
    async execute({ planId, productId, quantity, sectorId, notes, }) {
        const plan = await this.planRepo.findById(planId);
        if (!plan) {
            throw new domainErrors_1.NotFoundError('Plano');
        }
        const product = await this.productRepo.findById(productId);
        if (!product) {
            throw new domainErrors_1.NotFoundError('Produto');
        }
        let finalSectorId = sectorId;
        if (!finalSectorId) {
            const productSector = await this.productRepo.findProductSector(productId);
            if (!productSector) {
                throw new domainErrors_1.MissingDefaultSectorError();
            }
            finalSectorId = productSector.sectorId;
        }
        else {
            const sector = await this.sectorRepo.findById(finalSectorId);
            if (!sector || !sector.active) {
                throw new domainErrors_1.ValidationError('Setor inválido ou inativo');
            }
        }
        const item = await this.planRepo.createItem({
            planId,
            productId,
            sectorId: finalSectorId,
            quantity,
            notes,
        });
        return item;
    }
}
exports.CreatePlanItemService = CreatePlanItemService;
