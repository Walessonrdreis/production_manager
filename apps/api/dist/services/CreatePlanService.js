"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePlanService = void 0;
const PlanRepository_1 = require("../repositories/PlanRepository");
class CreatePlanService {
    planRepo;
    constructor(planRepo = new PlanRepository_1.PlanRepository()) {
        this.planRepo = planRepo;
    }
    async execute({ name, startDate, endDate }) {
        const plan = await this.planRepo.create({
            name,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        });
        return plan;
    }
}
exports.CreatePlanService = CreatePlanService;
