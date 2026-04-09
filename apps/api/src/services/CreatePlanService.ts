import { PlanRepository } from '../repositories/PlanRepository';

interface IRequest {
  name: string;
  startDate: Date | string;
  endDate: Date | string;
}

export class CreatePlanService {
  constructor(private planRepo = new PlanRepository()) {}

  async execute({ name, startDate, endDate }: IRequest) {
    const plan = await this.planRepo.create({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    return plan;
  }
}
